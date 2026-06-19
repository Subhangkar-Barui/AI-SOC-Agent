import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ai_soc_dashboard")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

users_collection = db["users"]
logs_collection = db["logs"]
alerts_collection = db["alerts"]
agents_collection = db["agents"]
pairing_keys_collection = db["agent_pairing_keys"]
network_devices_collection = db["network_devices"]
traffic_collection = db["traffic"]
reports_collection = db["reports"]
