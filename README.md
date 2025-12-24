# Unscamable
Unscamable is an AI‑enhanced browser extension designed to analyze online transaction conversations, extract critical seller information, and generate real‑time risk assessments to help users identify and avoid potential fraud.

## Configure Extension Endpoint

Set your backend base URL in [extension/config.js](extension/config.js) by assigning `window.API_BASE_URL`.

- For Cloud Run: `https://<your-service>.a.run.app`
- For local dev, leave it empty to use `http://localhost:5000`
