# Mission Control Dashboard

A lightweight local dashboard scaffold for Mike and Hank, now backed by a tiny local API.

## What it includes

- Responsive single-page dashboard
- Live snapshot from local commands
- Git branch, HEAD, and working tree changes
- OpenClaw status excerpt
- Workspace summary and disk usage
- Recent memory file highlights
- Notes panel with local browser persistence

## Run it

From this directory:

```bash
python3 server.py
```

Then open:

<http://127.0.0.1:4173>

## API

- `GET /api/dashboard` → JSON snapshot used by the UI

## Good next upgrades

- Add cron/reminder data if you want mission control to surface upcoming alerts
- Add calendar/tasks modules
- Add service checks for anything you run locally
- Add quick actions for common workflows
