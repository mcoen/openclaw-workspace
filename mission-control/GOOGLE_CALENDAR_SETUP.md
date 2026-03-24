# Google Calendar setup for Mission Control

Goal: connect Mike's Google account (`michael.coen@gmail.com`) and create or reuse a calendar named `OpenClaw`.

## What I already prepared

- `google_calendar_setup.py` — runs the OAuth flow and creates the calendar if needed
- `google_calendar_fetch.py` — fetches upcoming events from the configured Google calendar
- `vendor/` — local Python packages for Google Calendar API access

## One-time Google Cloud steps

1. Go to <https://console.cloud.google.com/>
2. Create or pick a project
3. Enable **Google Calendar API**
4. Go to **Google Auth Platform → Clients**
5. Create an **OAuth client ID** of type **Desktop app**
6. Download the JSON file
7. Save it as:

`/home/mcoen/.openclaw/workspace/mission-control/credentials.json`

## Then run

```bash
cd /home/mcoen/.openclaw/workspace/mission-control
python3 google_calendar_setup.py
```

That will:
- open a browser-based Google login flow
- authenticate `michael.coen@gmail.com`
- create or reuse a calendar named `OpenClaw`
- save OAuth tokens to `token.json`
- write the chosen calendar ID into `config.json`

## Notes

- `credentials.json` and `token.json` contain sensitive auth material. Keep them private.
- If you want, I can next wire `server.py` so the dashboard calendar panel automatically reads from Google Calendar once setup is complete.
