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

# Configuración de CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiar por la URL del frontend
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
