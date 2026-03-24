#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import platform
import shlex
import shutil
import socketserver
import subprocess
import sys
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent
PORT = int(os.environ.get("MISSION_CONTROL_PORT", "4173"))
CONFIG_PATH = ROOT / "config.json"
GOOGLE_CALENDAR_FETCH = ROOT / "google_calendar_fetch.py"
QUICK_ACTIONS = {
    "openclaw-status": {
        "label": "OpenClaw status",
        "command": ["openclaw", "status"],
        "cwd": WORKSPACE,
    },
    "cron-list": {
        "label": "List reminders",
        "command": ["openclaw", "cron", "list", "--json"],
        "cwd": WORKSPACE,
    },
    "git-status": {
        "label": "Git status",
        "command": ["git", "status", "--short"],
        "cwd": WORKSPACE,
    },
    "gateway-status": {
        "label": "Gateway status",
        "command": ["openclaw", "gateway", "status"],
        "cwd": WORKSPACE,
    },
}


def run(cmd: list[str], cwd: Path | None = None, timeout: int = 10) -> dict:
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(cwd) if cwd else None,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        return {
            "ok": proc.returncode == 0,
            "code": proc.returncode,
            "stdout": proc.stdout.strip(),
            "stderr": proc.stderr.strip(),
        }
    except Exception as exc:
        return {"ok": False, "code": -1, "stdout": "", "stderr": str(exc)}


def safe_read(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return None


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {"calendar": [], "repos": [], "services": []}
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"calendar": [], "repos": [], "services": []}


def recent_memory() -> list[dict]:
    memory_dir = WORKSPACE / "memory"
    if not memory_dir.exists():
        return []
    items = []
    for path in sorted(memory_dir.glob("*.md"), reverse=True)[:5]:
        text = safe_read(path) or ""
        lines = [line.strip("- ").strip() for line in text.splitlines() if line.strip().startswith("-")]
        items.append({"file": path.name, "highlights": lines[:4]})
    return items


def workspace_overview() -> dict:
    total, used, free = shutil.disk_usage(WORKSPACE)
    top_files = []
    for path in sorted(WORKSPACE.iterdir()):
        if path.name == ".git":
            continue
        top_files.append({"name": path.name, "type": "dir" if path.is_dir() else "file"})
    return {
        "path": str(WORKSPACE),
        "disk": {
            "totalGb": round(total / (1024**3), 1),
            "usedGb": round(used / (1024**3), 1),
            "freeGb": round(free / (1024**3), 1),
        },
        "topLevel": top_files[:20],
    }


def fetch_reminders() -> dict:
    result = run(["openclaw", "cron", "list", "--json"], cwd=WORKSPACE)
    jobs = []
    if result.get("ok") and result.get("stdout"):
        try:
            payload = json.loads(result["stdout"])
            jobs = payload.get("jobs", [])
        except Exception:
            pass
    return {"ok": result.get("ok"), "jobs": jobs, "error": result.get("stderr")}


def fetch_calendar(config: dict) -> dict:
    google_cfg = config.get("googleCalendar") or {}
    fallback = config.get("calendar", [])[:10]
    if google_cfg.get("enabled") and google_cfg.get("calendarId") and GOOGLE_CALENDAR_FETCH.exists():
        result = run([sys.executable, str(GOOGLE_CALENDAR_FETCH)], cwd=ROOT, timeout=20)
        if result.get("ok") and result.get("stdout"):
            try:
                events = json.loads(result["stdout"])
                return {
                    "events": events[:10],
                    "source": "google",
                    "ok": True,
                    "error": "",
                }
            except Exception as exc:
                return {
                    "events": fallback,
                    "source": "config",
                    "ok": False,
                    "error": f"Failed to parse Google Calendar response: {exc}",
                }
        return {
            "events": fallback,
            "source": "config",
            "ok": False,
            "error": result.get("stderr") or "Google Calendar fetch failed",
        }
    return {"events": fallback, "source": "config", "ok": True, "error": ""}


