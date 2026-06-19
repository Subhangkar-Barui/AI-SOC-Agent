from __future__ import annotations

import platform
import socket
import threading
import time
from datetime import datetime

import psutil
from scapy.all import ARP, ICMP, IP, TCP, UDP, conf, sniff

from api_client import ApiClient
from config import AGENT_VERSION, CONSENT_NOTICE, DEFAULT_HEARTBEAT_SECONDS
from detection_local import local_risk_hint
from discovery import discover_visible_devices


def now_timestamp() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


def choose_interface() -> str | None:
    interfaces = list(psutil.net_if_addrs().keys())
    if not interfaces:
        return None

    print("\nAvailable network interfaces:")
    for index, interface in enumerate(interfaces, start=1):
        print(f"{index}. {interface}")

    while True:
        selection = input("Select interface number: ").strip()
        if selection.isdigit() and 1 <= int(selection) <= len(interfaces):
            return interfaces[int(selection) - 1]
        print("Invalid selection. Try again.")


def packet_to_metadata(packet, interface_name: str) -> dict | None:
    protocol = "OTHER"
    source_port = None
    destination_port = None
    source_ip = None
    destination_ip = None

    if packet.haslayer(IP):
        source_ip = packet[IP].src
        destination_ip = packet[IP].dst
    elif packet.haslayer(ARP):
        source_ip = packet[ARP].psrc
        destination_ip = packet[ARP].pdst
        protocol = "ARP"

    if packet.haslayer(TCP):
        protocol = "TCP"
        source_port = int(packet[TCP].sport)
        destination_port = int(packet[TCP].dport)
    elif packet.haslayer(UDP):
        protocol = "UDP"
        source_port = int(packet[UDP].sport)
        destination_port = int(packet[UDP].dport)
    elif packet.haslayer(ICMP):
        protocol = "ICMP"

    if not source_ip or not destination_ip:
        return None

    local_ips = {
        address.address
        for addresses in psutil.net_if_addrs().values()
        for address in addresses
        if getattr(address.family, "name", str(address.family)) == "AF_INET"
    }
    if source_ip in local_ips:
        direction = "outbound"
    elif destination_ip in local_ips:
        direction = "inbound"
    else:
        direction = "local"

    event = {
        "timestamp": now_timestamp(),
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "protocol": protocol,
        "source_port": source_port,
        "destination_port": destination_port,
        "packet_size": len(packet),
        "direction": direction,
        "interface_name": interface_name,
    }
    event["local_hint"] = local_risk_hint(event)
    return event


def heartbeat_loop(client: ApiClient, stop_event: threading.Event) -> None:
    while not stop_event.is_set():
        try:
            client.heartbeat("Online")
            print(f"[{now_timestamp()}] Heartbeat sent")
        except Exception as exc:
            print(f"Heartbeat failed: {exc}")
        stop_event.wait(DEFAULT_HEARTBEAT_SECONDS)


def main() -> None:
    print(CONSENT_NOTICE)
    consent = input("Type I AGREE to continue: ").strip()
    if consent != "I AGREE":
        print("Consent not provided. Exiting.")
        return

    backend_url = input("Backend API URL: ").strip()
    pairing_key = input("Agent pairing key: ").strip()
    client = ApiClient(backend_url)

    device_name = socket.gethostname()
    os_name = f"{platform.system()} {platform.release()}"
    registration = client.register_agent(pairing_key, device_name, os_name, AGENT_VERSION)
    print(f"Registered agent: {registration['agent_id']}")

    interface_name = choose_interface()
    if not interface_name:
        print("No network interface found. Exiting.")
        return

    try:
        devices = discover_visible_devices()
        result = client.send_devices(devices)
        print(f"Device discovery sent: {result}")
    except Exception as exc:
        print(f"Device discovery failed: {exc}")

    stop_event = threading.Event()
    heartbeat_thread = threading.Thread(target=heartbeat_loop, args=(client, stop_event), daemon=True)
    heartbeat_thread.start()

    print("\nMonitoring started. Press Ctrl+C to stop. Packet payloads are not captured.")
    conf.sniff_promisc = False

    def handle_packet(packet) -> None:
        event = packet_to_metadata(packet, interface_name)
        if not event:
            return
        event.pop("local_hint", None)
        try:
            response = client.send_traffic(event)
            print(f"{event['protocol']} {event['source_ip']} -> {event['destination_ip']} risk={response.get('risk_score')}")
        except Exception as exc:
            print(f"Traffic send failed: {exc}")

    try:
        sniff(iface=interface_name, prn=handle_packet, store=False)
    except KeyboardInterrupt:
        print("\nStopping monitor...")
    finally:
        stop_event.set()
        try:
            client.heartbeat("Paused")
        except Exception:
            pass
        print("Agent stopped.")


if __name__ == "__main__":
    main()
