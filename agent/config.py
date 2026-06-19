APP_NAME = "SOC Windows Network Monitoring Agent"
AGENT_VERSION = "1.0.0"
DEFAULT_HEARTBEAT_SECONDS = 45
DEFAULT_TRAFFIC_BATCH_SIZE = 25

CONSENT_NOTICE = """
SOC Windows Network Monitoring Agent

This tool is for your own device, home/lab network, or a network where you have explicit permission.
It captures network metadata only: IPs, ports, protocol, packet size, direction, interface name, and device status.

It does not capture passwords, cookies, browser content, files, private messages, keystrokes, credentials, or packet payloads.
The agent runs visibly in this console. Close the window or press Ctrl+C to stop monitoring.
"""
