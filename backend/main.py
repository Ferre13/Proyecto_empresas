from fastapi import FastAPI
from core.config import settings
from core.database import engine, Base

# NO llamar a Base.metadata.create_all(bind=engine) aquí en un proyecto de producción real (usaríamos Alembic).
# Para este MVP inicial, podemos dejarlo comentado o habilitado temporalmente.
# Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware
from routers import upload, invoices, mappings, webhooks, billing

app = FastAPI(
    title="B2B AP Automation API",
    description="SaaS de extracción automática de facturas mediante Gemini Multimodal.",
    version="1.0.0"
)

# Configuración de CORS
allowed_origins = [
    settings.FRONTEND_URL.rstrip("/"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(invoices.router)
app.include_router(mappings.router)
app.include_router(webhooks.router)
app.include_router(billing.router)

@app.get("/status")
def get_status():
    return {
        "status": "online",
        "description": "API is running. Multi-tenant context active.",
        "db_url_configured": bool(settings.DATABASE_URL),
        "redis_url_configured": bool(settings.REDIS_URL)
    }

# Los routers se incluirán aquí posteriormente, ej:
# app.include_router(auth.router, prefix="/auth")
# app.include_router(upload.router, prefix="/upload")
