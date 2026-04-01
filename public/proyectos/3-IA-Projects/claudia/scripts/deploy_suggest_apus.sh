#!/bin/bash
# Script para deployar la función suggest_project_apus a Google Cloud Functions
# Autor: Claude + Pablo Cussen
# Fecha: 2025-01-17

echo "🚀 Deployando suggest_project_apus a Google Cloud Functions..."

# Configurar proyecto
gcloud config set project claudia-i8bxh

# Deploy de la función
gcloud functions deploy suggest_project_apus \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=suggest_project_apus \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s \
  --max-instances=10

echo "✅ Deploy completado!"
echo "📍 URL: https://us-central1-claudia-i8bxh.cloudfunctions.net/suggest_project_apus"
