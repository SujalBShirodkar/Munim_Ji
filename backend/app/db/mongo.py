from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger

client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[settings.MONGO_DB_NAME]
        # Ping the server
        await db.command("ping")
        logger.info(f"Connected to MongoDB at {settings.MONGO_URI}, database: {settings.MONGO_DB_NAME}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("Closed MongoDB connection.")

def get_database() -> AsyncIOMotorDatabase:
    global db
    if db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db

