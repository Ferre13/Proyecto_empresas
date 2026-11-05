# ==============================================================================
# Dockerfile Todo-en-Uno (Frontend React + Backend FastAPI)
# Compatible 100% gratis con Hugging Face Spaces (Puerto 7860) y Render ($PORT)
# ==============================================================================

# --- Etapa 1: Compilar el Frontend (React / Vite) ---
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
# Permitir inyectar las variables públicas de Supabase en tiempo de compilación si se desea
ARG VITE_SUPABASE_URL="https://jfflukpqcsrdhezzoeos.supabase.co"
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# --- Etapa 2: Servidor Unificado Python (FastAPI + Worker In-Process) ---
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
# Copiar el frontend compilado dentro de /app/static para que FastAPI lo sirva directamente
COPY --from=frontend-builder /frontend/dist /app/static

# Crear directorio de subidas temporales con permisos abiertos (requerido por Hugging Face Spaces UID 1000)
RUN mkdir -p /tmp/ap_automation_uploads /data \
    && chmod -R 777 /tmp/ap_automation_uploads /data /app

# Por defecto usa SQLite persistente en /data si no se configura DATABASE_URL de Supabase/Postgres
ENV DATABASE_URL="sqlite:////data/docuflow.db"
ENV SKIP_BILLING_CHECK="True"
ENV PORT=7860

EXPOSE 7860

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
