SENSITIVE_PORTS = {22, 23, 445, 3389, 3306, 5432}


def local_risk_hint(event: dict) -> str:
    destination_port = event.get("destination_port")
    if destination_port in SENSITIVE_PORTS:
        return "Sensitive destination port observed"
    if event.get("direction") == "outbound" and event.get("packet_size", 0) >= 1_000_000:
        return "Large outbound packet observed"
    return "Normal metadata event"
