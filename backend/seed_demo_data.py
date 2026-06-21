"""Seed realistic demo data for newly registered users.

Called from the /register endpoint so first-time users see a populated
dashboard instead of all zeros.  Every record is scoped to the given
*user_email* so it never leaks into other accounts.

Demo agent IDs are prefixed with ``demo_`` to avoid collisions with
real agent registrations.
"""

from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

from database import (
    agents_collection,
    alerts_collection,
    logs_collection,
    network_devices_collection,
    traffic_collection,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ts(dt: datetime) -> str:
    """Format a datetime as the timestamp string used everywhere."""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _random_past(days: int = 7) -> datetime:
    """Return a random datetime within the last *days* days."""
    return _now() - timedelta(
        seconds=random.randint(60, days * 86400),
    )


def _random_private_ip() -> str:
    """Return a random 192.168.1.x address."""
    return f"192.168.1.{random.randint(2, 254)}"


def _random_public_ip() -> str:
    """Return a plausible public IP."""
    return f"{random.choice([142, 172, 104, 35, 52, 13, 20, 151])}.{random.randint(1, 254)}.{random.randint(0, 254)}.{random.randint(1, 254)}"


# ---------------------------------------------------------------------------
# Demo data definitions
# ---------------------------------------------------------------------------

_DEMO_AGENTS = [
    {
        "agent_id": "demo_agent_desktop_{uid}",
        "device_name": "DESKTOP-HOME",
        "os": "Windows 11",
        "agent_version": "1.0.0",
        "status": "Offline",
    },
    {
        "agent_id": "demo_agent_laptop_{uid}",
        "device_name": "LAPTOP-WORK",
        "os": "Windows 10",
        "agent_version": "1.0.0",
        "status": "Offline",
    },
]

_DEMO_DEVICES = [
    {"ip_address": "192.168.1.1", "mac_address": "AA:BB:CC:00:11:01", "hostname": "router.local", "vendor": "TP-Link", "status": "Online"},
    {"ip_address": "192.168.1.10", "mac_address": "AA:BB:CC:00:11:02", "hostname": "iphone-user", "vendor": "Apple", "status": "Online"},
    {"ip_address": "192.168.1.11", "mac_address": "AA:BB:CC:00:11:03", "hostname": "galaxy-s24", "vendor": "Samsung", "status": "Online"},
    {"ip_address": "192.168.1.20", "mac_address": "AA:BB:CC:00:11:04", "hostname": "smart-tv-living", "vendor": "LG Electronics", "status": "Online"},
    {"ip_address": "192.168.1.30", "mac_address": "AA:BB:CC:00:11:05", "hostname": "desktop-home", "vendor": "Dell", "status": "Online"},
    {"ip_address": "192.168.1.31", "mac_address": "AA:BB:CC:00:11:06", "hostname": "laptop-work", "vendor": "Lenovo", "status": "Offline"},
    {"ip_address": "192.168.1.50", "mac_address": "AA:BB:CC:00:11:07", "hostname": "hp-printer", "vendor": "HP Inc.", "status": "Offline"},
    {"ip_address": "192.168.1.60", "mac_address": "AA:BB:CC:00:11:08", "hostname": "echo-dot-kitchen", "vendor": "Amazon", "status": "Online"},
]

_LOG_TEMPLATES: list[dict] = [
    {"event_type": "Failed SSH Login", "severity": "High", "message": "Multiple failed SSH login attempts detected from external IP"},
    {"event_type": "Port Scan Detected", "severity": "High", "message": "Sequential port scanning activity observed from source IP"},
    {"event_type": "Brute Force Attempt", "severity": "High", "message": "Repeated authentication failures indicating brute force attack"},
    {"event_type": "Suspicious DNS Query", "severity": "High", "message": "DNS query to known malicious domain detected"},
    {"event_type": "RDP Connection Attempt", "severity": "High", "message": "Unauthorized RDP connection attempt from external network"},
    {"event_type": "Large Outbound Transfer", "severity": "High", "message": "Unusually large outbound data transfer detected from internal host"},
    {"event_type": "Malware Signature Match", "severity": "High", "message": "Network traffic matched known malware communication signature"},
    {"event_type": "Firewall Rule Triggered", "severity": "Medium", "message": "Outbound connection blocked by firewall policy"},
    {"event_type": "Unusual Login Time", "severity": "Medium", "message": "User authentication at unusual hour outside business pattern"},
    {"event_type": "New Service Detected", "severity": "Medium", "message": "Previously unseen network service started on internal host"},
    {"event_type": "ICMP Flood Detected", "severity": "Medium", "message": "High volume ICMP traffic suggesting potential ping flood"},
    {"event_type": "Failed VPN Authentication", "severity": "Medium", "message": "VPN login attempt with invalid credentials from remote IP"},
    {"event_type": "ARP Spoofing Alert", "severity": "Medium", "message": "Duplicate ARP responses detected indicating possible spoofing"},
    {"event_type": "SMB Connection Attempt", "severity": "Medium", "message": "SMB connection attempt to file share from unknown host"},
    {"event_type": "Certificate Warning", "severity": "Medium", "message": "TLS certificate validation failed for outbound HTTPS connection"},
    {"event_type": "DNS Query Spike", "severity": "Low", "message": "Elevated DNS query rate from internal host within short interval"},
    {"event_type": "DHCP Lease Renewed", "severity": "Low", "message": "DHCP lease renewal completed for internal network device"},
    {"event_type": "Network Device Online", "severity": "Low", "message": "Previously offline network device reconnected to the network"},
    {"event_type": "Routine Scan Completed", "severity": "Low", "message": "Scheduled vulnerability scan completed with no critical findings"},
    {"event_type": "Bandwidth Threshold", "severity": "Low", "message": "Network bandwidth utilization exceeded monitoring threshold briefly"},
    {"event_type": "System Update Check", "severity": "Low", "message": "Automated system update check completed without issues"},
    {"event_type": "Backup Connection", "severity": "Low", "message": "Scheduled backup connection established to cloud storage endpoint"},
    {"event_type": "NTP Sync Completed", "severity": "Low", "message": "Network time synchronization completed successfully with NTP server"},
    {"event_type": "Guest WiFi Connect", "severity": "Low", "message": "New device connected to guest WiFi network segment"},
    {"event_type": "IoT Heartbeat", "severity": "Low", "message": "IoT device periodic heartbeat received from smart home hub"},
]

_TRAFFIC_PROFILES = [
    # (protocol, dst_port, direction, risk_score_range, status)
    ("TCP", 443, "outbound", (5, 15), "Normal"),
    ("TCP", 443, "outbound", (5, 15), "Normal"),
    ("TCP", 443, "outbound", (5, 15), "Normal"),
    ("TCP", 80, "outbound", (5, 20), "Normal"),
    ("TCP", 80, "outbound", (5, 20), "Normal"),
    ("UDP", 53, "outbound", (5, 15), "Normal"),
    ("UDP", 53, "outbound", (5, 15), "Normal"),
    ("UDP", 123, "outbound", (5, 10), "Normal"),
    ("TCP", 993, "inbound", (5, 15), "Normal"),
    ("TCP", 587, "outbound", (5, 15), "Normal"),
    ("ICMP", None, "inbound", (5, 20), "Normal"),
    ("ARP", None, "local", (5, 10), "Normal"),
    ("TCP", 8080, "outbound", (32, 50), "Suspicious"),
    ("TCP", 8443, "outbound", (35, 55), "Suspicious"),
    ("UDP", 5060, "inbound", (40, 58), "Suspicious"),
    ("TCP", 4444, "outbound", (42, 58), "Suspicious"),
    ("TCP", 9090, "inbound", (38, 55), "Suspicious"),
    ("TCP", 22, "inbound", (62, 78), "High Risk"),
    ("TCP", 3389, "inbound", (65, 80), "High Risk"),
    ("TCP", 445, "inbound", (68, 82), "High Risk"),
    ("TCP", 23, "inbound", (70, 85), "High Risk"),
]


# ---------------------------------------------------------------------------
# Builder functions
# ---------------------------------------------------------------------------

def _build_agents(email: str, uid: str) -> list[dict]:
    now = _now()
    agents = []
    for template in _DEMO_AGENTS:
        agent = {
            **template,
            "agent_id": template["agent_id"].format(uid=uid),
            "user_email": email,
            "pairing_key_hash": "demo",
            "last_heartbeat": _ts(now - timedelta(minutes=random.randint(5, 200))),
            "created_at": _ts(now - timedelta(days=random.randint(1, 6))),
        }
        agents.append(agent)
    return agents


def _build_devices(email: str, agent_id: str) -> list[dict]:
    now = _now()
    devices = []
    for device in _DEMO_DEVICES:
        first = now - timedelta(days=random.randint(1, 6), hours=random.randint(0, 23))
        devices.append({
            **device,
            "agent_id": agent_id,
            "user_email": email,
            "first_seen": _ts(first),
            "last_seen": _ts(first + timedelta(hours=random.randint(1, 48))),
        })
    return devices


def _build_logs(email: str) -> list[dict]:
    logs = []
    for template in _LOG_TEMPLATES:
        ts = _random_past(7)
        logs.append({
            "timestamp": _ts(ts),
            "source_ip": _random_public_ip() if template["severity"] == "High" else _random_private_ip(),
            "destination_ip": _random_private_ip(),
            "event_type": template["event_type"],
            "severity": template["severity"],
            "message": template["message"],
            "created_by": email,
            "user_email": email,
            "created_at": _ts(ts + timedelta(seconds=random.randint(0, 5))),
        })
    return logs


def _build_log_alerts(logs: list[dict], email: str) -> list[dict]:
    alerts = []
    for log in logs:
        if log["severity"] != "High":
            continue
        is_closed = random.random() < 0.35
        alerts.append({
            "title": f"{log['event_type']} Alert",
            "severity": "High",
            "source_ip": log["source_ip"],
            "destination_ip": log["destination_ip"],
            "event_type": log["event_type"],
            "status": "Closed" if is_closed else "Open",
            "risk_score": random.randint(70, 95),
            "source_type": "log",
            "agent_id": None,
            "user_email": email,
            "created_by": email,
            "detected_at": log["created_at"],
            "closed_at": _ts(_now() - timedelta(hours=random.randint(1, 24))) if is_closed else None,
            "closed_by": email if is_closed else None,
        })
    return alerts


def _build_traffic(email: str, agent_ids: list[str], count: int = 80) -> list[dict]:
    packets = []
    for _ in range(count):
        profile = random.choice(_TRAFFIC_PROFILES)
        protocol, dst_port, direction, risk_range, status = profile
        ts = _random_past(7)
        src_ip = _random_private_ip() if direction == "outbound" else _random_public_ip()
        dst_ip = _random_public_ip() if direction == "outbound" else _random_private_ip()
        if direction == "local":
            src_ip = _random_private_ip()
            dst_ip = _random_private_ip()

        packets.append({
            "timestamp": _ts(ts),
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "protocol": protocol,
            "source_port": random.randint(49152, 65535) if protocol in ("TCP", "UDP") else None,
            "destination_port": dst_port,
            "packet_size": random.randint(40, 1500),
            "direction": direction,
            "interface_name": "Wi-Fi",
            "agent_id": random.choice(agent_ids),
            "user_email": email,
            "status": status,
            "risk_score": random.randint(*risk_range),
            "created_at": _ts(ts + timedelta(seconds=random.randint(0, 3))),
        })
    return packets


def _build_traffic_alerts(traffic: list[dict]) -> list[dict]:
    alerts = []
    for pkt in traffic:
        if pkt["risk_score"] < 31:
            continue
        is_closed = random.random() < 0.3
        if pkt["status"] == "High Risk":
            title = f"Connection to sensitive port {pkt['destination_port']}" if pkt["destination_port"] else "Suspicious traffic detected"
            severity = "High"
        else:
            title = f"Unusual destination port {pkt['destination_port']}" if pkt["destination_port"] else "Unusual traffic pattern"
            severity = "Medium"

        alerts.append({
            "title": title,
            "severity": severity,
            "source_ip": pkt["source_ip"],
            "destination_ip": pkt["destination_ip"],
            "event_type": pkt["protocol"],
            "status": "Closed" if is_closed else "Open",
            "risk_score": pkt["risk_score"],
            "source_type": "traffic",
            "agent_id": pkt["agent_id"],
            "user_email": pkt["user_email"],
            "detected_at": pkt["created_at"],
            "closed_at": _ts(_now() - timedelta(hours=random.randint(1, 12))) if is_closed else None,
            "closed_by": pkt["user_email"] if is_closed else None,
        })
    return alerts


def _build_device_alerts(devices: list[dict]) -> list[dict]:
    alerts = []
    for device in devices:
        alerts.append({
            "title": "New Network Device Discovered",
            "severity": "Low",
            "source_ip": device["ip_address"],
            "destination_ip": None,
            "event_type": "Device Discovery",
            "status": "Closed" if random.random() < 0.5 else "Open",
            "risk_score": 35,
            "source_type": "device",
            "agent_id": device["agent_id"],
            "user_email": device["user_email"],
            "detected_at": device["first_seen"],
            "closed_at": None,
            "closed_by": None,
        })
    return alerts


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def seed_demo_data(email: str) -> dict:
    """Insert demo data across all collections for the given user.

    Returns a summary dict with counts of inserted documents.
    """
    uid = uuid.uuid4().hex[:8]

    # 1. Agents
    agents = _build_agents(email, uid)
    agents_collection.insert_many(agents)
    agent_ids = [a["agent_id"] for a in agents]

    # 2. Network devices (tied to first demo agent)
    devices = _build_devices(email, agent_ids[0])
    network_devices_collection.insert_many(devices)

    # 3. Security logs
    logs = _build_logs(email)
    logs_collection.insert_many(logs)

    # 4. Traffic events
    traffic = _build_traffic(email, agent_ids, count=80)
    traffic_collection.insert_many(traffic)

    # 5. Alerts — from logs, traffic, and device discovery
    all_alerts = (
        _build_log_alerts(logs, email)
        + _build_traffic_alerts(traffic)
        + _build_device_alerts(devices)
    )
    if all_alerts:
        alerts_collection.insert_many(all_alerts)

    return {
        "agents": len(agents),
        "devices": len(devices),
        "logs": len(logs),
        "traffic": len(traffic),
        "alerts": len(all_alerts),
    }
