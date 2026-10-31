from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.db.indexes import create_indexes

# Import all routers
from app.routers import (
    auth,
    merchants,
    transactions,
    assistant,
    ws_voice,
    whatif,
    pool,
    supplier,
    payments,
    credit,
    savings,
    admin
)

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} in '{settings.ENVIRONMENT}' environment...")
    await connect_to_mongo()
    await create_indexes()
    yield
    # Shutdown
    logger.info("Shutting down Munim Ji API...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.APP_NAME,
    description="Voice-first AI Business Partner for Every Paytm Merchant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health checks
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "payments_mode": settings.PAYMENTS_MODE
    }

@app.get("/ready")
async def readiness_check():
    return {"status": "ready", "database": "connected"}

# Include routers
app.include_router(auth.router)
app.include_router(merchants.router)
app.include_router(transactions.router)
app.include_router(assistant.router)
app.include_router(ws_voice.router)
app.include_router(whatif.router)
app.include_router(pool.router)
app.include_router(supplier.router)
app.include_router(payments.router)
app.include_router(credit.router)
app.include_router(savings.router)
app.include_router(admin.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

