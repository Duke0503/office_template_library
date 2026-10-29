# D3: Categories are shared by both template kinds

- **Status:** accepted
- **Date:** 2026-10-29
- **Approved by:** project owner (Duc)

## Decision
One category list serves DOCX and PPTX templates. A gallery shows only the categories that have templates of its kind.

## Rationale
Categories such as Business or Education apply to both kinds. One list keeps the model and the import manifest simple.

## Consequences
Category is its own small aggregate in `catalog`. Links: `docs/domain-viz/contexts/catalog.md`.
