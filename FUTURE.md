# Future work

## GitHub repos and Highlights section

Highlights (`#highlights`) reads `data/pinned-repos.json`. After you pin or unpin on GitHub, refresh that file and commit it:

```bash
python3 scripts/fetch-pinned-repos.py
```

**Reminder:** Skills with a public repository set `repo` in `chrysanthos/skills/skills.manifest.json`. Skills with no public repository stay plain text: linux/hardening, systems/optimise, systems/interconnected, networking/bgp, networking/vpn, networking/firewalls, networking/acls, networking/oob, networking/sockets, and the leadership and AI entries.
