from datetime import datetime
from ipaddress import ip_address
from typing import Literal

from pydantic import BaseModel, Field, field_validator

Protocol = Literal["TCP", "UDP", "ICMP", "ARP", "OTHER"]
Direction = Literal["inbound", "outbound", "local", "unknown"]


class TrafficEvent(BaseModel):
    timestamp: str = Field(..., min_length=19, max_length=19)
    source_ip: str = Field(..., min_length=3, max_length=45)
    destination_ip: str = Field(..., min_length=3, max_length=45)
    protocol: Protocol = "OTHER"
    source_port: int | None = Field(default=None, ge=0, le=65535)
    destination_port: int | None = Field(default=None, ge=0, le=65535)
    packet_size: int = Field(..., ge=0, le=10_000_000)
    direction: Direction = "unknown"
    interface_name: str | None = Field(default=None, max_length=120)

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, value: str) -> str:
        value = value.strip()
        try:
            datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        except ValueError as exc:
            raise ValueError("Timestamp must use YYYY-MM-DD HH:MM:SS format") from exc
        return value

    @field_validator("source_ip", "destination_ip")
    @classmethod
    def validate_ip(cls, value: str) -> str:
        value = value.strip()
        try:
            ip_address(value)
        except ValueError as exc:
            raise ValueError("Invalid IP address") from exc
        return value

    @field_validator("protocol", mode="before")
    @classmethod
    def normalize_protocol(cls, value: str) -> str:
        value = str(value or "OTHER").strip().upper()
        return value if value in {"TCP", "UDP", "ICMP", "ARP", "OTHER"} else "OTHER"

    @field_validator("direction", mode="before")
    @classmethod
    def normalize_direction(cls, value: str) -> str:
        value = str(value or "unknown").strip().lower()
        return value if value in {"inbound", "outbound", "local", "unknown"} else "unknown"

    @field_validator("interface_name", mode="before")
    @classmethod
    def clean_interface_name(cls, value):
        if value is None:
            return value
        value = str(value).strip()
        return value or None
