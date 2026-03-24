# Mission Control Dashboard

A lightweight local dashboard for Mike and Hank, backed by a tiny local API.

## What it includes now

- Live OpenClaw reminder / cron job panel
- Config-backed calendar panel
- Project cards for configured git repos
- Service health checks for configured commands
- Safe quick-action buttons for common local commands
- Git branch, HEAD, and working tree changes
- OpenClaw status excerpt
- Workspace summary and disk usage
- Recent memory file highlights
- Notes panel with local browser persistence

## Run it

```bash
cd /home/mcoen/.openclaw/workspace/mission-control
python3 server.py
```

Then open:

<http://127.0.0.1:4173>

## API

- `GET /api/dashboard` → JSON snapshot used by the UI
- `POST /api/action` → run a fixed safe quick action

## Config

Edit:

`/home/mcoen/.openclaw/workspace/mission-control/config.json`

Fields:

- `calendar[]` → upcoming events to show on the dashboard
- `repos[]` → git repos to track (`name`, `path`)
- `services[]` → command-based health checks (`name`, `command`)

Example:

```json
{
  "calendar": [
    { "title": "Doctor", "when": "2026-03-25 14:00", "detail": "Bring paperwork" }
  ],
  "repos": [
    { "name": "workspace", "path": "/home/mcoen/.openclaw/workspace" }
  ],
  "services": [
    { "name": "Gateway", "command": "openclaw gateway status" }
  ]
}
```

## Quick actions included

- OpenClaw status
- List reminders
- Git status
- Gateway status
