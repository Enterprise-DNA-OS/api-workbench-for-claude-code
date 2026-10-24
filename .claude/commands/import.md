---
description: Bring a Postman collection into the owned database
---

Read CLAUDE.md. Bring a Postman collection into the owned database.

```bash
npm run api -- import postman --file="<sanitised collection.json>" --actor="<operator>" --dry-run
```

Replace placeholders with confirmed values. Read before writing. Show the returned evidence, never infer success from an empty answer. --json gives structured output. Ambiguous names list candidates and stop.

Read docs/replace-postman.md. Use only a sanitised export. Explain every omission before removing --dry-run. The complete collection snapshot retires missing requests. Do not import environments or secrets.
