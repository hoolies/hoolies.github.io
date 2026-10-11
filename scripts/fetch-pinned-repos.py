#!/usr/bin/env python3
"""Refresh data/pinned-repos.json for the Highlights section."""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "pinned-repos.json"
USER = "hoolies"
URL = f"https://pinned.berrysauce.dev/get/{USER}"


def main() -> None:
    request = urllib.request.Request(
        URL,
        headers={
            "Accept": "application/json",
            "User-Agent": "portfolio-fetch-pinned-repos",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        payload = json.load(response)

    if not isinstance(payload, list) or not payload:
        print("Pinned repo response was empty", file=sys.stderr)
        sys.exit(1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(payload)} repos to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
