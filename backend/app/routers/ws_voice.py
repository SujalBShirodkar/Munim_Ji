import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.voice.orchestrator import process_voice_turn
from app.core.logging import logger

router = APIRouter(tags=["voice"])

@router.websocket("/ws/voice")
async def websocket_voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Voice WebSocket connected")
    merchant_id = "merchant_sharma_001"

    try:
        while True:
            # Receive text or audio control packets from frontend
            message_text = await websocket.receive_text()
            data = json.loads(message_text)
            event_type = data.get("type", "transcript")

            if event_type == "transcript":
                transcript = data.get("text", "")
                conf = float(data.get("confidence", 0.95))
                lang = data.get("lang", "hi")
                m_id = data.get("merchant_id", merchant_id)

                if transcript.strip():
                    # Send thinking state
                    await websocket.send_text(json.dumps({"type": "status", "status": "thinking"}))

                    response = await process_voice_turn(
                        transcript=transcript,
                        merchant_id=m_id,
                        lang=lang,
                        stt_conf=conf
                    )

                    # Send back response
                    await websocket.send_text(json.dumps({
                        "type": "response",
                        "spoken_text": response["spoken_text"],
                        "display_text": response["display_text"],
                        "ui_actions": response["ui_actions"],
                        "latencies": response["latencies"]
                    }))

            elif event_type == "barge_in":
                # User interrupted speech playback
                await websocket.send_text(json.dumps({"type": "interrupted"}))

            elif event_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        logger.info("Voice WebSocket disconnected")
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}")

