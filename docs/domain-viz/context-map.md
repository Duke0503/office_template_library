# Context Map

```mermaid
flowchart LR
    catalog["Template Catalog<br/>Template · Category"]
    workspace["Document Workspace<br/>Document"]
    editor_integration["Editor Integration"]
    workspace -->|port: TemplateSource port| catalog
    workspace -->|port: EditorGateway port| editor_integration
    catalog -->|port: PreviewRenderer port| editor_integration
```

Legend: `PORT` synchronous call, `EVENT` asynchronous fact, `REFERENCE` identifier link, `EXTERNAL` outside system.
