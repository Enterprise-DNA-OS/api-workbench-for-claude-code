---
description: Register a reviewed request
---

Read CLAUDE.md. Register a reviewed request.

```bash
npm run api -- add --collection="<collection>" --name="<request>" --method=GET --url="https://<approved-host>/<path>" --actor="<operator>"
```

Replace placeholders with confirmed values. Read before writing. Show the returned evidence, never infer success from an empty answer. --json gives structured output. Ambiguous names list candidates and stop.
