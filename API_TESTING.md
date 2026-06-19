# API Testing Guide

Use your own analyst account, real MongoDB database, and real authorized network metadata.

```powershell
$BASE_URL = "http://127.0.0.1:8000"
$ANALYST_NAME = "<your-name>"
$ANALYST_EMAIL = "<your-email>"
$ANALYST_PASSWORD = "<strong-password>"
```

## Register And Login

```powershell
curl.exe -X POST "$BASE_URL/register" -H "Content-Type: application/json" -d "{`"name`":`"$ANALYST_NAME`",`"email`":`"$ANALYST_EMAIL`",`"password`":`"$ANALYST_PASSWORD`"}"

$LOGIN = curl.exe -s -X POST "$BASE_URL/login" -H "Content-Type: application/json" -d "{`"email`":`"$ANALYST_EMAIL`",`"password`":`"$ANALYST_PASSWORD`"}" | ConvertFrom-Json
$TOKEN = $LOGIN.access_token
```

## Generate Agent Pairing Key

```powershell
$PAIRING = curl.exe -s -X POST "$BASE_URL/agent/generate-key" -H "Authorization: Bearer $TOKEN" | ConvertFrom-Json
$PAIRING.pairing_key
```

Use this key in the Windows agent.

## User APIs

```powershell
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/profile"
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/agents"
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/network/devices"
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/traffic?limit=25"
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/traffic/stats"
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/traffic/live-summary"
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/alerts"
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/stats"
curl.exe -H "Authorization: Bearer $TOKEN" "$BASE_URL/reports/summary"
```

## CSV Upload

```powershell
$REAL_CSV_PATH = "<path-to-real-csv-export>"
curl.exe -X POST "$BASE_URL/logs/upload-csv" -H "Authorization: Bearer $TOKEN" -F "file=@$REAL_CSV_PATH"
```

Required CSV header:

```csv
timestamp,source_ip,destination_ip,event_type,severity,message
```

## Negative Checks

```powershell
curl.exe "$BASE_URL/traffic"
curl.exe -X PUT -H "Authorization: Bearer $TOKEN" "$BASE_URL/alerts/not-an-id/close"
curl.exe -X POST "$BASE_URL/logs/upload-csv" -H "Authorization: Bearer $TOKEN" -F "file=@README.md"
```
