# Domain Rule Catalog

One row per rule, across every context. This is an index, not the detail — follow
the context link for the rule's neighbours (invariants, policies, who it binds).

| Context | Aggregate | Rule | Kind | Description | Status |
|---|---|---|---|---|---|
| [Template Catalog](contexts/catalog.md#rules-policies) |  | `gallery-shows-published-only` | `specification` | The gallery lists only published templates of the requested kind. | `target` |
| [Template Catalog](contexts/catalog.md#rules-policies) |  | `accepted-file-types` | `invariant` | The catalog accepts only DOCX and PPTX files and checks the content, not only the extension. | `target` |
| [Document Workspace](contexts/workspace.md#rules-policies) |  | `copy-on-create` | `invariant` | Creating a document copies the template file to new storage. The template file is never opened for writing. | `target` |
| [Document Workspace](contexts/workspace.md#rules-policies) |  | `only-published-templates-are-used` | `policy` | A document can be created only from a published template (D4: an archived template leaves the gallery but its documents keep working). | `target` |
| [Document Workspace](contexts/workspace.md#rules-policies) |  | `callback-authenticity` | `authorization` | The workspace accepts a saved version only from a signed editor callback. | `target` |
| [Editor Integration](contexts/editor-integration.md#rules-policies) |  | `signed-editor-traffic` | `authorization` | Every editor configuration and every callback carries a JWT signed with the shared secret. | `target` |
| [Editor Integration](contexts/editor-integration.md#rules-policies) |  | `callback-status-mapping` | `workflow` | Callback status 2 becomes save_edited_version. Status 4 becomes close_without_changes. Other statuses are logged and ignored. | `target` |
