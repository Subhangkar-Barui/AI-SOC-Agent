from typing import Literal
from ipaddress import ip_address

from pydantic import BaseModel, Field, field_validator


class AgentRegister(BaseModel):
    pairing_key: str = Field(..., min_length=20, max_length=200)
    device_name: str = Field(..., min_length=1, max_length=120)
    os: str = Field(default="Windows", min_length=1, max_length=80)
    agent_version: str = Field(default="1.0.0", min_length=1, max_length=40)

    @field_validator("pairing_key", "device_name", "os", "agent_version")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value


class AgentHeartbeat(BaseModel):
    status: Literal["Online", "Paused"] = "Online"


class NetworkDevice(BaseModel):
    ip_address: str = Field(..., min_length=3, max_length=45)
    mac_address: str | None = Field(default=None, max_length=32)
    hostname: str | None = Field(default=None, max_length=120)
    vendor: str | None = Field(default="Unknown", max_length=120)
    status: Literal["Online", "Offline", "Unknown"] = "Online"

    @field_validator("ip_address")
    @classmethod
    def validate_ip_address(cls, value: str) -> str:
        value = value.strip()
        try:
            ip_address(value)
        except ValueError as exc:
            raise ValueError("Invalid IP address") from exc
        return value

    @field_validator("mac_address", "hostname", "vendor", mode="before")
    @classmethod
    def clean_optional_text(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class NetworkDeviceBatch(BaseModel):
    devices: list[NetworkDevice] = Field(..., min_length=1, max_length=512)
