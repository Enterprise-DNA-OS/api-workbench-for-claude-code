# Record controls and their sources

Checked 2026-10-24. This workbench checks evidence quality. It does not certify compliance, perform a penetration test, prove authorisation or check a live endpoint's security configuration.

| Rule | Check | Basis and limit |
|---|---|---|
| INV-OWNER | Collection owner missing | OWASP API9 inventory accountability. An operator label is not an authenticated identity. |
| INV-REVIEW | Review date absent or past | Local review control supporting OWASP API9. OWASP does not mandate our review interval. |
| INV-DEPRECATED | Deprecated request remains recorded | OWASP API9 lifecycle inventory. A record does not prove the endpoint remains deployed. |
| INV-TRANSPORT | HTTP or unresolved address | OWASP API8 identifies missing transport security as a risk. URL inspection alone does not inspect TLS or server configuration. |
| IMPORT-REVIEW | Omitted request behaviour | Local reconciliation control based on the Postman export format, not a legal rule. |

Sources: [OWASP API9:2023](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/), [OWASP API8:2023](https://owasp.org/API-Security/editions/2023/en/0xa8-security-misconfiguration/), [Postman exports](https://learning.postman.com/docs/getting-started/importing-and-exporting/exporting-data).

Run npm run api -- compliance. Record follow-ups with log. Seven-day check freshness is a local operational default. Review dates and thresholds are chosen by the business, not described as law. No personal employment decisions, payments or regulated certifications are produced.

Use a trusted database owner. Tables have row security enabled with public grants revoked. The base does not implement multi-user authentication, row-specific roles, immutable audit storage, encryption at rest, backup operations or a scheduler. Those are installation responsibilities. The actor field is only a claimed operator name. The append-only CLI history remains editable by the database owner.