def repo_status(entry: dict) -> dict:
    path = Path(entry.get("path", "")).expanduser()
    if not path.exists():
        return {"name": entry.get("name") or path.name or "repo", "path": str(path), "ok": False, "detail": "Path not found"}

    branch = run(["git", "branch", "--show-current"], cwd=path)
    head = run(["git", "rev-parse", "--short", "HEAD"], cwd=path)
    changes = run(["git", "status", "--short"], cwd=path)
    lines = [line for line in changes.get("stdout", "").splitlines() if line.strip()]
    return {
        "name": entry.get("name") or path.name,
        "path": str(path),
        "ok": branch.get("ok") and head.get("ok"),
        "branch": branch.get("stdout") or "unknown",
        "head": head.get("stdout") or "n/a",
        "changes": len(lines),
        "detail": f"{len(lines)} change(s)" if lines else "Clean working tree",
        "rawChanges": lines[:10],
    }


def service_status(entry: dict) -> dict:
    command = entry.get("command", "").strip()
    if not command:
        return {"name": entry.get("name") or "service", "ok": False, "detail": "No command configured", "stdout": []}
    result = run(shlex.split(command), cwd=WORKSPACE, timeout=12)
    output = (result.get("stdout") or result.get("stderr") or "").splitlines()[:8]
    return {
        "name": entry.get("name") or command,
        "command": command,
        "ok": result.get("ok"),
        "detail": output[0] if output else ("OK" if result.get("ok") else "No output"),
        "stdout": output,
    }


def summarize_reminder(job: dict) -> dict:
    payload = job.get("payload") or {}
    schedule = job.get("schedule") or {}
    delivery = job.get("delivery") or {}
    name = job.get("name") or payload.get("message") or payload.get("text") or job.get("jobId") or "Unnamed reminder"
    if schedule.get("kind") == "at":
        when = schedule.get("at", "one-shot")
    elif schedule.get("kind") == "cron":
        when = f"cron: {schedule.get('expr', '')}"
    elif schedule.get("kind") == "every":
        when = f"every {schedule.get('everyMs', 0)} ms"
    else:
        when = schedule.get("kind", "unknown")
    return {
        "id": job.get("jobId") or job.get("id") or "",
        "name": name,
        "when": when,
        "enabled": job.get("enabled", True),
        "delivery": delivery.get("mode", "default"),
    }


