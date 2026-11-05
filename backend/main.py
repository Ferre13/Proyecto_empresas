import os
import base64
import secrets
from fastapi import FastAPI, Request
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from core.config import settings
from core.database import engine, Base

# Importar todos los modelos para que Base.metadata.create_all cree las tablas automáticamente
import models.tenant  # noqa: F401
import models.user  # noqa: F401
import models.batch  # noqa: F401
import models.invoice  # noqa: F401
import models.mapping  # noqa: F401

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"⚠️ Aviso inicializando tablas de base de datos: {e}")

from fastapi.middleware.cors import CORSMiddleware
from routers import upload, invoices, mappings, webhooks, billing, auth

app = FastAPI(
    title="B2B AP Automation API",
    description="SaaS de extracción automática de facturas mediante Gemini Multimodal.",
    version="1.0.0"
)

# Candado Global opcional por contraseña (SITE_PASSWORD) para alojar en nube pública de forma 100% privada
@app.middleware("http")
async def site_password_gate(request: Request, call_next):
    site_password = (getattr(settings, "SITE_PASSWORD", "") or "").strip()
    if not site_password or request.url.path == "/status" or request.method == "OPTIONS":
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    # Si ya viene un Bearer JWT de la app, permitir que la ruta valide el token normalmente
    if auth_header.startswith("Bearer "):
        return await call_next(request)

    if auth_header.startswith("Basic "):
        try:
            decoded = base64.b64decode(auth_header[6:]).decode("utf-8")
            _, _, pwd = decoded.partition(":")
            if secrets.compare_digest(pwd, site_password):
                return await call_next(request)
        except Exception:
            pass

    return Response(
        content="Acceso privado restringido. Introduce la clave de acceso.",
        status_code=401,
        headers={"WWW-Authenticate": 'Basic realm="DocuFlow Private Cloud"'},
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
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.hf\.space|.*\.onrender\.com)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
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

# Servir el Frontend compilado (Todo-en-Uno en producción) si existe /app/static
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        candidate = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
