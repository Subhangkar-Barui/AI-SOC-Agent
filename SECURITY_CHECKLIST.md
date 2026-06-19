# Security Checklist

## Access Control
- User JWTs protect logs, alerts, agents, devices, traffic, dashboard stats, and reports.
- Agent tokens protect heartbeat, device ingestion, and traffic ingestion.
- Every user query is scoped to `user_email`.
- Alert closure/deletion and agent deletion check ownership.

## Cryptography
- Passwords are hashed with bcrypt.
- Pairing keys are stored hashed and shown only once.
- JWTs expire.
- Secrets live in environment variables and `.env` is ignored.

## Injection Prevention
- Pydantic validates users, logs, agents, devices, and traffic.
- MongoDB filters are allowlisted.
- Regex filters use escaped user input.
- ObjectId values are validated.
- No `eval`, `exec`, or dynamic code execution is used.

## File Upload Safety
- CSV uploads require `.csv`.
- Uploaded content is decoded as UTF-8/UTF-8-BOM.
- CSV rows are validated before insertion.
- Uploaded files are never executed.

## React Safety
- No `dangerouslySetInnerHTML`.
- Secrets are not exposed to the frontend.
- User data is rendered as text.

## Agent Safety
- Visible consent notice.
- No stealth behavior.
- No persistence abuse.
- No packet payload capture.
- No password, cookie, file, message, keystroke, or credential collection.
- Metadata only.
- User can stop monitoring with Ctrl+C.

## SSRF
- Backend does not fetch arbitrary user-provided URLs.
- Future threat-intelligence integrations should use allowlisted domains.
