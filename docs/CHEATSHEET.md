# Office Template Library - Domain Cheat-Sheet

_Model status: `target`._

## Bounded Contexts

- **Template Catalog** - The catalog holds every template and category. It serves the gallery, the preview and the template file that a document is copied from. (Template, Category)
- **Document Workspace** - The workspace holds the documents users create from templates. It copies the template file, keeps each saved version and serves downloads. (Document)
- **Editor Integration** - Editor integration translates between the app and ONLYOFFICE Document Server. It builds the signed editor configuration, turns save callbacks into workspace commands and renders previews. The adapter conforms to the Document Server editor, callback and conversion APIs. (none)

## Context Relations

| From | Kind | To | Via | Description |
|---|---|---|---|---|
| `workspace` | `PORT` | `catalog` | `TemplateSource port` | The workspace asks the catalog for a published template's metadata and file stream when a user uses a template. |
| `workspace` | `PORT` | `editor-integration` | `EditorGateway port` | The workspace asks for an editor configuration and receives save callbacks translated into its own commands. |
| `catalog` | `PORT` | `editor-integration` | `PreviewRenderer port` | The catalog asks for page or slide images when it imports a template revision. |

## Context: Template Catalog

The catalog holds every template and category. It serves the gallery, the preview and the template file that a document is copied from.

### Template

A template is a ready-made DOCX or PPTX file that users copy. It holds the metadata, the current file and the previews. Its file is never rewritten.

| Field | Type | Required | References | Constraints |
|---|---|---:|---|---|
| `id` | `TemplateId` | yes | `` |  |
| `kind` | `TemplateKind` | yes | `` |  |
| `slug` | `string` | yes | `` | unique per kind, lowercase, digits and dashes |
| `name` | `string` | yes | `` |  |
| `description` | `string` | yes | `` |  |
| `categoryId` | `CategoryId` | yes | `category` |  |
| `revision` | `integer` | yes | `` | starts at 1, increases by one on each update |
| `file` | `StoredFile` | yes | `` |  |
| `revisions` | `TemplateRevision[]` | yes | `` |  |
| `thumbnail` | `PreviewImage` | yes | `` |  |
| `previews` | `PreviewImage[]` | yes | `` |  |
| `status` | `TemplateStatus` | yes | `` |  |
| `createdAt` | `datetime` | yes | `` |  |
| `updatedAt` | `datetime` | yes | `` |  |

### Category

A category is a label that groups templates, such as Business or Education. One list serves both kinds (D3: categories are shared by both template kinds).

| Field | Type | Required | References | Constraints |
|---|---|---:|---|---|
| `id` | `CategoryId` | yes | `` |  |
| `slug` | `string` | yes | `` | unique |
| `name` | `string` | yes | `` |  |

## Context: Document Workspace

The workspace holds the documents users create from templates. It copies the template file, keeps each saved version and serves downloads.

### Document

A document is the user's own copy of a template. It holds its file, its origin and its current version. It never shares storage with a template.

| Field | Type | Required | References | Constraints |
|---|---|---:|---|---|
| `id` | `DocumentId` | yes | `` |  |
| `kind` | `TemplateKind` | yes | `` |  |
| `title` | `string` | yes | `` |  |
| `origin` | `TemplateOrigin` | yes | `` |  |
| `file` | `StoredFile` | yes | `` |  |
| `version` | `integer` | yes | `` | starts at 1 |
| `editorKey` | `EditorKey` | yes | `` |  |
| `createdAt` | `datetime` | yes | `` |  |
| `updatedAt` | `datetime` | yes | `` |  |

## Context: Editor Integration

Editor integration translates between the app and ONLYOFFICE Document Server. It builds the signed editor configuration, turns save callbacks into workspace commands and renders previews. The adapter conforms to the Document Server editor, callback and conversion APIs.
