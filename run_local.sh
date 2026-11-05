#!/bin/bash
set -e

# Colores para la consola
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}    🚀 DocuFlow AP Automation - Lanzador 1-Click    ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

# 1. Comprobar si Docker está abierto
echo -e "${YELLOW}[1/6] Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker no está activo. Abriendo Docker Desktop...${NC}"
    open -a Docker
    while ! docker info > /dev/null 2>&1; do
        sleep 2
        echo -n "."
    done
    echo ""
fi
echo -e "${GREEN}✓ Docker está listo.${NC}"

# 2. Levantar la infraestructura con Docker Compose
echo -e "${YELLOW}[2/6] Iniciando contenedores (PostgreSQL, Redis, Celery, API)...${NC}"
docker compose up -d --build

# 3. Esperar a que la base de datos y la API respondan
echo -e "${YELLOW}[3/6] Esperando disponibilidad del backend...${NC}"
for i in {1..30}; do
    if docker compose exec -T web python -c "from core.database import SessionLocal; db = SessionLocal(); db.execute('SELECT 1'); print('OK')" > /dev/null 2>&1; then
        break
    fi
    sleep 1
done
echo -e "${GREEN}✓ Base de datos y backend operativos.${NC}"

# 4. Ejecutar migraciones automáticas de Alembic
echo -e "${YELLOW}[4/6] Aplicando migraciones de base de datos (Alembic)...${NC}"
docker compose exec -T web alembic upgrade head
echo -e "${GREEN}✓ Esquema de base de datos actualizado.${NC}"

# 5. Escuchar Webhooks de Stripe (en segundo plano si la CLI está instalada)
STRIPE_PID=""
if command -v stripe &> /dev/null; then
    echo -e "${YELLOW}[5/6] Conectando Stripe Webhook Listener (segundo plano)...${NC}"
    stripe listen --forward-to localhost:8000/webhooks/stripe > /tmp/stripe_listener.log 2>&1 &
    STRIPE_PID=$!
    echo -e "${GREEN}✓ Stripe Webhooks activos (PID: $STRIPE_PID). Log en /tmp/stripe_listener.log${NC}"
else
    echo -e "${YELLOW}[5/6] Stripe CLI no detectada (omitiendo webhooks automáticos).${NC}"
fi

# 6. Limpiar caché antigua de Vite y arrancar Frontend
echo -e "${YELLOW}[6/6] Preparando el Frontend...${NC}"
rm -rf frontend/node_modules/.vite

# Función de limpieza al pulsar Ctrl+C
cleanup() {
    echo ""
    echo -e "${YELLOW}Deteniendo entorno local...${NC}"
    if [ -n "$STRIPE_PID" ]; then
        kill "$STRIPE_PID" 2>/dev/null || true
    fi
    echo -e "${GREEN}El servidor Vite se ha detenido.${NC}"
    echo -e "Si deseas apagar también la base de datos y los contenedores Docker, ejecuta: ${BLUE}./stop_local.sh${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✨ ¡TODO LISTO! La aplicación está en marcha.     ${NC}"
echo -e "${GREEN}  👉 URL: http://localhost:5173                     ${NC}"
echo -e "${GREEN}  Presiona Ctrl+C en esta ventana para salir.       ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""

# Abrir el navegador automáticamente
sleep 1
open http://localhost:5173 || true

# Iniciar servidor Vite en primer plano
cd frontend
npm run dev
