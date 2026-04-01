# Gemini Project Instructions: Claudia Bot (Arqattack)

This file provides instructions for the Gemini agent to effectively assist with the development of the `claudia_bot` project.

## Project Overview

This project is a lead-generation chatbot for Telegram, designed for the construction company "Arqattack". The bot, named Claudia, guides users through a sales funnel for construction/remodeling projects.

The entire application is architected as a single, serverless **Google Cloud Function (2nd Gen)**.

## Core Logic

-   **Entry Point:** `main.py` is the entry point for the Google Cloud Function. It receives webhook requests from Telegram.
-   **Lazy Initialization:** Components like the `TelegramSender` are initialized lazily inside the `claudia_handler` function to prevent cold start issues with environment variables.
-   **Conversational Brain:** `claudia_modules/ai_core.py` contains the core logic. It uses the Gemini API to generate responses based on a detailed sales script prompt.
-   **Message Handling:** The bot processes text and callback queries. It also has a specific handler in `main.py` to gracefully manage non-text messages like photos or documents.

## Data Storage (Firestore)

The project uses Google Firestore for persistent storage:
-   **`conversations` collection:** Stores the chat history for each user, allowing for continuous conversations. The document ID is the user's `session_id` (their Telegram chat ID).
-   **`construction_leads` collection:** Stores qualified leads generated from user conversations, including project type and a lead score.

## Deployment

The bot is deployed as a Google Cloud Function. The following steps are validated and correct.

### 1. Environment Variables

The deployment requires two environment variables. The most reliable way to set them is through the Google Cloud Console UI, under **Cloud Run > claudia-bot > Edit & Deploy New Revision > Variables & Secrets**.

-   `GEMINI_API_KEY`: Your API key for the Gemini service.
-   `TELEGRAM_TOKEN`: The token for your Telegram bot, obtained from BotFather.

### 2. Deployment Command

To deploy changes, use the following command from a PowerShell terminal. This single-line format avoids parsing errors.

```powershell
gcloud functions deploy claudia-bot --gen2 --runtime python311 --region southamerica-west1 --source . --entry-point claudia_handler --trigger-http --allow-unauthenticated
```

*Note: After the first deployment, you can omit the `--set-env-vars` flag if you manage the variables in the UI.*

### 3. Setting the Telegram Webhook

After deployment, Google Cloud will provide a trigger URL. You must set this URL as your bot's webhook. Use the following `curl` command, replacing the token and URL:

```bash
curl "https://api.telegram.org/bot<TU_TOKEN_DE_TELEGRAM>/setWebhook?url=<LA_URL_DE_TU_FUNCION>"
```

## Troubleshooting

-   **Bot no responde:**
    1.  Ve a **Cloud Run** en la consola de Google Cloud (no a Cloud Functions 1st Gen).
    2.  Selecciona el servicio `claudia-bot` en la región `southamerica-west1`.
    3.  Revisa la pestaña de **REGISTROS (LOGS)** para ver los errores.

-   **Error: `API key not valid`:**
    1.  La variable de entorno `GEMINI_API_KEY` es incorrecta en la revisión desplegada.
    2.  **Solución:** Crea una nueva clave de API sin restricciones en la sección "Credenciales" de Google Cloud y actualiza la variable de entorno a través de la interfaz web de Cloud Run.

-   **Error: `Telegram token no puede ser nulo o vacío`:**
    1.  La variable de entorno `TELEGRAM_TOKEN` no está configurada o es incorrecta.
    2.  **Solución:** Verifica el token con `@BotFather` y actualiza la variable de entorno a través de la interfaz web de Cloud Run.
