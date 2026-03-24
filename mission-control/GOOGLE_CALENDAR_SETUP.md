# Google Calendar setup for Mission Control

Goal: connect Mike's Google account (`michael.coen@gmail.com`) and use the **primary Google Calendar** in the dashboard.

The setup script also creates or reuses a secondary calendar named `OpenClaw` so you have a dedicated calendar available if you want it later, but the dashboard is currently configured to use `primary`.

## What is prepared

- `google_calendar_setup.py` — runs OAuth, ensures the `OpenClaw` calendar exists, and configures the dashboard to use `primary`
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
- authenticate `michael.coen@gmail.com`
- save OAuth tokens to `token.json`
- create or reuse a calendar named `OpenClaw`
- configure `config.json` to use your **primary** Google Calendar for the dashboard

## Config knobs

In `config.json`:

- `googleCalendar.calendarId` → `primary` for your main calendar, or another Google calendar ID if you want to switch later
- `googleCalendar.lookaheadDays` → how many upcoming days to show (currently `30`)

## Notes

- `credentials.json` and `token.json` contain sensitive auth material. Keep them private.
- The dashboard falls back to `calendar[]` only if Google Calendar fetch fails.
