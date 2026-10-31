from typing import Optional, Dict, Any, Callable
import httpx
from app.core.config import settings
from app.core.logging import logger

DEEPGRAM_LISTEN_URL = "https://api.deepgram.com/v1/listen"


def is_stt_configured() -> bool:
    return bool(settings.DEEPGRAM_API_KEY)


class DeepgramLiveStreamer:
    """Placeholder for live WS streaming; REST STT is used by the app today."""

    def __init__(self, on_transcript: Callable, lang: str = "hi"):
        self.api_key = settings.DEEPGRAM_API_KEY
        self.on_transcript = on_transcript
        self.lang = lang
        self.ws = None

    def is_configured(self) -> bool:
        return bool(self.api_key)


async def transcribe_audio(
    audio_bytes: bytes,
    language: str = "hi",
    mime_type: str = "audio/webm",
) -> Dict[str, Any]:
    """
    Transcribe recorded audio via Deepgram prerecorded API.
    Returns {transcript, confidence, raw_language}.
    """
    if not settings.DEEPGRAM_API_KEY:
        return {"transcript": "", "confidence": 0.0, "error": "Deepgram not configured"}

    if not audio_bytes:
        return {"transcript": "", "confidence": 0.0, "error": "Empty audio"}

    lang = "hi" if language.startswith("hi") else ("en" if language.startswith("en") else language)
    # nova-3 if available, else nova-2
    params = {
        "model": "nova-2",
        "language": lang,
        "smart_format": "true",
        "punctuate": "true",
    }
    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
        "Content-Type": mime_type or "audio/webm",
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            # Try nova-3 first for better Hindi, fall back to nova-2
            for model in ("nova-3", "nova-2"):
                params["model"] = model
                response = await client.post(
                    DEEPGRAM_LISTEN_URL,
                    params=params,
                    headers=headers,
                    content=audio_bytes,
                )
                if response.status_code == 200:
                    data = response.json()
                    alt = (
                        data.get("results", {})
                        .get("channels", [{}])[0]
                        .get("alternatives", [{}])[0]
                    )
                    transcript = (alt.get("transcript") or "").strip()
                    confidence = float(alt.get("confidence") or 0.0)
                    return {
                        "transcript": transcript,
                        "confidence": confidence,
                        "model": model,
                    }
                logger.warning(f"Deepgram {model} status {response.status_code}: {response.text[:160]}")
            return {
                "transcript": "",
                "confidence": 0.0,
                "error": f"Deepgram error {response.status_code}",
            }
    except Exception as e:
        logger.error(f"Deepgram STT exception: {e}")
        return {"transcript": "", "confidence": 0.0, "error": str(e)}
