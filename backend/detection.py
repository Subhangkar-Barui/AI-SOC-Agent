import os
from datetime import datetime, timedelta, timezone

SENSITIVE_PORTS = {22, 23, 445, 3389, 3306, 5432}
COMMON_PORTS = {20, 21, 22, 25, 53, 80, 110, 123, 143, 389, 443, 465, 587, 993, 995}


def timestamp_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def one_minute_ago() -> str:
    return (datetime.now(timezone.utc) - timedelta(seconds=60)).strftime("%Y-%m-%d %H:%M:%S")


def blocked_ips() -> set[str]:
    return {
        ip.strip()
        for ip in os.getenv("BLOCKED_IPS", "").split(",")
        if ip.strip()
    }


def score_traffic(event: dict, recent_source_events: list[dict]) -> tuple[str, int, list[str]]:
    score = 10
    reasons: list[str] = []
    destination_port = event.get("destination_port")
    destination_ip = event.get("destination_ip")

    unique_ports = {
        item.get("destination_port")
        for item in recent_source_events
        if item.get("destination_port") is not None
    }
    if destination_port is not None:
        unique_ports.add(destination_port)

    if len(unique_ports) > 10:
        score = max(score, 82)
        reasons.append("Possible port scan detected")

    if destination_port in SENSITIVE_PORTS:
        score = max(score, 68)
        reasons.append(f"Connection to sensitive port {destination_port}")

    if destination_port and destination_port not in COMMON_PORTS and destination_port not in SENSITIVE_PORTS:
        score = max(score, 42)
        reasons.append(f"Unusual destination port {destination_port}")

    if len(recent_source_events) > 120:
        score = max(score, 66)
        reasons.append("High packet rate from source IP")

    if event.get("direction") == "outbound" and event.get("packet_size", 0) >= 1_000_000:
        score = max(score, 62)
        reasons.append("Large outbound transfer")

    if destination_ip in blocked_ips():
        score = max(score, 92)
        reasons.append("Traffic to blocked IP")

    if score >= 61:
        status = "High Risk"
    elif score >= 31:
        status = "Suspicious"
    else:
        status = "Normal"

    return status, score, reasons


def build_traffic_alert(event: dict, reasons: list[str]) -> dict:
    title = reasons[0] if reasons else "Suspicious Traffic Detected"
    severity = "High" if event["risk_score"] >= 61 else "Medium"
    return {
        "title": title,
        "severity": severity,
        "source_ip": event.get("source_ip"),
        "destination_ip": event.get("destination_ip"),
        "event_type": event.get("protocol", "Traffic"),
        "status": "Open",
        "risk_score": event["risk_score"],
        "source_type": "traffic",
        "agent_id": event["agent_id"],
        "user_email": event["user_email"],
        "detected_at": timestamp_now(),
        "closed_at": None,
        "closed_by": None,
    }


def build_new_device_alert(device: dict) -> dict:
    return {
        "title": "New Network Device Discovered",
        "severity": "Low",
        "source_ip": device.get("ip_address"),
        "destination_ip": None,
        "event_type": "Device Discovery",
        "status": "Open",
        "risk_score": 35,
        "source_type": "device",
        "agent_id": device["agent_id"],
        "user_email": device["user_email"],
        "detected_at": timestamp_now(),
        "closed_at": None,
        "closed_by": None,
    }