def build_payload() -> dict:
    config = load_config()
    git_status = run(["git", "status", "--short"], cwd=WORKSPACE)
    git_branch = run(["git", "branch", "--show-current"], cwd=WORKSPACE)
    git_head = run(["git", "rev-parse", "--short", "HEAD"], cwd=WORKSPACE)
    openclaw_status = run(["openclaw", "status"], cwd=WORKSPACE)
    reminders = fetch_reminders()
    calendar_data = fetch_calendar(config)
    repos = [repo_status(entry) for entry in config.get("repos", [])]
    services = [service_status(entry) for entry in config.get("services", [])]
    calendar = calendar_data.get("events", [])

    dirty_lines = [line for line in git_status.get("stdout", "").splitlines() if line.strip()]
    tracked_changes = [line for line in dirty_lines if not line.startswith("?? ")]
    untracked = [line for line in dirty_lines if line.startswith("?? ")]
    healthy_services = sum(1 for service in services if service.get("ok"))

    stats = [
        {
            "label": "Git changes",
            "value": str(len(dirty_lines)),
            "trend": f"{len(tracked_changes)} tracked · {len(untracked)} untracked",
            "tone": "warn" if dirty_lines else "good",
        },
        {
            "label": "Reminders",
            "value": str(len(reminders.get("jobs", []))),
            "trend": "OpenClaw cron jobs detected" if reminders.get("ok") else (reminders.get("error") or "Unavailable"),
            "tone": "good" if reminders.get("ok") else "danger",
        },
        {
            "label": "Calendar",
            "value": str(len(calendar)),
            "trend": f"Source: {calendar_data.get('source', 'config')}",
            "tone": "good" if calendar_data.get("ok") else "warn",
        },
        {
            "label": "Services",
            "value": f"{healthy_services}/{len(services) or 0}",
            "trend": "Configured service checks",
            "tone": "good" if healthy_services == len(services) else "warn",
        },
    ]

    priorities = []
    if dirty_lines:
        priorities.append({"title": "Review workspace changes", "detail": f"{len(dirty_lines)} git changes detected in the workspace.", "tone": "warn"})
    if not reminders.get("jobs"):
        priorities.append({"title": "No reminders configured", "detail": "Mission control is ready to surface cron jobs as soon as you add them.", "tone": "neutral"})
    if calendar:
        priorities.append({"title": "Upcoming calendar item", "detail": f"{calendar[0].get('when', 'soon')} · {calendar[0].get('title', 'Event')}", "tone": "neutral"})
    if not calendar_data.get("ok"):
        priorities.append({"title": "Google Calendar fallback active", "detail": calendar_data.get("error") or "Using static calendar entries from config.", "tone": "warn"})
    bad_services = [service for service in services if not service.get("ok")]
    if bad_services:
        priorities.append({"title": "Service check needs attention", "detail": f"{len(bad_services)} configured service check(s) failed.", "tone": "danger"})
    if "Update available" in openclaw_status.get("stdout", ""):
        priorities.append({"title": "OpenClaw update available", "detail": "The local status output reports an available OpenClaw update.", "tone": "neutral"})

    now = datetime.now().astimezone()
    ops_log = [
        {"time": now.strftime("%I:%M %p"), "text": "Mission control snapshot generated."},
        {"time": "Git", "text": f"Workspace on {git_branch.get('stdout') or 'unknown'} @ {git_head.get('stdout') or 'n/a'}"},
        {"time": "Cron", "text": f"Loaded {len(reminders.get('jobs', []))} reminder job(s)."},
        {"time": "Calendar", "text": f"Loaded {len(calendar)} event(s) from {calendar_data.get('source', 'config')}."},
        {"time": "Services", "text": f"{healthy_services}/{len(services) or 0} configured checks passed."},
    ]

    return {
        "generatedAt": now.isoformat(),
        "host": {"hostname": platform.node(), "os": f"{platform.system()} {platform.release()}"},
        "stats": stats,
        "priorities": priorities[:8],
        "opsLog": ops_log[:8],
        "git": {
            "branch": git_branch.get("stdout") or "",
            "head": git_head.get("stdout") or "",
            "changes": dirty_lines,
        },
        "openclaw": {
            "ok": openclaw_status.get("ok"),
            "summary": (openclaw_status.get("stdout") or openclaw_status.get("stderr") or "").splitlines()[:24],
        },
        "workspace": workspace_overview(),
        "memory": recent_memory(),
        "reminders": [summarize_reminder(job) for job in reminders.get("jobs", [])[:10]],
        "calendar": calendar,
        "calendarSource": calendar_data.get("source", "config"),
        "calendarError": calendar_data.get("error", ""),
        "repos": repos,
        "services": services,
        "quickActions": [{"id": key, "label": value["label"]} for key, value in QUICK_ACTIONS.items()],
        "configPath": str(CONFIG_PATH),
    }


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, payload: dict, status: int = 200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/dashboard":
            self.send_json(build_payload())
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/action":
            self.send_json({"ok": False, "error": "Not found"}, status=HTTPStatus.NOT_FOUND)
            return
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length).decode("utf-8") if content_length else "{}"
        try:
            payload = json.loads(raw)
        except Exception:
            self.send_json({"ok": False, "error": "Invalid JSON"}, status=HTTPStatus.BAD_REQUEST)
            return
        action_id = payload.get("actionId")
        action = QUICK_ACTIONS.get(action_id)
        if not action:
            self.send_json({"ok": False, "error": "Unknown action"}, status=HTTPStatus.BAD_REQUEST)
            return
        result = run(action["command"], cwd=action.get("cwd", WORKSPACE), timeout=15)
        self.send_json({
            "ok": result.get("ok"),
            "label": action["label"],
            "command": action["command"],
            "stdout": (result.get("stdout") or "").splitlines()[:40],
            "stderr": (result.get("stderr") or "").splitlines()[:40],
            "code": result.get("code"),
        })

    def log_message(self, fmt: str, *args):
        sys.stderr.write("[mission-control] " + (fmt % args) + "\n")


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    os.chdir(ROOT)
    with ReusableTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Mission Control running at http://127.0.0.1:{PORT}")
        httpd.serve_forever()
