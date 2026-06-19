from __future__ import annotations

import socket
from ipaddress import ip_network

import psutil


def get_hostname(ip_address: str) -> str | None:
    try:
        return socket.gethostbyaddr(ip_address)[0]
    except (socket.herror, socket.gaierror, OSError):
        return None


def local_interface_devices() -> list[dict]:
    devices: list[dict] = []
    for interface_name, addresses in psutil.net_if_addrs().items():
        mac_address = None
        ipv4_address = None
        netmask = None

        for address in addresses:
            family_name = getattr(address.family, "name", str(address.family))
            if family_name in {"AF_LINK", "AF_PACKET"}:
                mac_address = address.address
            elif family_name == "AF_INET":
                ipv4_address = address.address
                netmask = address.netmask

        if ipv4_address:
            devices.append({
                "ip_address": ipv4_address,
                "mac_address": mac_address,
                "hostname": socket.gethostname(),
                "vendor": "Local Interface",
                "status": "Online",
                "interface_name": interface_name,
                "subnet": str(ip_network(f"{ipv4_address}/{netmask}", strict=False)) if netmask else None,
            })
    return devices


def discover_visible_devices() -> list[dict]:
    return [
        {
            "ip_address": device["ip_address"],
            "mac_address": device.get("mac_address"),
            "hostname": device.get("hostname") or get_hostname(device["ip_address"]),
            "vendor": device.get("vendor") or "Unknown",
            "status": "Online",
        }
        for device in local_interface_devices()
    ]
