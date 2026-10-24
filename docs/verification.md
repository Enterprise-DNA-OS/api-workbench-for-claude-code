# Verification

Checked 2026-10-24.

- Linux, Node 22.23.1, PGlite: npm test PASS, 79 assertions covering every CLI command.
- Linux, Node 20, PGlite: npm test PASS, 79 assertions.
- Linux, Node 22.23.1, PostgreSQL 16.2: npm test PASS, 79 assertions against a new disposable local database.
- npm install reported zero vulnerabilities. npm run demo, npm run docs and npm run view passed. Four documents and two read-only dashboards were generated.
- The importer tests include a forced database failure after an earlier request write. The collection rename and earlier request change both roll back. Replays, omissions, ambiguous names, revision invalidation, host restrictions, redirect refusal and timeout are covered.
- The page passed check-page.mjs with four sourced monetary figures and zero brand lint errors. Its isolated Astro build passed. Headless Chromium found no page errors, all three paths, three demo-output displays and six attributed booking links. The built page has noindex,nofollow. There was no horizontal overflow at 390 or 320 pixels.
- Desktop, mobile and dashboard screenshots were captured and inspected. Prose scans found no author placeholders, em dashes or banned voice terms.

The [manual GitHub workflow](https://github.com/Enterprise-DNA-OS/api-workbench-for-claude-code/actions/runs/40056424860) was dispatched at 083cbc7. GitHub refused to start the jobs because recent account payments had failed or the spending limit needed attention. No test step ran there. Windows and the workflow's PostgreSQL 17 job remain unverified. The local PostgreSQL 16.2 test passed independently. The workflow stays manual.

No customer service, customer export or secret was used. The HTTP tests use a local fixture. The demo's stored response evidence is fictional and marked accordingly. The public page URL returned 404 during the post-push check; a pushed page and a passing local build are not proof of host deployment.
