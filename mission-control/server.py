#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import platform
import shutil
import socketserver
import subprocess
import sys
from datetime import datetime
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent
PORT = int(os.environ.get("MISSION_CONTROL_PORT", "4173"))


def run(cmd: list[str], cwd: Path | None = None) -> dict:
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(cwd) if cwd else None,
            capture_output=True,
            text=True,
            timeout=10,
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


def recent_memory() -> list[dict]:
    memory_dir = WORKSPACE / "memory"
    if not memory_dir.exists():
        return []
    items = []
    for path in sorted(memory_dir.glob("*.md"), reverse=True)[:5]:
        text = safe_read(path) or ""
        lines = [line.strip("- ").strip() for line in text.splitlines() if line.strip().startswith("-")]
        items.append({
            "file": path.name,
            "highlights": lines[:4],
        })
    return items


def workspace_overview() -> dict:
    total, used, free = shutil.disk_usage(WORKSPACE)
    top_files = []
    for path in sorted(WORKSPACE.iterdir()):
        if path.name == ".git":
            continue
        top_files.append({
            "name": path.name,
            "type": "dir" if path.is_dir() else "file",
        })
    return {
        "path": str(WORKSPACE),
        "disk": {
            "totalGb": round(total / (1024**3), 1),
            "usedGb": round(used / (1024**3), 1),
            "freeGb": round(free / (1024**3), 1),
        },
        "topLevel": top_files[:20],
    }


def build_payload() -> dict:
    git_status = run(["git", "status", "--short"], cwd=WORKSPACE)
    git_branch = run(["git", "branch", "--show-current"], cwd=WORKSPACE)
    git_head = run(["git", "rev-parse", "--short", "HEAD"], cwd=WORKSPACE)
    openclaw_status = run(["openclaw", "status"], cwd=WORKSPACE)

    dirty_lines = [line for line in git_status.get("stdout", "").splitlines() if line.strip()]
    tracked_changes = [line for line in dirty_lines if not line.startswith("?? ")]
    untracked = [line for line in dirty_lines if line.startswith("?? ")]

    stats = [
        {
            "label": "Git changes",
            "value": str(len(dirty_lines)),
            "trend": f"{len(tracked_changes)} tracked · {len(untracked)} untracked",
            "tone": "warn" if dirty_lines else "good",
        },
        {
            "label": "Branch",
            "value": git_branch.get("stdout") or "unknown",
            "trend": f"HEAD {git_head.get('stdout') or 'n/a'}",
            "tone": "neutral",
        },
        {
            "label": "OpenClaw",
            "value": "OK" if openclaw_status.get("ok") else "Issue",
            "trend": "Status command reachable" if openclaw_status.get("ok") else (openclaw_status.get("stderr") or "Unavailable"),
            "tone": "good" if openclaw_status.get("ok") else "danger",
        },
        {
            "label": "Python",
            "value": platform.python_version(),
            "trend": platform.platform(),
            "tone": "neutral",
        },
    ]

    priorities = []
    if dirty_lines:
        priorities.append({
            "title": "Review workspace changes",
            "detail": f"{len(dirty_lines)} git changes detected in the workspace.",
            "tone": "warn",
        })
    if "Update available" in openclaw_status.get("stdout", ""):
        priorities.append({
            "title": "OpenClaw update available",
            "detail": "The local status output reports an available OpenClaw update.",
            "tone": "neutral",
        })
    priorities.extend([
        {
            "title": "Wire your real modules",
            "detail": "Next logical additions: reminders, calendar, inbox, and service checks.",
            "tone": "neutral",
        },
        {
            "title": "Decide what belongs on the home screen",
            "detail": "The dashboard is now live-data capable, so we can tailor it around how you actually work.",
            "tone": "neutral",
        },
    ])

    ops_log = []
    now = datetime.now().astimezone()
    ops_log.append({"time": now.strftime("%I:%M %p"), "text": "Mission control snapshot generated."})
    if git_head.get("stdout"):
        ops_log.append({"time": "Git", "text": f"Workspace on {git_branch.get('stdout') or 'unknown'} @ {git_head.get('stdout')}"})
    if dirty_lines:
        ops_log.append({"time": "Git", "text": f"Detected {len(dirty_lines)} uncommitted changes."})
    if openclaw_status.get("ok"):
        ops_log.append({"time": "OpenClaw", "text": "Status command completed successfully."})
    else:
        ops_log.append({"time": "OpenClaw", "text": openclaw_status.get("stderr") or "Status unavailable."})

    return {
        "generatedAt": now.isoformat(),
        "host": {
            "hostname": platform.node(),
            "os": f"{platform.system()} {platform.release()}",
        },
        "stats": stats,
        "priorities": priorities[:6],
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
    }


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/dashboard":
            payload = build_payload()
            body = json.dumps(payload).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def log_message(self, fmt: str, *args):
        sys.stderr.write("[mission-control] " + (fmt % args) + "\n")


if __name__ == "__main__":
    os.chdir(ROOT)
    with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Mission Control running at http://127.0.0.1:{PORT}")
        httpd.serve_forever()
