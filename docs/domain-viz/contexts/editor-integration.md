# Editor Integration

`editor-integration`

## Purpose & classification

> Edit DOCX and PPTX in the browser and render page or slide images, without ONLYOFFICE terms reaching the core contexts.

**Subdomain type:** generic · **Status:** target · agreed goal · **Strategic importance:** medium

**Context map patterns:** anti-corruption layer, conformist

Editor integration translates between the app and ONLYOFFICE Document Server. It builds the signed editor configuration, turns save callbacks into workspace commands and renders previews. The adapter conforms to the Document Server editor, callback and conversion APIs.

**Subdomain:** Document Editing (generic)

In-browser editing of office files and preview rendering, supplied by ONLYOFFICE Document Server.

## Ubiquitous language

_No words declared for this domain. A word can mean something else in the next domain without anyone noticing._

## Aggregates

_No aggregate owns its own rules in this domain._

## Identity & building blocks

**Anti-corruption layer** (1)

| Building block | Purpose | Detail | Scope |
|---|---|---|---|
| `OnlyofficeAdapter` | Implements EditorGateway and PreviewRenderer over ONLYOFFICE Document Server. | Sign editor configurations with JWT.; Verify and translate save callbacks.; Call the conversion API for previews. | integration |


**Not modelled yet:** `entity`, `value-object`, `domain-service`, `repository`, `specification`, `policy`, `read-model`. This is not always a gap: a supporting domain often keeps its rules inside the aggregate root.

## Lifecycle

_Nothing here changes state in a way that changes what is allowed._

## Commands & use cases

_No command or use case recorded that asks this domain to do something._

## Events

_This domain emits no events. Nothing elsewhere can react to what happens here._

## Rules & policies

**authorization** (1)

| Rule | Declared on | Status |
|---|---|---|
| Every editor configuration and every callback carries a JWT signed with the shared secret. | Editor Integration | target · agreed goal |


**workflow** (1)

| Rule | Declared on | Status |
|---|---|---|
| Callback status 2 becomes save_edited_version. Status 4 becomes close_without_changes. Other statuses are logged and ignored. | Editor Integration | target · agreed goal |

## Integration & hotspots

| Direction | Context | Kind | Via | Pattern | Status |
|---|---|---|---|---|---|
| used by | Document Workspace | port | EditorGateway port | anti-corruption layer | target · agreed goal |
| used by | Template Catalog | port | PreviewRenderer port | anti-corruption layer | target · agreed goal |


**Related decisions** (1)

| Decision | Why | Status |
|---|---|---|
| The domain has three bounded contexts: Template Catalog (core), Document Workspace (core) and Editor Integration (generic, an anti-corruption layer over ONLYOFFICE). | Catalog and workspace carry the scored rules. The editor is bought. | accepted · approved |
