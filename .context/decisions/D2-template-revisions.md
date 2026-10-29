# D2: A template update creates a new revision

- **Status:** accepted
- **Date:** 2026-10-29
- **Approved by:** project owner (Duc)

## Context
CAP-8 allows an operator to update a template. Documents already created from it must not change.

## Decision
Updating a template creates a new revision with a new stored file. No template file is ever overwritten. A document records the template id and revision it was created from.

## Rationale
It keeps the immutability rule absolute and gives every document a traceable origin.

## Consequences
The Template aggregate carries a revision number and the current file. Older files remain on disk. Links: `docs/domain-viz/contexts/catalog.md`.
