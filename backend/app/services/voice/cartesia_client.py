import os
import httpx
from typing import AsyncGenerator, Optional
from app.core.config import settings
from app.core.logging import logger

CARTESIA_API_URL = "https://api.cartesia.ai/tts/bytes"

async def stream_cartesia_tts(text: str, voice_id: Optional[str] = None) -> AsyncGenerator[bytes, None]:
    """Streams audio bytes from Cartesia Sonic TTS API."""
    if not settings.CARTESIA_API_KEY:
        logger.info("Cartesia API key not configured. Skipping remote TTS streaming.")
        return

    v_id = voice_id or settings.CARTESIA_VOICE_ID
    headers = {
        "X-API-Key": settings.CARTESIA_API_KEY,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json"
    }

    payload = {
        "model_id": "sonic-multilingual",
        "transcript": text,
        "voice": {
            "mode": "id",
            "id": v_id
        },
        "output_format": {
            "container": "wav",
            "encoding": "pcm_s16le",
            "sample_rate": 24000
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            async with client.stream("POST", CARTESIA_API_URL, headers=headers, json=payload) as response:
                if response.status_code == 200:
                    async for chunk in response.aiter_bytes():
                        if chunk:
                            yield chunk
                else:
                    logger.error(f"Cartesia TTS error {response.status_code}: {await response.aread()}")
    except Exception as e:
        logger.error(f"Cartesia streaming exception: {e}")

