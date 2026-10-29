# D1: Three bounded contexts

- **Status:** accepted
- **Date:** 2026-10-29
- **Approved by:** project owner (Duc)

## Context
The spec requires one template engine for DOCX and PPTX (SPEC constraint) and an integrated editor (ONLYOFFICE).

## Decision
The domain has three bounded contexts: Template Catalog (`catalog`, core), Document Workspace (`workspace`, core) and Editor Integration (`editor-integration`, generic, an anti-corruption layer over ONLYOFFICE).

## Rationale
Catalog and Workspace carry the scored rules: template handling and copy isolation. The editor is bought, so its protocol stays behind an anti-corruption layer.

## Consequences
Workspace reads templates only through the catalog's interface. No ONLYOFFICE term leaks into catalog or workspace code. Links: `docs/domain-model.json`, `docs/domain-viz/context-map.md`.
