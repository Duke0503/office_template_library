# Domain session 2026-10-29: initial model

- **Participants:** Mary (analyst), Winston (architect), facilitator, project owner (Duc)
- **Sources:** `_bmad-output/specs/spec-office-template-library/SPEC.md`, `docs/reference/brief.md`
- **Topic:** build the target domain from the spec

## Positions
- Mary: the product sells a catalog you browse, a document you own and an editor you rent. Catalog and Workspace are core because the brief scores template handling and copy isolation. The editor is generic. "Update a template" needs a revision concept.
- Winston: three contexts. Template and Category aggregates in `catalog`, Document aggregate in `workspace`, an anti-corruption layer over ONLYOFFICE in `editor-integration`. Every saved version gets a new editor key.

## Approved decisions
- D1 (three bounded contexts: catalog, workspace, editor-integration)
- D2 (a template update creates a new revision; nothing is overwritten)
- D3 (categories are shared by DOCX and PPTX)
- D4 (an archived template leaves the gallery; its documents keep working)

## Open questions
- OQ1 (are renaming and deleting a document in scope?)

## Model changes
Created `docs/domain-model.json` v0.1.0 with the three contexts, aggregates, lifecycles, building blocks, events and relations above.
