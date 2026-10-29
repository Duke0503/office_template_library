# Strategic Domain Map

**Primary domain:** `Office template library: users pick a DOCX or PPTX template, get their own copy and edit it in the browser.`

The brief scores template handling and copy isolation, so the catalog and the workspace are core. Editing office files is a solved problem, so the editor is bought (ONLYOFFICE) and kept behind an anti-corruption layer.

```mermaid
flowchart TB
    template_catalog["Template Catalog<br/>core"]
    template_catalog --> catalog
    document_workspace["Document Workspace<br/>core"]
    document_workspace --> workspace
    document_editing["Document Editing<br/>generic"]
    document_editing --> editor_integration
    catalog["Template Catalog<br/>core"]
    workspace["Document Workspace<br/>core"]
    editor_integration["Editor Integration<br/>generic"]
```

## Classification

| Subdomain | Type | Contexts | Description |
|---|---|---|---|
| `Template Catalog` | `core` | catalog | Templates, categories and previews that users browse, search and preview. |
| `Document Workspace` | `core` | workspace | Documents users create from templates, edit and download. Copy isolation lives here. |
| `Document Editing` | `generic` | editor-integration | In-browser editing of office files and preview rendering, supplied by ONLYOFFICE Document Server. |
