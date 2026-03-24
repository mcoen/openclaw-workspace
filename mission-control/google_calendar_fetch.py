#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENDOR = ROOT / "vendor"
if VENDOR.exists():
    sys.path.insert(0, str(VENDOR))

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

TOKEN_PATH = ROOT / "token.json"
CONFIG_PATH = ROOT / "config.json"
READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
FULL_SCOPE = "https://www.googleapis.com/auth/calendar"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def load_creds() -> Credentials | None:
    if not TOKEN_PATH.exists():
        return None
    creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), [FULL_SCOPE])
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
    return creds


def main() -> None:
    config = load_config()
    gc = config.get("googleCalendar") or {}
    creds = load_creds()
    if not creds or not gc.get("enabled") or not gc.get("calendarId"):
        print("[]")
        return

    service = build("calendar", "v3", credentials=creds)
    lookahead_days = int(gc.get("lookaheadDays", 30))
    now = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=lookahead_days)).isoformat()
    events = service.events().list(
        calendarId=gc["calendarId"],
        timeMin=now,
        timeMax=end,
        singleEvents=True,
        orderBy="startTime",
        maxResults=30,
    ).execute().get("items", [])

    simplified = []
    for event in events:
        start = event.get("start", {}).get("dateTime") or event.get("start", {}).get("date") or "TBD"
        simplified.append({
            "title": event.get("summary") or "Untitled event",
            "when": start,
            "detail": event.get("description", "")[:180]
        })

    print(json.dumps(simplified))


if __name__ == "__main__":
    main()
