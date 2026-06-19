# AI-Powered SOC Dashboard with Downloadable Windows Network Monitoring Agent

## Overview
This is a full-stack cybersecurity monitoring platform with a React dashboard, FastAPI backend, MongoDB database, and a visible Windows network monitoring agent. Users register, generate a one-time pairing key, run the Windows agent on an authorized system, and view live metadata, devices, alerts, analytics, and reports in the dashboard.

## Problem Statement
Home labs and small environments often lack a safe, affordable way to centralize basic network telemetry. This project provides a privacy-first SOC-style workflow that collects metadata only and keeps authentication, storage, analysis, and access control in the backend.

## Final Workflow
1. User registers or logs in.
2. User opens Agent Download.
3. User generates a one-time pairing key.
4. User runs the Windows agent locally.
5. Agent asks for backend URL and pairing key.
6. Agent registers with FastAPI and receives an agent token.
7. Agent sends heartbeat, discovered devices, and traffic metadata.
8. Backend validates, stores, scores, and generates alerts.
9. React dashboard displays live traffic, agents, devices, analytics, alerts, and reports.

## Architecture Diagram
```text
Windows Agent
  -> FastAPI Backend API
    -> MongoDB Atlas
      -> React Dashboard
```

The agent never sends data directly to the React frontend.

## Features
- JWT authentication with bcrypt password hashing
- User-scoped logs, alerts, agents, devices, traffic, and reports
- Manual log creation and CSV log upload
- One-time agent pairing keys with expiry
- Agent heartbeat tracking and online/offline status
- Network device ingestion with new-device alerts
- Traffic metadata ingestion with pagination and filters
- Rule-based detection for port scans, sensitive ports, unusual ports, high packet rate, large outbound transfer, and blocked IPs
- Dashboard cards and Recharts analytics
- Live traffic page with 5-second refresh
- Security report summary with recommendations
- Metadata-only Windows agent with visible consent

## Tech Stack
- Backend: Python, FastAPI, PyMongo, Pydantic, python-jose, passlib bcrypt, python-dotenv, python-multipart, Uvicorn
- Frontend: React, Vite, Tailwind CSS, Axios, React Router DOM, Recharts, lucide-react
- Agent: Python, Scapy, psutil, requests, PyInstaller
- Deployment: Render Free backend, Vercel Hobby frontend, MongoDB Atlas Free database

## Folder Structure
```text
backend/        FastAPI API, models, detection, requirements
frontend/       React dashboard
agent/          Windows metadata-only monitoring agent
sample_data/    Header-only CSV template
screenshots/    Screenshot placeholders
render.yaml     Render backend Blueprint
```

## Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload
```

## Frontend Setup
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

## Windows Agent Setup
```powershell
cd agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python traffic_agent.py
```

Npcap and administrator privileges may be required for packet capture on Windows.

Build an executable:
```powershell
cd agent
build_agent.bat
```

## Deployment Guide
Backend on Render:
```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Frontend on Vercel:
```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Environment: VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

MongoDB Atlas:
- Create a free cluster.
- Create a database user.
- Add network access rules.
- Store the Atlas connection string as `MONGO_URL` in Render.

Agent download:
- Build with PyInstaller.
- Upload `SOC-Windows-Agent.exe` to GitHub Releases.
- Set `VITE_AGENT_DOWNLOAD_URL` to the release URL.

## API Endpoints
| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/register` | Register user |
| POST | `/login` | Login and receive JWT |
| GET | `/profile` | Current profile |
| POST/GET | `/logs` | Create/list logs |
| POST | `/logs/upload-csv` | Upload CSV logs |
| POST | `/agent/generate-key` | Generate pairing key |
| POST | `/agent/register` | Register agent |
| POST | `/agent/heartbeat` | Agent heartbeat |
| GET/DELETE | `/agent/{agent_id}` | View/delete one agent |
| GET | `/agents` | List user agents |
| POST/GET | `/network/devices` | Ingest/list devices |
| POST/GET | `/traffic` | Ingest/list traffic |
| GET | `/traffic/stats` | Traffic analytics |
| GET | `/traffic/live-summary` | Lightweight live summary |
| GET/DELETE | `/alerts` and `/alerts/{id}` | Alert lifecycle |
| GET | `/dashboard/stats` | Dashboard counters |
| GET | `/reports/summary` | Basic security report |

## Sample CSV Format
```csv
timestamp,source_ip,destination_ip,event_type,severity,message
```

The included `sample_data/sample_logs.csv` is header-only to avoid bundled fake security data.

## Security and Privacy Notice
Use the agent only on your own system, home/lab network, or networks where you have explicit permission. The agent captures metadata only. It does not capture passwords, cookies, browser content, private messages, files, packet payloads, keystrokes, credentials, or personal content.

## OWASP Top 10 Mitigation
- Access control: every sensitive route enforces JWT or agent-token authentication and user ownership.
- Cryptography: passwords use bcrypt; JWTs expire; secrets stay in environment variables.
- Injection prevention: Pydantic validation, allowlisted filters, ObjectId validation, escaped regex search, no `eval` or `exec`.
- Upload safety: CSV files are decoded and validated server-side, never executed.
- Misconfiguration: CORS is restricted through environment variables.
- React safety: no `dangerouslySetInnerHTML`; user data is rendered as text.
- Agent safety: visible consent, no stealth behavior, no persistence abuse, metadata only.

## Limitations
A normal Windows laptop will not see all traffic from every device on modern switched or Wi-Fi networks. The MVP reliably monitors the host running the agent, visible broadcast/multicast traffic, local interface metadata, and subnet discovery where available.

Future full-network visibility options:
- Router log integration
- Syslog ingestion
- NetFlow/sFlow
- Raspberry Pi sensor
- Switch port mirroring/SPAN
- Multiple agents

## Future Enhancements
- AI anomaly detection using Isolation Forest
- ML-based risk scoring
- Router log integration
- Raspberry Pi sensor mode
- Email or Telegram alert notifications
- PDF report export
- GitHub Actions CI/CD

## Screenshots
Place screenshots in `screenshots/`:
- Login
- Dashboard
- Agent Download
- Live Traffic
- Traffic Analytics
- Reports

## Resume Description
Built a full-stack SOC monitoring platform with React, FastAPI, MongoDB Atlas, and JWT authentication. Implemented a downloadable Windows Network Monitoring Agent that captures authorized local network metadata, agent pairing, heartbeat tracking, LAN device discovery, live traffic monitoring, rule-based suspicious activity detection, automated alert generation, dashboard analytics, and privacy-first metadata-only monitoring.
