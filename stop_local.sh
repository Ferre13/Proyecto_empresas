#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}Apagando contenedores Docker y servicios de DocuFlow...${NC}"

# Matar procesos de stripe listener si quedaron huérfanos
pkill -f "stripe listen" 2>/dev/null || true

# Apagar contenedores docker
docker compose down

echo -e "${GREEN}✓ Todo apagado y limpio.${NC}"
echo ""
