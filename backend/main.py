import csv
import io
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import ValidationError
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError

from agent_models import AgentHeartbeat, AgentRegister, NetworkDeviceBatch
from auth import create_token, decode_token, hash_password, verify_password
from database import (
    agents_collection,
    alerts_collection,
    logs_collection,
    network_devices_collection,
    pairing_keys_collection,
    reports_collection,
    traffic_collection,
    users_collection,
)
from detection import build_new_device_alert, build_traffic_alert, one_minute_ago, score_traffic
from log_models import SecurityLog
from models import UserLogin, UserRegister
from seed_demo_data import seed_demo_data
from traffic_models import TrafficEvent

app = FastAPI(title="AI SOC Dashboard Backend")
security = HTTPBearer()

configured_frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    os.getenv("FRONTEND_URL", "http://localhost:5173,http://127.0.0.1:5173"),
)
frontend_origins = [
    origin.strip()
    for origin in configured_frontend_origins.split(",")
    if origin.strip()
] or ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def current_datetime() -> datetime:
    return datetime.now(timezone.utc)


def current_timestamp() -> str:
    return current_datetime().strftime("%Y-%m-%d %H:%M:%S")


def serialize_document(document: dict) -> dict:
    clean = {}
    for key, value in document.items():
        if isinstance(value, ObjectId):
            clean[key] = str(value)
        elif isinstance(value, datetime):
            clean[key] = value.strftime("%Y-%m-%d %H:%M:%S")
        else:
            clean[key] = value
    return clean


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") == "agent":
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user = serialize_document(user)
    user.pop("password", None)
    return user


