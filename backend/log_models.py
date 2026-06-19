from datetime import datetime
from ipaddress import ip_address
from typing import Literal

from pydantic import BaseModel, Field, field_validator

Severity = Literal["High", "Medium", "Low"]

class SecurityLog(BaseModel):
    timestamp: str = Field(..., min_length=19, max_length=19)
    source_ip: str = Field(..., min_length=3, max_length=45)
    destination_ip: str = Field(..., min_length=3, max_length=45)
    event_type: str = Field(..., min_length=2, max_length=120)
    severity: Severity
    message: str = Field(..., min_length=2, max_length=1000)

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
    def validate_ip_address(cls, value: str) -> str:
        value = value.strip()
        try:
            ip_address(value)
        except ValueError as exc:
            raise ValueError("Invalid IP address") from exc
        return value

    @field_validator("event_type", "message")
    @classmethod
    def strip_and_require_value(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value

    @field_validator("severity", mode="before")
    @classmethod
    def normalize_severity(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Severity must be text")
        normalized = value.strip().title()
        if normalized not in {"High", "Medium", "Low"}:
            raise ValueError("Severity must be High, Medium, or Low")
        return normalized
