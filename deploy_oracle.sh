#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 Instalador Automático DocuFlow - Oracle Cloud Always Free"
echo "=========================================================="

# 1. Instalar Docker y Docker Compose si no están instalados
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker y Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg git ufw
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    echo "✅ Docker instalado correctamente."
else
    echo "✅ Docker ya está instalado."
fi

# 2. Abrir puerto 80 (HTTP) y 8000 en el firewall interno de Ubuntu (iptables / ufw)
echo "🔓 Abriendo puertos 80 y 8000 en el firewall del servidor..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT || true
if command -v netfilter-persistent &> /dev/null; then
    sudo netfilter-persistent save || true
fi

# 3. Verificar que existe .env
if [ ! -f .env ]; then
    echo "⚠️ No se encontró archivo .env. Creando plantilla base..."
    cat <<EOF > .env
DATABASE_URL=postgresql://postgres:postgres@db:5432/ap_automation
REDIS_URL=redis://redis:6379/0
GEMINI_API_KEY=PON_AQUI_TU_CLAVE_GEMINI
GEMINI_MODEL=gemini-2.5-flash
SKIP_BILLING_CHECK=True
ALLOWED_EMAILS=
SITE_PASSWORD=
EOF
    echo "❗ Edita el archivo .env con 'nano .env' para poner tu GEMINI_API_KEY, SITE_PASSWORD y ALLOWED_EMAILS."
fi

echo "🏗️ Construyendo y levantando el sistema completo (Web + Worker + Postgres + Redis)..."
sudo docker compose -f docker-compose.oracle.yml up -d --build

PUBLIC_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo "=========================================================="
echo "🎉 ¡DESPLIEGUE COMPLETADO CON ÉXITO!"
echo "🌐 Accede desde cualquier navegador en: http://${PUBLIC_IP}"
echo "=========================================================="
