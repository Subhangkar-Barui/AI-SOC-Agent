# Deployment Guide: Render + Vercel + MongoDB Atlas

## Backend On Render

Use `render.yaml` or create a web service manually.

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check Path: /
```

Required Render environment variables:

```text
MONGO_URL=<MongoDB Atlas URI>
DB_NAME=ai_soc_dashboard
SECRET_KEY=<long-random-secret>
ACCESS_TOKEN_EXPIRE_MINUTES=120
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app
FRONTEND_URL=https://your-vercel-app.vercel.app
BLOCKED_IPS=
```

## Database On MongoDB Atlas

1. Create a free cluster.
2. Create a database user.
3. Add a network access rule.
4. Copy the connection string into Render as `MONGO_URL`.

## Frontend On Vercel

Import the repo into Vercel and set:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Vercel environment variables:

```text
VITE_API_BASE_URL=https://your-render-backend.onrender.com
VITE_AGENT_DOWNLOAD_URL=https://github.com/your-username/ai-soc-dashboard/releases
```

After changing `VITE_API_BASE_URL`, redeploy the frontend because Vite reads environment variables at build time.

## Windows Agent Distribution

Build the agent:

```powershell
cd agent
build_agent.bat
```

Upload `agent/dist/SOC-Windows-Agent.exe` to GitHub Releases. The frontend Agent Download page points users to `VITE_AGENT_DOWNLOAD_URL`.

Do not bake backend secrets into the agent binary. Users pair with a one-time dashboard-generated key.

## Production Smoke Test

Backend health:

```powershell
curl.exe https://your-render-backend.onrender.com/
```

Frontend:

1. Open the Vercel URL.
2. Register/login.
3. Generate an agent pairing key.
4. Run the Windows agent locally.
5. Confirm heartbeat, devices, traffic, and alerts appear in the dashboard.
