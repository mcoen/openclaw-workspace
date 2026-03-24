#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENDOR = ROOT / "vendor"
if VENDOR.exists():
    sys.path.insert(0, str(VENDOR))

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/calendar"]
CREDENTIALS_PATH = ROOT / "credentials.json"
TOKEN_PATH = ROOT / "token.json"
CONFIG_PATH = ROOT / "config.json"
CALENDAR_NAME = "OpenClaw"


def load_creds() -> Credentials:
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds or not creds.valid:
        if not CREDENTIALS_PATH.exists():
            raise SystemExit(
                "Missing credentials.json in mission-control/. Download a Desktop OAuth client from Google Cloud and place it here."
            )
        flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
        creds = flow.run_local_server(port=0)
        TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
    return creds


def ensure_calendar(service) -> dict:
    page_token = None
    while True:
        resp = service.calendarList().list(pageToken=page_token).execute()
        for item in resp.get("items", []):
            if item.get("summary") == CALENDAR_NAME:
                return item
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    created = service.calendars().insert(body={"summary": CALENDAR_NAME}).execute()
    return created


def update_config(calendar_id: str):
    data = {}
    if CONFIG_PATH.exists():
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    data.setdefault("calendar", [])
    data["googleCalendar"] = {
        "enabled": True,
        "calendarId": calendar_id,
        "accountHint": "michael.coen@gmail.com"
    }
    CONFIG_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main():
    try:
        creds = load_creds()
        service = build("calendar", "v3", credentials=creds)
        calendar = ensure_calendar(service)
        update_config(calendar["id"])
        print(json.dumps({
            "ok": True,
            "calendarId": calendar.get("id"),
            "summary": calendar.get("summary"),
            "timeZone": calendar.get("timeZone")
        }, indent=2))
    except HttpError as err:
        print(json.dumps({"ok": False, "error": str(err)}, indent=2))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
