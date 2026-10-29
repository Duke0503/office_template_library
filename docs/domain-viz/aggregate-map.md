# Aggregate Map

Cross-context overview of every aggregate and how they call each other. For one
aggregate's fields, invariants, identity, and lifecycle, open its context page in
`contexts/`.

```mermaid
flowchart TB
    subgraph context_catalog["Template Catalog"]
        template["Template"]
        category["Category"]
    end
    subgraph context_workspace["Document Workspace"]
        document["Document"]
    end
    subgraph context_editor_integration["Editor Integration"]
    end
    document -->|TemplateSource port| template
```
