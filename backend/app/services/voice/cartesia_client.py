import httpx
from typing import Optional
from app.core.config import settings
from app.core.logging import logger

CARTESIA_API_URL = "https://api.cartesia.ai/tts/bytes"
# sonic-multilingual is sunsetted; sonic-3.6 supports Hindi
DEFAULT_MODEL = "sonic-3.6"
API_VERSION = "2026-08-14"


def is_tts_configured() -> bool:
    return bool(settings.CARTESIA_API_KEY)


async def synthesize_cartesia_wav(text: str, language: str = "hi", voice_id: Optional[str] = None) -> Optional[bytes]:
    """Return WAV audio bytes from Cartesia, or None if unavailable/failed."""
    if not settings.CARTESIA_API_KEY or not text.strip():
        return None

    model_id = getattr(settings, "CARTESIA_MODEL", None) or DEFAULT_MODEL
    v_id = voice_id or settings.CARTESIA_VOICE_ID
    lang = "hi" if language.startswith("hi") else ("en" if language.startswith("en") else language)

    headers = {
        "X-API-Key": settings.CARTESIA_API_KEY,
        "Cartesia-Version": API_VERSION,
        "Content-Type": "application/json",
    }

    # Modern API: voice is a string id; keep object fallback for older versions
    payloads = [
        {
            "model_id": model_id,
            "transcript": text.strip()[:800],
            "voice": v_id,
            "language": lang,
            "output_format": {
                "container": "wav",
                "encoding": "pcm_s16le",
                "sample_rate": 24000,
            },
        },
        {
            "model_id": "sonic-turbo",
            "transcript": text.strip()[:800],
            "voice": {"mode": "id", "id": v_id},
            "language": lang,
            "output_format": {
                "container": "wav",
                "encoding": "pcm_s16le",
                "sample_rate": 24000,
            },
        },
    ]

    versions = [API_VERSION, "2025-04-16", "2024-06-10"]

    async with httpx.AsyncClient(timeout=30.0) as client:
        for payload in payloads:
            for ver in versions:
                headers["Cartesia-Version"] = ver
                try:
                    response = await client.post(CARTESIA_API_URL, headers=headers, json=payload)
                    if response.status_code == 200 and response.content:
                        return response.content
                    logger.warning(
                        f"Cartesia TTS {response.status_code} model={payload.get('model_id')} ver={ver}: "
                        f"{response.text[:160]}"
                    )
                except Exception as e:
                    logger.error(f"Cartesia TTS exception: {e}")
    return None


async def stream_cartesia_tts(text: str, voice_id: Optional[str] = None):
    """Compatibility generator used by older voice orchestrator code."""
    audio = await synthesize_cartesia_wav(text, voice_id=voice_id)
    if audio:
        yield audio
