# API Workbench for Claude Code

Own your request inventory, weekly service checks and integration handovers in one database. Bring a sanitised Postman collection, name its owner and see which checks need attention.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free under MIT. Install the demo below. | Your exports, review rules, approved authentication design and reporting. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=postman) · [Instead of Postman](https://enterprisedna.co/omni/instead-of/postman?utm_source=github&utm_medium=readme&utm_campaign=postman)

## Start with evidence

Node 20 or later:

```bash
git clone https://github.com/Enterprise-DNA-OS/api-workbench-for-claude-code.git
cd api-workbench-for-claude-code
npm install
npm run demo
npm run api -- attention
npm run docs
npm run view
```

Open the folder with Claude Code, Codex, OpenCode or Cursor. AGENTS.md routes to the same instructions as CLAUDE.md. PGlite runs locally. DATABASE_URL selects your PostgreSQL database; DATA_DIR selects a different local directory. Use a trusted operator and dedicated database. The demo has fictional results, a stale passing check, a failure, an untested request and an overdue action. Demo addresses never resolve to a real service.

## The weekly rituals

Review collection ownership, inspect failing requests, check stale evidence, assign follow-ups and prepare the handover. The CLI provides human output and --json. Exact names are case-insensitive. Partial names and ids work only when unique; ambiguous matches list candidates and exit 1.

| Job | Example |
|---|---|
| Monday review | npm run api -- weekly-review |
| Ownership and coverage | npm run api -- collections |
| Failed checks | npm run api -- failures |
| Record controls | npm run api -- compliance |
| Assign next review | npm run api -- review "Order integrations" --owner=Mere --due=2026-11-30 --actor=Mere |
| Record a follow-up | npm run api -- log "Order integrations" --title="Confirm recovery" --owner=Mere --due=2026-11-01 --actor=Mere |
| Full command list | npm run api -- help |

A request change creates a new revision. Old passing results remain evidence of the old definition and never count as a current pass. The seven-day freshness window is an internal default, not an industry mandate. Each write records an actor label; those labels are not signatures or sign-in controls.

## Bring your collection

```bash
npm run api -- import postman --file=fixtures/postman-collection.json --actor=Mere --dry-run
npm run api -- import postman --file=fixtures/postman-collection.json --actor=Mere
npm run api -- export --file=exports/workbench-2026-10-24.json
```

The importer supports Postman Collection v2.1 JSON. Names, nested folders, methods and addresses become reviewable records. Authentication, headers, bodies, variables, saved responses and scripts do not run or migrate as working behaviour. Query values become unresolved placeholders. Warnings block execution until a separately reviewed request is added. Export writes all six record groups to a new private file and refuses to overwrite it. It is an owned snapshot, not a Postman collection or an automatic restore tool.

[One-command import, field mapping and cutover checks](docs/replace-postman.md).

## Check an approved service

```bash
npm run api -- run "<reviewed request>" --allow-host="<exact host and port>" --actor=Mere
```

Only active GET and HEAD requests run. The exact host must be authorised by the operator. HTTPS is required except for explicit loopback test fixtures. No redirects, authentication, cookies, request bodies or imported code execute. A status mismatch or exceeded time budget records a failure and exits 1. Response content is discarded. Requests with import omissions are blocked. This is a bounded service-check workbench, not a complete replacement for Postman's protocol clients, mocks, load tests or scripting runtime. Enterprise DNA scopes those needs before migration.

## Ten questions this build answers

These are working questions, not unsupported claims that Postman cannot answer them.

1. Which collections have failed checks and no accountable owner? Use owners and coverage.
2. Which current request definitions have never been checked? Use untested.
3. Which passing results are too old for our weekly review? Use coverage and attention.
4. Which requests changed after their last check? Use request and runs.
5. Which hosts still have deprecated requests recorded? Use hosts and requests.
6. What follow-ups are overdue and who owns each one? Use actions and attention.
7. Which collection reviews have missed their due date? Use compliance.
8. What settings changed and which operator recorded them? Use activity.
9. What failed most recently for each active request? Use failures.
10. What check evidence and unresolved actions belong in this handover? Use draft-handover and documents.

## Documents and read-only views

npm run docs creates integration handover and review records for each collection. npm run view creates the week and inventory dashboards. Set business name, logo and colours in brand.json. Reports are local HTML for inspection and printing. /new-view adds a report through the shared renderer. /customise writes a forward migration and updates the affected recipes and tests. No interactive front end is included.

## Your first hour: ten things to ask for

1. Put our business name on the handover.
2. Inspect the headings and methods in our sanitised export.
3. Import a collection after its dry run matches.
4. Assign each collection an accountable owner.
5. Set our next review dates.
6. List requests without current check evidence.
7. Set the expected response and time limit on a reviewed request.
8. Log an action for a failed service check.
9. Draft the handover with unresolved actions included.
10. Add our service criticality field and include it in the weekly view.

## Record controls and verification

[Compliance controls and sources](docs/compliance.md) checks ownership, review dates, transport addresses and deprecated endpoints. It does not certify a service or inspect its security. [What a screen provides](docs/why-no-front-end.md) covers interactive request editing, mobile work and collaboration.

npm test exercises every CLI command against a disposable database, including bad imports, replay, revision changes, ambiguous matches, network gates, timeout, drafts, exports and HTML output. The manual workflow tests Windows and Linux on Node 20 and 22 plus PostgreSQL 17. A workflow definition alone is not proof it ran. [Verification evidence](docs/verification.md).

[Selection evidence, six scores and pricing sources](docs/research.md). Hosting and coding-agent usage have their own costs. MIT. Not affiliated with Postman or Anthropic.
