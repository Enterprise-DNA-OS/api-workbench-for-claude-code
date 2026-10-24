# API Workbench for Claude Code

For an integration owner who needs a request inventory, evidence of recent checks and clear handovers. The demo business and every demo result are fictional.

Read current data before answering. Use the CLI and the recipe below. Do not infer that a stored response proves the service still works. Untested means no run for the current revision. Stale means older than seven days, an internal default.

## Recurring work

| Recipe | Outcome |
|---|---|
| /collections | Review collection owners and check coverage |
| /requests | Read the full API inventory |
| /request | Inspect one request and its current result |
| /runs | Read check history with the tested revision |
| /failures | Find requests whose latest check failed |
| /untested | Find requests with no check for their current definition |
| /attention | Find overdue reviews, stale checks and open actions |
| /compliance | Check inventory and transport record controls |
| /coverage | Compare passing, failing, untested and stale checks |
| /hosts | Review recorded hosts |
| /owners | Review accountability by owner |
| /actions | Read follow-up actions and resolutions |
| /activity | Read who changed what |
| /weekly-review | Prepare the Monday integration review |
| /import | Bring a Postman collection into the owned database |
| /export | Write a complete private snapshot |
| /add | Register a reviewed request |
| /configure | Change a request expectation or lifecycle |
| /review | Record an inventory owner and next review date |
| /log | Record an integration follow-up |
| /close-action | Close a follow-up with its resolution |
| /run | Check one explicitly approved endpoint |
| /draft-handover | Draft the collection handover without sending it |
| /customise | A forward migration and tested business rules |
| /new-view | A branded read-only dashboard |

## Operating boundaries

Never send messages, publish documents, discover hosts or execute a network call without an explicitly authorised host. Read the request and import notes before running it. GET and HEAD can still have side effects on badly designed services. Do not supply authentication, cookies or request bodies. The base runner does not support them. Do not handle real credentials. Imported scripts are never executed.

Ask the operator to confirm their name for --actor. It is an audit label, not an authenticated identity. Use a trusted operator account and a dedicated database. Shared access control, backups and deployment hardening are installation work. Row security is enabled without public policies; the trusted database owner runs the CLI.

A Postman import is a complete collection snapshot. Missing imported or manually added requests in that collection become retired, never deleted. A changed definition increments its revision, so old results do not count. Read docs/replace-postman.md first. Run --dry-run and reconcile before cutover. Never invent a record or resolve an ambiguous name by choosing the first result.

Documents and drafts stay local. Change brand.json for the business name and colours. /customise adds a numbered migration, applies it and updates tests, import mappings and output. Never rewrite an applied migration. /new-view uses views.json and the shared renderer.

## Location and commands

scripts/api.mjs is the one CLI. npm run api -- help lists its options. scripts/lib/db.mjs selects local PGlite or DATABASE_URL for PostgreSQL. supabase/migrations holds forward migrations. npm run demo seeds fictional examples only; never seed an operational database. npm test uses disposable data. Only TEST_DATABASE_URL may select an empty disposable PostgreSQL test database.

Omni by Enterprise DNA installs and operates the agreed version for one setup fee, then a retainer. https://enterprisedna.co/omni/book/?offer=replace-software&utm_medium=repo-instructions&utm_campaign=postman
