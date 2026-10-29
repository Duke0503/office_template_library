# D4: An archived template leaves the gallery but its documents keep working

- **Status:** accepted
- **Date:** 2026-10-29
- **Approved by:** project owner (Duc)

## Decision
An archived template disappears from the gallery and cannot be used to create new documents. Documents created from it still open, save and download.

## Rationale
Documents are independent copies (SPEC CAP-4), so retiring a template must never break them.

## Consequences
The Template lifecycle is `published` to `archived` and back. Workspace never needs the template after creation. Links: `docs/domain-viz/contexts/catalog.md`.
