from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.deps import get_current_user_payload
from app.core.config import settings
from app.services.analytics.summary import get_sales_summary, get_pending_settlement
from app.services.analytics.inventory import get_inventory_status
from app.services.pooling.matcher import find_eligible_group_orders
from app.services.lending.mock_nbfc import mock_nbfc
from app.services.voice.orchestrator import process_voice_turn
from app.services.voice.cartesia_client import synthesize_cartesia_wav, is_tts_configured
from app.services.voice.deepgram_client import transcribe_audio, is_stt_configured

router = APIRouter(prefix="/assistant", tags=["assistant"])


class ChatRequest(BaseModel):
    query: str
    language: Optional[str] = "hi"
    history: Optional[List[Dict[str, str]]] = None


class TtsRequest(BaseModel):
    text: str
    language: Optional[str] = "hi"


@router.get("/voice-status")
async def voice_status(user: dict = Depends(get_current_user_payload)):
    """Tell the frontend which cloud voice features are live."""
    return {
        "llm": bool(settings.GROQ_API_KEY),
        "llm_model": settings.GROQ_MODEL_MAIN if settings.GROQ_API_KEY else None,
        "tts": is_tts_configured(),
        "stt": is_stt_configured(),
        "tts_provider": "cartesia" if is_tts_configured() else "browser",
        "stt_provider": "deepgram" if is_stt_configured() else "browser",
    }


@router.get("/briefing")
async def get_morning_briefing(user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")

    yest = await get_sales_summary(merchant_id, "yesterday")
    settlement = await get_pending_settlement(merchant_id)
    inventory = await get_inventory_status(merchant_id)
    pools = await find_eligible_group_orders(merchant_id, "sugar")
    sugar_pool = pools[0] if pools else None
    credit = await mock_nbfc.get_eligibility_offer(merchant_id)

    spoken = (
        f"Namaste Sharma ji! Kal Paytm par {yest['total_sales_rupees']:,.0f} rupaye ki bikri hui. "
        f"Cheeni ke group order me 9 dukaane jud chuki hain, jisme 45 rupaye per bag bachat ka mauka hai."
    )

    bullets = [
        f"Kal ki bikri: ₹{yest['total_sales_rupees']:,.2f} ({yest['transaction_count']} transactions). Peak hour: {yest['best_hour']}.",
        f"Pending settlement: ₹{settlement['amount_rupees']:,.2f} dopahar 12 baje tak account me aayega.",
        f"Stock alert: {inventory['low_stock_count']} items (Sugar, Wagh Bakri Tea) reorder level se kam hain.",
        f"Pooled Buying: Cheeni (Madhur 50kg) me ₹45/bag bachat unlock hone wali hai (72/100 bags met).",
        f"Instant Credit: ₹{credit['pre_approved_limit_rupees']:,.0f} pre-approved limit uplabdh hai.",
    ]

    return {
        "spoken_text": spoken,
        "bullets": bullets,
        "yesterday_sales": yest,
        "pending_settlement": settlement,
        "low_stock_items": inventory["low_stock_items"],
        "active_group_order": sugar_pool,
        "credit_summary": credit,
    }


@router.post("/chat")
async def chat_text(body: ChatRequest, user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await process_voice_turn(
        transcript=body.query,
        merchant_id=merchant_id,
        lang=body.language or "hi",
    )


@router.post("/tts")
async def text_to_speech(body: TtsRequest, user: dict = Depends(get_current_user_payload)):
    """Cartesia TTS → WAV. Frontend falls back to browser speech if this fails."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text required")
    if not is_tts_configured():
        raise HTTPException(status_code=503, detail="Cartesia TTS not configured")

    audio = await synthesize_cartesia_wav(body.text, language=body.language or "hi")
    if not audio:
        raise HTTPException(status_code=502, detail="TTS synthesis failed")
    return Response(content=audio, media_type="audio/wav")


@router.post("/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    language: str = Form("hi"),
    user: dict = Depends(get_current_user_payload),
):
    """Deepgram STT for recorded mic audio (webm/wav/ogg)."""
    if not is_stt_configured():
        raise HTTPException(status_code=503, detail="Deepgram STT not configured")

    audio = await file.read()
    if not audio:
        raise HTTPException(status_code=400, detail="Empty audio")

    mime = file.content_type or "audio/webm"
    result = await transcribe_audio(audio, language=language or "hi", mime_type=mime)
    if result.get("error") and not result.get("transcript"):
        raise HTTPException(status_code=502, detail=result["error"])
    return result
