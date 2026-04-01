#!/bin/bash
# Script de deployment para CLAUDIA SODIMAC
# Google Cloud Functions (Gen 2)

set -e  # Exit on error

echo "🚀 CLAUDIA SODIMAC - Deployment Script"
echo "========================================"

# Variables
PROJECT_ID="claudia-i8bxh"
REGION="southamerica-west1"
FUNCTION_NAME="claudia-sodimac"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "main_sodimac.py" ]; then
    echo -e "${RED}❌ Error: main_sodimac.py no encontrado${NC}"
    echo "   Asegúrate de ejecutar este script desde el directorio claudia_bot"
    exit 1
fi

# Verificar variables de entorno
echo -e "${YELLOW}📋 Verificando variables de entorno...${NC}"

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ Error: GEMINI_API_KEY no está configurada${NC}"
    echo "   Configúrala con: export GEMINI_API_KEY=tu_api_key"
    exit 1
fi

if [ -z "$TELEGRAM_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Warning: TELEGRAM_TOKEN no está configurada${NC}"
    echo "   La funcionalidad de Telegram no estará disponible"
fi

echo -e "${GREEN}✓ Variables de entorno OK${NC}"

# Verificar autenticación con Google Cloud
echo -e "${YELLOW}🔐 Verificando autenticación con Google Cloud...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo -e "${RED}❌ Error: No autenticado en Google Cloud${NC}"
    echo "   Ejecuta: gcloud auth login"
    exit 1
fi

echo -e "${GREEN}✓ Autenticación OK${NC}"

# Configurar proyecto
echo -e "${YELLOW}🔧 Configurando proyecto...${NC}"
gcloud config set project $PROJECT_ID

# Confirmar deployment
echo ""
echo -e "${YELLOW}📦 Configuración de Deployment:${NC}"
echo "   Proyecto: $PROJECT_ID"
echo "   Región: $REGION"
echo "   Función: $FUNCTION_NAME"
echo "   Runtime: Python 3.11"
echo ""
read -p "¿Continuar con el deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelado"
    exit 0
fi

# Crear backup del deployment anterior
echo -e "${YELLOW}💾 Creando backup...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
gcloud functions describe $FUNCTION_NAME \
    --region=$REGION \
    --gen2 \
    --format=json > backups/backup_${TIMESTAMP}.json 2>/dev/null || echo "   (No hay deployment anterior)"

# Desplegar función
echo -e "${YELLOW}🚀 Desplegando CLAUDIA SODIMAC...${NC}"
echo "   Esto puede tomar varios minutos..."

gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime python311 \
    --region $REGION \
    --source . \
    --entry-point claudia_sodimac_handler \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY,TELEGRAM_TOKEN=$TELEGRAM_TOKEN \
    --memory 512MB \
    --timeout 300s \
    --max-instances 100

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment exitoso!${NC}"
else
    echo -e "${RED}❌ Error en deployment${NC}"
    exit 1
fi

# Obtener URL de la función
echo -e "${YELLOW}🔗 Obteniendo URL de la función...${NC}"
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME \
    --region=$REGION \
    --gen2 \
    --format='value(serviceConfig.uri)')

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ CLAUDIA SODIMAC desplegada exitosamente!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📍 URL de la función:${NC}"
echo "   $FUNCTION_URL"
echo ""
echo -e "${YELLOW}📱 Configurar Telegram Webhook:${NC}"
if [ ! -z "$TELEGRAM_TOKEN" ]; then
    echo "   curl \"https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${FUNCTION_URL}\""
    echo ""
    read -p "¿Configurar webhook de Telegram ahora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl -s "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${FUNCTION_URL}" | jq '.'
        echo -e "${GREEN}✓ Webhook configurado${NC}"
    fi
else
    echo "   (Configura TELEGRAM_TOKEN primero)"
fi

echo ""
echo -e "${YELLOW}🌐 Interfaz Web:${NC}"
echo "   $FUNCTION_URL/claudia-sodimac.html"
echo ""
echo -e "${YELLOW}📊 Ver logs:${NC}"
echo "   gcloud functions logs read $FUNCTION_NAME --region=$REGION --gen2 --limit=50"
echo ""
echo -e "${YELLOW}🔍 Health check:${NC}"
echo "   curl $FUNCTION_URL"
echo ""

# Test de health check
echo -e "${YELLOW}🧪 Ejecutando health check...${NC}"
HEALTH_CHECK=$(curl -s $FUNCTION_URL)
if echo "$HEALTH_CHECK" | grep -q "CLAUDIA SODIMAC"; then
    echo -e "${GREEN}✓ Health check OK${NC}"
    echo "$HEALTH_CHECK" | jq '.'
else
    echo -e "${RED}⚠️  Health check failed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completado!${NC}"
echo "   CLAUDIA SODIMAC está lista para usar"
echo ""
