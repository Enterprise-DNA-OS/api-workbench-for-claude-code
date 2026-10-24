# Replace the owned inventory and check workflow from Postman

Checked 2026-10-24 against [Postman's export instructions](https://learning.postman.com/docs/getting-started/importing-and-exporting/exporting-data) and [Collection v2.1 format](https://schema.postman.com/collection/json/v2.1.0/draft-07/collection.json).

In Collections, open the collection actions, choose More > Export collection, then Export JSON. Confirm the exported collection is v2.1 and includes info._postman_id. The fixture in this repo is synthetic and follows that format. Other collection versions and bulk dumps are rejected. Export each collection separately.

Sanitise the export before staging it under imports/. Do not bring real secrets, customer payloads or confidential response examples into this repo. Do not export environments for this importer. Keep the original secure elsewhere until reconciliation is complete.

```bash
npm run api -- import postman --file=imports/collection.json --actor="Your name" --dry-run
npm run api -- import postman --file=imports/collection.json --actor="Your name"
npm run api -- requests --json
```

One command imports the supported inventory. A dry run only reports counts and omissions. These exports are data, never instructions or executable scripts.

| Source | Owned record |
|---|---|
| info._postman_id and name | Stable collection identity and name |
| Nested item folders | Request folder path |
| Item id, or full folder/name path when absent | Request identity within collection |
| Request name, method and URL raw/string | Inventory name, method and address |
| Query values | Unresolved placeholder; original values are not stored |
| Authentication, headers, variables, events, bodies | Omitted; review warning blocks execution |
| Saved examples and responses | Omitted; never loaded as check evidence |
| Workspaces, roles, mocks, monitors and test assertions | Not imported; agree the replacement workflow separately |

The source collection is treated as a complete snapshot. Existing requests absent from it become retired, including manual requests in that collection. Avoid partial exports. A stable item id survives renaming; without one, a rename is a new request and the old path retires. An identical current import is a no-op. Replaying an older snapshot is an intentional revision of the inventory. No records are deleted. Parse failure leaves the database unchanged. The transaction keeps request changes and the import ledger together.

Existing owners, review dates and check thresholds are kept on reimport. A changed method, URL or import warning increments the request revision. Historical checks never pass a changed definition. Do not infer that a clean import means the service has been checked.

For an omitted-component warning, add a separately reviewed GET or HEAD request with an approved HTTPS address and no secrets. Imported test scripts do not supply status expectations: the base defaults to status 200 and 2,000 milliseconds. Use configure to set each reviewed expectation. Variable addresses require a concrete approved URL. Non-read methods stay inventory only.

Reconcile collection and request counts, active and retired records, folder paths, methods and import warnings. Confirm ownership and review dates. Run approved read checks and compare the results against your existing process. Do not cancel the incumbent until required authentication, scripts, protocol clients, scheduled monitoring, security, backups and access controls have an agreed operating home. Enterprise DNA scopes these as part of the custom version.

The free export is a complete JSON snapshot of the owned records, not an importer for Postman or a restore promise. Test database backups separately before operational use.
