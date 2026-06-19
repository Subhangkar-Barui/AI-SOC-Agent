@echo off
python -m pip install -r requirements.txt
pyinstaller --onefile --name SOC-Windows-Agent traffic_agent.py
