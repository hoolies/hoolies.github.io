#!/usr/bin/env python3
"""Generate skills tree HTML from chrysanthos/skills/skills.manifest.json."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "chrysanthos" / "skills" / "skills.manifest.json"
SKILLS_ROOT = ROOT / "chrysanthos" / "skills"
INDEX_HTML = ROOT / "index.html"
MARKER_START = "<!-- SKILLS-TREE:START -->"
MARKER_END = "<!-- SKILLS-TREE:END -->"


def branch_glyph(is_last: bool) -> str:
    return "└── " if is_last else "├── "


def line_to_html(prefix: str, name: str, *, gap: bool = False) -> str:
    if gap:
        return (
            '              <div class="tree-line tree-gap" aria-hidden="true">'
            '<span class="tree-branch">│</span></div>'
        )

    return (
        f'              <div class="tree-line">'
        f'<span class="tree-branch">{prefix}</span>'
        f'<span class="tree-dir">{name}</span></div>'
    )


def child_prefix(parent_is_last: bool, child_is_last: bool) -> str:
    stem = "    " if parent_is_last else "│   "
    return stem + branch_glyph(child_is_last)


def build_html(categories: list[dict]) -> str:
    rows: list[str] = []
    cat_count = len(categories)

    for cat_index, category in enumerate(categories):
        if cat_index > 0:
            rows.append(line_to_html("", "", gap=True))

        cat_is_last = cat_index == cat_count - 1
        rows.append(line_to_html(branch_glyph(cat_is_last), category["name"]))

        children = category["children"]
        for child_index, child in enumerate(children):
            child_is_last = child_index == len(children) - 1
            rows.append(line_to_html(child_prefix(cat_is_last, child_is_last), child))

    return "\n".join(rows)


def verify_directories(categories: list[dict]) -> None:
    missing: list[str] = []
    for category in categories:
        cat_dir = SKILLS_ROOT / category["name"]
        if not cat_dir.is_dir():
            missing.append(str(cat_dir))
        for child in category["children"]:
            child_dir = cat_dir / child
            if not child_dir.is_dir():
                missing.append(str(child_dir))

    if missing:
        print("Missing skill directories (run scripts/sync-skills-dirs.py):", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        sys.exit(1)


def patch_index(html_fragment: str) -> None:
    content = INDEX_HTML.read_text(encoding="utf-8")
    if MARKER_START not in content or MARKER_END not in content:
        print(f"Markers not found in {INDEX_HTML}", file=sys.stderr)
        sys.exit(1)

    pattern = re.compile(
        re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END),
        re.DOTALL,
    )
    replacement = f"{MARKER_START}\n{html_fragment}\n            {MARKER_END}"
    updated, count = pattern.subn(replacement, content, count=1)

    if count != 1:
        print("Failed to update skills tree block", file=sys.stderr)
        sys.exit(1)

    INDEX_HTML.write_text(updated, encoding="utf-8")


def main() -> None:
    if not MANIFEST.is_file():
        print(f"Missing manifest: {MANIFEST}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    categories = data["categories"]
    verify_directories(categories)
    html = build_html(categories)
    patch_index(html)
    print(f"Updated skills tree ({len(categories)} categories)")


if __name__ == "__main__":
    main()
