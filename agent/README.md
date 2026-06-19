# SOC Windows Network Monitoring Agent

This is a visible, consent-based Windows agent for authorized network monitoring. It captures metadata only and sends it to the FastAPI backend.

## Safety Boundary

Use only on your own Windows system, home/lab network, or a network where you have explicit permission.

The agent collects:

- timestamp
- source and destination IP
- protocol
- source and destination port
- packet size
- direction
- interface name
- local device metadata

The agent does not collect passwords, cookies, browser content, files, private messages, keystrokes, credentials, or packet payloads.

## Requirements

- Windows
- Python 3.11+
- Npcap installed
- Administrator terminal may be required for packet capture

## Setup

```powershell
cd agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python traffic_agent.py
```

The agent asks for:

1. Consent
2. Backend API URL
3. Pairing key generated from the dashboard
4. Network interface to monitor

## Build EXE

```powershell
build_agent.bat
```

The executable is created in `agent/dist/SOC-Windows-Agent.exe`.
