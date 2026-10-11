# Future work

## GitHub repos and Highlights section

Highlights (`#highlights`) reads `data/pinned-repos.json`. After you pin or unpin on GitHub, refresh that file and commit it:

```bash
python3 scripts/fetch-pinned-repos.py
```

**Reminder:** Restructure GitHub repositories to align with the skills tree (`chrysanthos/skills/`). Optional later: add a `repo` field per skill in `chrysanthos/skills/skills.manifest.json`.
