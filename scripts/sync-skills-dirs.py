#!/usr/bin/env python3
"""Create skill directories from skills.manifest.json."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "chrysanthos" / "skills" / "skills.manifest.json"
SKILLS_ROOT = ROOT / "chrysanthos" / "skills"


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    created = 0

    for category in data["categories"]:
        cat_dir = SKILLS_ROOT / category["name"]
        cat_dir.mkdir(parents=True, exist_ok=True)
        for child in category["children"]:
            child_dir = cat_dir / child
            child_dir.mkdir(parents=True, exist_ok=True)
            keep = child_dir / ".gitkeep"
            if not keep.exists():
                keep.touch()
                created += 1

    print(f"Skill directories synced ({created} new .gitkeep files)")


if __name__ == "__main__":
    main()
