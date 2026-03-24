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

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
TOKEN_PATH = ROOT / "token.json"
CONFIG_PATH = ROOT / "config.json"


def main():
    if not TOKEN_PATH.exists() or not CONFIG_PATH.exists():
        print("[]")
        return
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    gc = config.get("googleCalendar") or {}
    if not gc.get("enabled") or not gc.get("calendarId"):
        print("[]")
        return

    creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), ["https://www.googleapis.com/auth/calendar"])
    service = build("calendar", "v3", credentials=creds)
    now = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()
    events = service.events().list(
        calendarId=gc["calendarId"],
        timeMin=now,
        timeMax=end,
        singleEvents=True,
        orderBy="startTime",
        maxResults=20,
    ).execute().get("items", [])
    simplified = []
    for event in events:
        start = event.get("start", {}).get("dateTime") or event.get("start", {}).get("date") or "TBD"
        simplified.append({
            "title": event.get("summary") or "Untitled event",
            "when": start,
            "detail": event.get("description", "")[:140]
        })
    print(json.dumps(simplified))


if __name__ == "__main__":
    main()
