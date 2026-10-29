# Q&A: open questions and decision log

Open questions are grouped by who must answer. Decisions are newest first. `proposed` means not yet signed off by the project owner.
Decide in the meeting, then record the result in `.context/decisions/` and `docs/domain-model.json`. This file is generated only.

## Open questions (1)

### Project owner (1)

| Code | Question | Impact | Context | Who answers | Status |
|---|---|---|---|---|---|
| `OQ1` | Are renaming and deleting a document in scope? | Adds two commands and a terminal state to the Document lifecycle, and extends My documents. | [Document Workspace](contexts/workspace.md) | Project owner | `open` |

## Decisions (4)

### Accepted (4)

| Code | Date | Decision | Why | Context | Status |
|---|---|---|---|---|---|
| `D4` | 2026-10-29 | An archived template leaves the gallery and cannot be used for new documents. Documents created from it keep opening, saving and downloading. | Documents are independent copies. | [Template Catalog](contexts/catalog.md), [Document Workspace](contexts/workspace.md) | `accepted` |
| `D3` | 2026-10-29 | One category list serves both DOCX and PPTX templates. | Categories apply to both kinds, and one list keeps the manifest simple. | [Template Catalog](contexts/catalog.md) | `accepted` |
| `D2` | 2026-10-29 | Updating a template creates a new revision with a new stored file. No template file is overwritten, and a document records the template id and revision it came from. | Keeps template immutability absolute and every document traceable. | [Template Catalog](contexts/catalog.md), [Document Workspace](contexts/workspace.md) | `accepted` |
| `D1` | 2026-10-29 | The domain has three bounded contexts: Template Catalog (core), Document Workspace (core) and Editor Integration (generic, an anti-corruption layer over ONLYOFFICE). | Catalog and workspace carry the scored rules. The editor is bought. | [Template Catalog](contexts/catalog.md), [Document Workspace](contexts/workspace.md), [Editor Integration](contexts/editor-integration.md) | `accepted` |

