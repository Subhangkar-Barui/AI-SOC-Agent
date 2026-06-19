from __future__ import annotations

import requests


class ApiClient:
    def __init__(self, backend_url: str):
        self.backend_url = backend_url.rstrip("/")
        self.agent_token: str | None = None

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.agent_token:
            headers["Authorization"] = f"Bearer {self.agent_token}"
        return headers

    def register_agent(self, pairing_key: str, device_name: str, os_name: str, agent_version: str) -> dict:
        response = requests.post(
            f"{self.backend_url}/agent/register",
            json={
                "pairing_key": pairing_key,
                "device_name": device_name,
                "os": os_name,
                "agent_version": agent_version,
            },
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        self.agent_token = data["agent_token"]
        return data

    def heartbeat(self, status: str = "Online") -> dict:
        response = requests.post(
            f"{self.backend_url}/agent/heartbeat",
            json={"status": status},
            headers=self._headers(),
            timeout=15,
        )
        response.raise_for_status()
        return response.json()

    def send_devices(self, devices: list[dict]) -> dict:
        if not devices:
            return {"message": "No devices to send"}
        response = requests.post(
            f"{self.backend_url}/network/devices",
            json={"devices": devices},
            headers=self._headers(),
            timeout=20,
        )
        response.raise_for_status()
        return response.json()

    def send_traffic(self, event: dict) -> dict:
        response = requests.post(
            f"{self.backend_url}/traffic",
            json=event,
            headers=self._headers(),
            timeout=15,
        )
        response.raise_for_status()
        return response.json()
