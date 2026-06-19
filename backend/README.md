# Backend

FastAPI backend for authentication, logs, alerts, agent pairing, network device ingestion, traffic metadata ingestion, detection, dashboard stats, and reports.

## Run Locally

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload
```

## Main Environment Variables

- `MONGO_URL`
- `DB_NAME`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `FRONTEND_ORIGINS`
- `FRONTEND_URL`
- `BLOCKED_IPS`