def get_current_agent(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "agent":
        raise HTTPException(status_code=401, detail="Invalid or expired agent token")

    agent_id = payload.get("agent_id")
    if not agent_id:
        raise HTTPException(status_code=401, detail="Invalid agent token payload")

    agent = agents_collection.find_one({"agent_id": agent_id})
    if not agent:
        raise HTTPException(status_code=401, detail="Agent not registered")

    return serialize_document(agent)


def build_log_alert(log_data: dict, user_email: str) -> dict:
    return {
        "title": "High Severity Security Alert",
        "severity": "High",
        "source_ip": log_data["source_ip"],
        "destination_ip": log_data.get("destination_ip"),
        "event_type": log_data["event_type"],
        "status": "Open",
        "risk_score": 80,
        "source_type": "log",
        "agent_id": None,
        "user_email": user_email,
        "created_by": user_email,
        "detected_at": current_timestamp(),
        "closed_at": None,
        "closed_by": None,
    }


def user_log_query(email: str) -> dict:
    return {"$or": [{"user_email": email}, {"created_by": email}]}


def user_alert_query(email: str) -> dict:
    return {"$or": [{"user_email": email}, {"created_by": email}]}


def object_id_or_400(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail="Invalid ID")
    return ObjectId(value)


def mark_agent_status(agent: dict) -> dict:
    last_heartbeat = agent.get("last_heartbeat")
    status = agent.get("status", "Offline")
    if last_heartbeat:
        try:
            heartbeat_time = datetime.strptime(last_heartbeat, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            if current_datetime() - heartbeat_time > timedelta(seconds=120):
                status = "Offline"
        except ValueError:
            status = "Offline"
    else:
        status = "Offline"

    if status != agent.get("status"):
        agents_collection.update_one({"agent_id": agent["agent_id"]}, {"$set": {"status": status}})
        agent["status"] = status
    return agent


def with_date_range(query: dict, field: str, date_from: str | None, date_to: str | None) -> dict:
    date_query = {}
    if date_from:
        date_query["$gte"] = date_from
    if date_to:
        date_query["$lte"] = date_to
    if date_query:
        query[field] = date_query
    return query


@app.get("/")
def home():
    return {"message": "SOC Dashboard Backend is running"}


@app.post("/register")
def register(user: UserRegister):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = {
        "name": user.name.strip(),
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": current_timestamp(),
    }

    try:
        users_collection.insert_one(new_user)
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        seed_demo_data(user.email)
    except Exception:
        pass  # Don't fail registration if seeding fails

    return {"message": "User registered successfully"}


@app.post("/login")
def login(user: UserLogin):
    existing_user = users_collection.find_one({"email": user.email})
    if not existing_user or not verify_password(user.password, existing_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token({"email": existing_user["email"], "type": "user"})
    return {"message": "Login successful", "access_token": token, "token_type": "bearer"}


@app.get("/profile")
def profile(current_user: dict = Depends(get_current_user)):
    return {"name": current_user["name"], "email": current_user["email"]}


@app.post("/logs")
def add_log(log: SecurityLog, current_user: dict = Depends(get_current_user)):
    log_data = log.model_dump()
    log_data["created_by"] = current_user["email"]
    log_data["user_email"] = current_user["email"]
    log_data["created_at"] = current_timestamp()

    result = logs_collection.insert_one(log_data)
    if log.severity == "High":
        alerts_collection.insert_one(build_log_alert(log_data, current_user["email"]))

    return {"message": "Log added successfully", "log_id": str(result.inserted_id)}


@app.get("/logs")
def get_logs(
    source_ip: Optional[str] = Query(None),
    destination_ip: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    query = user_log_query(current_user["email"])
    if source_ip:
        query["source_ip"] = source_ip.strip()
    if destination_ip:
        query["destination_ip"] = destination_ip.strip()
    if severity:
        normalized_severity = severity.strip().title()
        if normalized_severity not in {"High", "Medium", "Low"}:
            raise HTTPException(status_code=400, detail="Severity must be High, Medium, or Low")
        query["severity"] = normalized_severity
    if event_type:
        query["event_type"] = {"$regex": re.escape(event_type.strip()), "$options": "i"}
    with_date_range(query, "timestamp", date_from, date_to)

    return [serialize_document(log) for log in logs_collection.find(query).sort("created_at", DESCENDING)]


@app.post("/logs/upload-csv")
async def upload_logs_csv(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    try:
        decoded_content = (await file.read()).decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please upload a UTF-8 CSV file")

    csv_reader = csv.DictReader(io.StringIO(decoded_content))
    required_columns = {"timestamp", "source_ip", "destination_ip", "event_type", "severity", "message"}
    if not csv_reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid")

    missing_columns = required_columns - set(csv_reader.fieldnames)
    if missing_columns:
        raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(sorted(missing_columns))}")

    logs_to_insert = []
    alerts_to_insert = []
    skipped_rows = []

    for row_number, row in enumerate(csv_reader, start=2):
        if not any(row.values()):
            skipped_rows.append({"row": row_number, "reason": "Blank row"})
            continue

        try:
            validated_log = SecurityLog(**{field: row.get(field, "") for field in required_columns})
        except ValidationError as exc:
            skipped_rows.append({"row": row_number, "reason": "; ".join(error["msg"] for error in exc.errors())})
            continue

        log_data = validated_log.model_dump()
        log_data.update({
            "created_by": current_user["email"],
            "user_email": current_user["email"],
            "created_at": current_timestamp(),
        })
        logs_to_insert.append(log_data)

        if validated_log.severity == "High":
            alerts_to_insert.append(build_log_alert(log_data, current_user["email"]))

    if not logs_to_insert:
        raise HTTPException(status_code=400, detail={"message": "No valid logs found in CSV", "skipped_rows": skipped_rows})

    inserted_logs = logs_collection.insert_many(logs_to_insert)
    if alerts_to_insert:
        alerts_collection.insert_many(alerts_to_insert)

    return {
        "message": "CSV logs uploaded successfully",
        "logs_inserted": len(inserted_logs.inserted_ids),
        "alerts_created": len(alerts_to_insert),
        "skipped_rows": skipped_rows,
    }


@app.post("/agent/generate-key")
def generate_agent_key(current_user: dict = Depends(get_current_user)):
    pairing_key = secrets.token_urlsafe(32)
    expires_at = current_datetime() + timedelta(minutes=15)
    pairing_keys_collection.insert_one({
        "user_email": current_user["email"],
        "pairing_key_hash": hash_password(pairing_key),
        "expires_at": expires_at,
        "used": False,
        "created_at": current_timestamp(),
    })
    return {
        "message": "Pairing key generated. It is shown only once and expires in 15 minutes.",
        "pairing_key": pairing_key,
        "expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S"),
    }


@app.post("/agent/register")
def register_agent(agent: AgentRegister):
    now = current_datetime()
    valid_keys = pairing_keys_collection.find({"used": False, "expires_at": {"$gte": now}})
    matched_key = None
    for stored_key in valid_keys:
        if verify_password(agent.pairing_key, stored_key["pairing_key_hash"]):
            matched_key = stored_key
            break

    if not matched_key:
        raise HTTPException(status_code=401, detail="Invalid or expired pairing key")

    agent_id = f"agent_{uuid.uuid4().hex[:16]}"
    agent_doc = {
        "agent_id": agent_id,
        "user_email": matched_key["user_email"],
        "device_name": agent.device_name,
        "os": agent.os,
        "agent_version": agent.agent_version,
        "status": "Online",
        "pairing_key_hash": matched_key["pairing_key_hash"],
        "last_heartbeat": current_timestamp(),
        "created_at": current_timestamp(),
    }
    agents_collection.insert_one(agent_doc)
    pairing_keys_collection.update_one({"_id": matched_key["_id"]}, {"$set": {"used": True, "used_at": current_timestamp(), "agent_id": agent_id}})

    agent_token = create_token({"type": "agent", "agent_id": agent_id}, expires_minutes=60 * 24 * 30)
    return {"message": "Agent registered successfully", "agent_id": agent_id, "agent_token": agent_token}


@app.post("/agent/heartbeat")
def agent_heartbeat(payload: AgentHeartbeat, current_agent: dict = Depends(get_current_agent)):
    agents_collection.update_one(
        {"agent_id": current_agent["agent_id"]},
        {"$set": {"status": payload.status, "last_heartbeat": current_timestamp()}},
    )
    return {"message": "Heartbeat received", "status": payload.status}


@app.get("/agents")
def get_agents(current_user: dict = Depends(get_current_user)):
    agents = []
    for agent in agents_collection.find({"user_email": current_user["email"]}).sort("created_at", DESCENDING):
        agents.append(mark_agent_status(serialize_document(agent)))
    return agents


@app.get("/agent/{agent_id}")
def get_agent(agent_id: str, current_user: dict = Depends(get_current_user)):
    agent = agents_collection.find_one({"agent_id": agent_id, "user_email": current_user["email"]})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return mark_agent_status(serialize_document(agent))


@app.delete("/agent/{agent_id}")
def delete_agent(agent_id: str, current_user: dict = Depends(get_current_user)):
    result = agents_collection.delete_one({"agent_id": agent_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")

    traffic_collection.delete_many({"agent_id": agent_id, "user_email": current_user["email"]})
    network_devices_collection.delete_many({"agent_id": agent_id, "user_email": current_user["email"]})
    return {"message": "Agent unpaired successfully"}


@app.post("/network/devices")
def ingest_network_devices(payload: NetworkDeviceBatch, current_agent: dict = Depends(get_current_agent)):
    upserted = 0
    updated = 0
    alerts_created = 0

    for device in payload.devices:
        device_data = device.model_dump()
        device_data.update({
            "agent_id": current_agent["agent_id"],
            "user_email": current_agent["user_email"],
            "last_seen": current_timestamp(),
        })

        identity = [{"ip_address": device_data["ip_address"]}]
        if device_data.get("mac_address"):
            identity.append({"mac_address": device_data["mac_address"]})

        existing = network_devices_collection.find_one({
            "agent_id": current_agent["agent_id"],
            "user_email": current_agent["user_email"],
            "$or": identity,
        })

        if existing:
            network_devices_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {**device_data, "first_seen": existing.get("first_seen", current_timestamp())}},
            )
            updated += 1
        else:
            device_data["first_seen"] = current_timestamp()
            network_devices_collection.insert_one(device_data)
            alerts_collection.insert_one(build_new_device_alert(device_data))
            upserted += 1
            alerts_created += 1

    return {"message": "Network devices processed", "devices_added": upserted, "devices_updated": updated, "alerts_created": alerts_created}


@app.get("/network/devices")
def get_network_devices(
    agent_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    ip_address: Optional[str] = Query(None),
    hostname: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    query = {"user_email": current_user["email"]}
    if agent_id:
        query["agent_id"] = agent_id
    if status:
        query["status"] = status
    if ip_address:
        query["ip_address"] = ip_address
    if hostname:
        query["hostname"] = {"$regex": re.escape(hostname.strip()), "$options": "i"}

    return [serialize_document(device) for device in network_devices_collection.find(query).sort("last_seen", DESCENDING)]


@app.post("/traffic")
def ingest_traffic(event: TrafficEvent, current_agent: dict = Depends(get_current_agent)):
    traffic_data = event.model_dump()
    traffic_data.update({
        "agent_id": current_agent["agent_id"],
        "user_email": current_agent["user_email"],
        "created_at": current_timestamp(),
    })

    recent_events = list(traffic_collection.find({
        "agent_id": current_agent["agent_id"],
        "user_email": current_agent["user_email"],
        "source_ip": traffic_data["source_ip"],
        "created_at": {"$gte": one_minute_ago()},
    }))
    status, risk_score, reasons = score_traffic(traffic_data, recent_events)
    traffic_data["status"] = status
    traffic_data["risk_score"] = risk_score

    result = traffic_collection.insert_one(traffic_data)
    alert_created = False
    if risk_score >= 31:
        alerts_collection.insert_one(build_traffic_alert(traffic_data, reasons))
        alert_created = True

    return {"message": "Traffic metadata received", "traffic_id": str(result.inserted_id), "status": status, "risk_score": risk_score, "alert_created": alert_created}


@app.get("/traffic")
def get_traffic(
    agent_id: Optional[str] = Query(None),
    source_ip: Optional[str] = Query(None),
    destination_ip: Optional[str] = Query(None),
    protocol: Optional[str] = Query(None),
    destination_port: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    query = {"user_email": current_user["email"]}
    if agent_id:
        query["agent_id"] = agent_id
    if source_ip:
        query["source_ip"] = source_ip
    if destination_ip:
        query["destination_ip"] = destination_ip
    if protocol:
        query["protocol"] = protocol.strip().upper()
    if destination_port is not None:
        query["destination_port"] = destination_port
    if status:
        query["status"] = status
    with_date_range(query, "timestamp", date_from, date_to)

    skip = (page - 1) * limit
    total = traffic_collection.count_documents(query)
    items = [
        serialize_document(item)
        for item in traffic_collection.find(query).sort("created_at", DESCENDING).skip(skip).limit(limit)
    ]
    return {"items": items, "page": page, "limit": limit, "total": total}


def top_group(collection, match_query: dict, field: str, label: str, limit: int = 5) -> list[dict]:
    pipeline = [
        {"$match": {**match_query, field: {"$ne": None}}},
        {"$group": {"_id": f"${field}", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    return [{label: item["_id"], "count": item["count"]} for item in collection.aggregate(pipeline)]


@app.get("/traffic/stats")
def traffic_stats(current_user: dict = Depends(get_current_user)):
    query = {"user_email": current_user["email"]}
    return {
        "total_packets": traffic_collection.count_documents(query),
        "tcp_packets": traffic_collection.count_documents({**query, "protocol": "TCP"}),
        "udp_packets": traffic_collection.count_documents({**query, "protocol": "UDP"}),
        "icmp_packets": traffic_collection.count_documents({**query, "protocol": "ICMP"}),
        "suspicious_packets": traffic_collection.count_documents({**query, "status": "Suspicious"}),
        "high_risk_packets": traffic_collection.count_documents({**query, "status": "High Risk"}),
        "top_source_ips": top_group(traffic_collection, query, "source_ip", "source_ip"),
        "top_destination_ips": top_group(traffic_collection, query, "destination_ip", "destination_ip"),
        "top_ports": top_group(traffic_collection, query, "destination_port", "port"),
        "protocol_distribution": top_group(traffic_collection, query, "protocol", "protocol"),
    }


@app.get("/traffic/live-summary")
def traffic_live_summary(current_user: dict = Depends(get_current_user)):
    base_query = {"user_email": current_user["email"]}
    recent_query = {**base_query, "created_at": {"$gte": one_minute_ago()}}
    latest_alerts = [
        serialize_document(alert)
        for alert in alerts_collection.find(user_alert_query(current_user["email"])).sort("detected_at", DESCENDING).limit(5)
    ]
    return {
        "recent_traffic_count": traffic_collection.count_documents(recent_query),
        "suspicious_count": traffic_collection.count_documents({**recent_query, "status": {"$in": ["Suspicious", "High Risk"]}}),
        "latest_alerts": latest_alerts,
        "active_agents": agents_collection.count_documents({**base_query, "status": "Online"}),
        "top_ports": top_group(traffic_collection, recent_query, "destination_port", "port"),
    }


@app.get("/alerts")
def get_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    query = user_alert_query(current_user["email"])
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity.strip().title()
    if source_type:
        query["source_type"] = source_type
    if agent_id:
        query["agent_id"] = agent_id

    return [serialize_document(alert) for alert in alerts_collection.find(query).sort("detected_at", DESCENDING)]


@app.put("/alerts/{alert_id}/close")
def close_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    object_id = object_id_or_400(alert_id)
    result = alerts_collection.update_one(
        {"_id": object_id, **user_alert_query(current_user["email"])},
        {"$set": {"status": "Closed", "closed_at": current_timestamp(), "closed_by": current_user["email"]}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert closed successfully"}


@app.delete("/alerts/{alert_id}")
def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    object_id = object_id_or_400(alert_id)
    result = alerts_collection.delete_one({"_id": object_id, **user_alert_query(current_user["email"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted successfully"}


@app.get("/dashboard/stats")
def dashboard_stats(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    log_query = user_log_query(email)
    alert_query = user_alert_query(email)
    traffic_query = {"user_email": email}
    agent_query = {"user_email": email}

    return {
        "total_logs": logs_collection.count_documents(log_query),
        "total_alerts": alerts_collection.count_documents(alert_query),
        "open_alerts": alerts_collection.count_documents({**alert_query, "status": "Open"}),
        "closed_alerts": alerts_collection.count_documents({**alert_query, "status": "Closed"}),
        "high_severity": logs_collection.count_documents({**log_query, "severity": "High"}),
        "medium_severity": logs_collection.count_documents({**log_query, "severity": "Medium"}),
        "low_severity": logs_collection.count_documents({**log_query, "severity": "Low"}),
        "total_agents": agents_collection.count_documents(agent_query),
        "online_agents": agents_collection.count_documents({**agent_query, "status": "Online"}),
        "offline_agents": agents_collection.count_documents({**agent_query, "status": "Offline"}),
        "known_devices": network_devices_collection.count_documents({"user_email": email}),
        "total_packets": traffic_collection.count_documents(traffic_query),
        "suspicious_packets": traffic_collection.count_documents({**traffic_query, "status": "Suspicious"}),
        "high_risk_packets": traffic_collection.count_documents({**traffic_query, "status": "High Risk"}),
    }


@app.get("/reports/summary")
def report_summary(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    stats = dashboard_stats(current_user)
    top_risky_ips = top_group(traffic_collection, {"user_email": email, "status": {"$in": ["Suspicious", "High Risk"]}}, "source_ip", "source_ip")
    recent_devices = [
        serialize_document(device)
        for device in network_devices_collection.find({"user_email": email}).sort("first_seen", DESCENDING).limit(5)
    ]
    recommendations = [
        "Review open high-severity alerts first.",
        "Validate newly discovered devices against your authorized asset list.",
        "Investigate repeated sensitive-port traffic and unusual outbound transfers.",
        "Keep the Windows agent visible and run it only on authorized networks.",
    ]
    report = {
        "generated_at": current_timestamp(),
        "stats": stats,
        "top_risky_ips": top_risky_ips,
        "recent_devices": recent_devices,
        "recommendations": recommendations,
    }
    reports_collection.insert_one({"user_email": email, **report})
    return report
