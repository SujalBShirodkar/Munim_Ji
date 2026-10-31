import json
from typing import Optional, Callable, Any
from app.core.config import settings
from app.core.logging import logger

class DeepgramLiveStreamer:
    """Manages streaming audio transcription via Deepgram WebSocket."""
    def __init__(self, on_transcript: Callable[[str, float, bool], Any], lang: str = "hi"):
        self.api_key = settings.DEEPGRAM_API_KEY
        self.on_transcript = on_transcript
        self.lang = lang
        self.ws = None

    def is_configured(self) -> bool:
        return bool(self.api_key)

