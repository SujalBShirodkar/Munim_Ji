import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.db.mongo import get_database
from app.services.llm.groq_client import run_agent_loop
from app.services.voice.cartesia_client import stream_cartesia_tts
from app.core.logging import logger

async def process_voice_turn(
    transcript: str,
    merchant_id: str,
    lang: str = "hi",
    stt_conf: float = 0.95,
    stt_latency_ms: float = 150.0
) -> Dict[str, Any]:
    """
    Orchestrates:
    1. STT validation & low-confidence check
    2. LLM tool-calling agent loop
    3. Latency measurement & DB logging
    """
    start_total = time.time()
    db = get_database()

    # Low-confidence STT guardrail (< 0.60 asks clarification)
    if stt_conf < 0.60:
        clarification_spoken = "Kya aapne sales ya kisi product ke price badhane ki baat ki? Kripya dobara bolein."
        clarification_display = "STT Low Confidence: Kripya dobara bolein (sales, price change, ya group order)."
        return {
            "spoken_text": clarification_spoken,
            "display_text": clarification_display,
            "ui_actions": [],
            "latencies": {"stt": stt_latency_ms, "llm": 10.0, "tts": 0.0, "total": 20.0},
            "detected_language": "hi",
        }

    # Run Groq agent loop
    start_llm = time.time()
    agent_response = await run_agent_loop(transcript, merchant_id, user_lang=lang)
    llm_latency_ms = round((time.time() - start_llm) * 1000, 1)

    total_latency_ms = round((time.time() - start_total) * 1000 + stt_latency_ms, 1)

    latencies = {
        "stt": stt_latency_ms,
        "llm": llm_latency_ms,
        "tts": 200.0,
        "total": total_latency_ms
    }

    # Save turn in conversations collection for debugging and STT quality tracking
    now = datetime.now(timezone.utc)
    turn_record = {
        "transcript": transcript,
        "stt_conf": stt_conf,
        "lang": lang,
        "tools_called": agent_response.get("tools_called", []),
        "response_spoken": agent_response.get("spoken_text", ""),
        "response_display": agent_response.get("display_text", ""),
        "latencies": latencies,
        "at": now
    }

    try:
        await db.conversations.update_one(
            {"merchant_id": merchant_id},
            {
                "$push": {"turns": turn_record},
                "$setOnInsert": {"created_at": now}
            },
            upsert=True
        )
    except Exception as e:
        logger.warning(f"Could not log conversation turn: {e}")

    spoken = str(agent_response.get("spoken_text") or "")
    spoken = (
        spoken.replace("₹", "rupees ")
        .replace("???", "")
        .replace(",", "")
    )
    # Collapse double spaces after replacements
    spoken = " ".join(spoken.split())

    return {
        "spoken_text": spoken,
        "display_text": agent_response.get("display_text", ""),
        "ui_actions": agent_response.get("ui_actions", []),
        "tools_called": agent_response.get("tools_called", []),
        "latencies": latencies,
        "detected_language": agent_response.get("detected_language", "hi" if lang.startswith("hi") else "en"),
    }
