---
description: Check one explicitly approved endpoint
---

Read CLAUDE.md. Check one explicitly approved endpoint.

```bash
npm run api -- run "<request>" --allow-host="<exact host and port>" --actor="<operator>"
```

Replace placeholders with confirmed values. Read before writing. Show the returned evidence, never infer success from an empty answer. --json gives structured output. Ambiguous names list candidates and stop.

Read the request first. Only run against a host the operator has explicitly authorised this session. GET is not a guarantee of no server side effects. Never run demo addresses, perform discovery, follow redirects or add credentials. A failed check exits 1. --local-test is only for an explicitly approved loopback fixture.
