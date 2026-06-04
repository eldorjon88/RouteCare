#!/usr/bin/env python3
"""
split_project.py
================
Split the merged RouteCare project (one FastAPI backend + multiple frontends)
into three standalone projects:

    <output>/backend          FastAPI REST + WebSocket API (+ admin dashboard)
    <output>/mobile_app_1     Patient app  (static web: HTML/CSS/JS)
    <output>/mobile_app_2     Driver app   (static web: HTML/CSS/JS)

Key properties (per request)
----------------------------
* Standard library only: os, shutil, pathlib (+ argparse).
* Works on COPIES — the original project is never modified or deleted.
* Deterministic: an explicit COPY_RULES table says exactly what goes where
  (no fragile guessing). Reusable: edit COPY_RULES for any project.
* One source can be copied to MANY destinations (shared frontend code).
* `--dry-run` prints the plan and any unassigned files without copying.
* Prints a summary report when complete.

Usage
-----
    python split_project.py --source . --output ./split_output --dry-run
    python split_project.py --source . --output ./split_output
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

# =========================================================================== #
# CONFIG
# =========================================================================== #
# Each rule maps a source path (relative to --source) to one or more
# destinations "<bucket>/<sub/path>". Edit this table to retarget any project.
COPY_RULES: list[tuple[str, list[str]]] = [
    # ---- Backend (FastAPI) ----
    ("app",                ["backend/app"]),
    ("scripts",            ["backend/scripts"]),
    ("database",           ["backend/database"]),
    ("migrations",         ["backend/migrations"]),
    ("docs",               ["backend/docs"]),
    ("public",             ["backend/public"]),
    ("requirements.txt",   ["backend/requirements.txt"]),
    ("alembic.ini",        ["backend/alembic.ini"]),
    (".env.example",       ["backend/.env.example"]),
    ("Dockerfile",         ["backend/Dockerfile"]),
    ("docker-compose.yml", ["backend/docker-compose.yml"]),
    (".dockerignore",      ["backend/.dockerignore"]),
    # Admin dashboard is a web panel (not a mobile app) -> ships with the backend.
    ("frontend/dispatch-dashboard", ["backend/admin/dispatch-dashboard"]),

    # ---- Mobile App 1: Patient ----
    ("frontend/patient-app", ["mobile_app_1/patient-app"]),

    # ---- Mobile App 2: Driver ----
    ("frontend/driver-app", ["mobile_app_2/driver-app"]),

    # ---- Shared frontend code: used by every app, so copied into each ----
    ("frontend/shared", [
        "mobile_app_1/shared",
        "mobile_app_2/shared",
        "backend/admin/shared",
    ]),
]

# Never copied (VCS, deps, build output, envs, this script's own output).
SKIP_ALWAYS = {
    ".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build",
    ".idea", ".vscode", ".expo", "split_output", ".DS_Store", ".pytest_cache",
}
_IGNORE = shutil.ignore_patterns(*SKIP_ALWAYS)

# Mobile apps get a static dev-server on these ports (used in package.json).
MOBILE_PORTS = {"mobile_app_1": 8081, "mobile_app_2": 8082}


# =========================================================================== #
# 1. ANALYSIS
# =========================================================================== #
def buckets_from_rules() -> list[str]:
    """Distinct top-level output buckets referenced by COPY_RULES."""
    return sorted({dest.split("/", 1)[0] for _, dests in COPY_RULES for dest in dests})


def analyze(source: Path) -> tuple[list[str], list[str]]:
    """Return (missing_sources, unassigned_top_level) for reporting."""
    rule_sources = [src for src, _ in COPY_RULES]
    missing = [s for s in rule_sources if not (source / s).exists()]

    # A top-level entry is "assigned" if any rule source is it or lives under it.
    referenced_tops = {Path(s).parts[0] for s in rule_sources}
    unassigned = [
        e.name for e in sorted(source.iterdir(), key=lambda p: p.name.lower())
        if e.name not in SKIP_ALWAYS and e.name not in referenced_tops
    ]
    return missing, unassigned


# =========================================================================== #
# 2. COPYING (copies only — the source is never touched)
# =========================================================================== #
def copy_rule(source: Path, output: Path, rel_src: str, dests: list[str]) -> int:
    """Copy one source to each destination. Returns the number of copies made."""
    src = source / rel_src
    if not src.exists():
        return 0
    for dest in dests:
        target = output / dest
        if src.is_dir():
            shutil.copytree(src, target, dirs_exist_ok=True, ignore=_IGNORE)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, target)
    return len(dests)


# =========================================================================== #
# 3. SCAFFOLDING (README, .env.example, requirements.txt / package.json)
# =========================================================================== #
def _write_if_absent(path: Path, content: str, generated: list[str]) -> None:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        generated.append(str(path))


def scaffold_backend(project: Path) -> list[str]:
    generated: list[str] = []
    _write_if_absent(project / "README.md", (
        "# RouteCare Backend\n\n"
        "FastAPI server exposing the **REST + WebSocket API** consumed by\n"
        "`mobile_app_1` (patient) and `mobile_app_2` (driver). The admin\n"
        "dashboard lives in `admin/`.\n\n"
        "## Run\n```bash\npython -m venv .venv && source .venv/Scripts/activate\n"
        "pip install -r requirements.txt\ncp .env.example .env\n"
        "uvicorn app.main:app --reload --port 8000\n```\n\n"
        "## CORS\nAllow the two app origins via `CORS_ORIGIN` in `.env` so both\n"
        "mobile apps can call this API. Docs: `/docs`. Health: `/health`.\n"
    ), generated)
    # .env.example and requirements.txt are copied from the source; only
    # generate fallbacks if they are somehow missing.
    _write_if_absent(project / ".env.example",
                     "PORT=8000\nDATABASE_URL=\nJWT_SECRET=change-me\nCORS_ORIGIN=*\n", generated)
    _write_if_absent(project / "requirements.txt",
                     "fastapi\nuvicorn[standard]\npython-dotenv\n", generated)
    return generated


def scaffold_mobile(project: Path, name: str) -> list[str]:
    generated: list[str] = []
    port = MOBILE_PORTS.get(name, 8080)
    app_label = "Patient" if name.endswith("1") else "Driver"

    _write_if_absent(project / "README.md", (
        f"# RouteCare {app_label} App ({name})\n\n"
        "Static web app (vanilla HTML/CSS/JS) that consumes the backend\n"
        "REST + WebSocket API. Shared UI/code is in `shared/`.\n\n"
        "## Run (any static server)\n```bash\n"
        f"npm start            # serves on http://localhost:{port}\n"
        f"# or: python -m http.server {port}\n```\n\n"
        "## Configure\nSet the backend URL in `shared/js/config.js`\n"
        "(`API_BASE_URL`). See `.env.example` for the expected value.\n"
    ), generated)

    _write_if_absent(project / ".env.example", (
        "# Static app: this value is read from shared/js/config.js at runtime.\n"
        "API_BASE_URL=http://localhost:8000\n"
    ), generated)

    # JS frontend -> package.json (provides a zero-dependency static dev server).
    _write_if_absent(project / "package.json", (
        "{\n"
        f'  "name": "{name}",\n'
        '  "version": "0.1.0",\n'
        '  "private": true,\n'
        '  "scripts": {\n'
        f'    "start": "npx --yes serve . -l {port}"\n'
        "  }\n"
        "}\n"
    ), generated)
    return generated


# =========================================================================== #
# 4. REPORTING
# =========================================================================== #
def print_plan(source: Path) -> None:
    print("\n=== Copy plan ===")
    for rel_src, dests in COPY_RULES:
        mark = " " if (source / rel_src).exists() else "MISSING"
        print(f"  [{mark or 'ok'}] {rel_src:<28} -> {', '.join(dests)}")

    missing, unassigned = analyze(source)
    if missing:
        print("\n[!] Rule sources not found (skipped):", ", ".join(missing))
    if unassigned:
        print("\n[i] Not assigned to any project (left in the original only):")
        print("    " + ", ".join(unassigned))


def print_summary(output: Path, counts: dict[str, int], generated: list[str]) -> None:
    print("\n" + "=" * 64)
    print("SPLIT COMPLETE")
    print("=" * 64)
    for bucket in buckets_from_rules():
        target = output / bucket
        n = sum(1 for _ in target.rglob("*")) if target.exists() else 0
        print(f"  {bucket:<13}: {n:>4} files  -> {target}")
    print(f"\n  Copy operations performed: {sum(counts.values())}")
    print(f"  Scaffold files generated : {len(generated)}")
    for g in generated:
        print(f"    + {Path(g).relative_to(output)}")
    print(f"\n  Output root: {output}")
    print("  Original project left untouched (copies only).")
    print("=" * 64)


# =========================================================================== #
# 5. ENTRY POINT
# =========================================================================== #
def main() -> None:
    parser = argparse.ArgumentParser(description="Split RouteCare into backend + 2 mobile apps.")
    parser.add_argument("--source", default=".", help="Merged project path (default: .)")
    parser.add_argument("--output", default="./split_output", help="Where to write the 3 projects")
    parser.add_argument("--dry-run", action="store_true", help="Show the plan; copy nothing")
    args = parser.parse_args()

    source = Path(args.source).resolve()
    output = Path(args.output).resolve()
    if not source.is_dir():
        raise SystemExit(f"Source not found: {source}")

    print(f"Analyzing source: {source}")
    print_plan(source)

    if args.dry_run:
        print("\nDry run — nothing copied. Re-run without --dry-run to perform the split.")
        return

    print(f"\nCopying into: {output}")
    counts = {rel: copy_rule(source, output, rel, dests) for rel, dests in COPY_RULES}

    generated: list[str] = []
    generated += scaffold_backend(output / "backend")
    generated += scaffold_mobile(output / "mobile_app_1", "mobile_app_1")
    generated += scaffold_mobile(output / "mobile_app_2", "mobile_app_2")

    print_summary(output, counts, generated)


if __name__ == "__main__":
    main()
