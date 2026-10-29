# Glossary: project business language and the DDD terms used in the model, the shared page and the Mary/Winston discussions

> Single source for names. The renderer (`scripts/render_domain_model.py`) parses the
> "Business language" table below and holds the DDD terms in `GLOSSARY`. Everything an agent
> says follows these tables. Use DDD terms as written here; do not invent synonyms.

## Business language (the ubiquitous language of the project)

> Words every page and every agent sentence uses with exactly one meaning. Write the way the
> team talks: short sentences, a subject, what happens. This table is the single source; the
> renderer reads it directly. Add a row whenever a new business word appears in a session.

| Term | Meaning |
|---|---|
| **Template** | A ready-made DOCX or PPTX file with a name, category, description and previews. Users copy it; nobody edits it |
| **Template kind** | The office format a template or document belongs to: `docx` (document) or `pptx` (presentation). New kinds can be added later |
| **Template set** | A PPTX template: one presentation file holding several designed slides |
| **Template revision** | One version of a template's file. An update adds a revision and never overwrites the old file (D2) |
| **Category** | A label that groups templates, such as Business or Education. Shared by both kinds (D3) |
| **Gallery** | The grid of published templates of one kind, with search and category filter |
| **Thumbnail** | The small cover image of a template shown on its gallery card |
| **Preview** | Images of a template's pages or slides, shown before the user picks it |
| **Use template** | The user's act of creating a new document from a template |
| **Document** | The user's own copy created from a template. Only documents are edited |
| **Copy-on-create** | Creating a document copies the template file to new storage. The template file is never opened for writing |
| **Editor session** | One period in which a document is open in the integrated editor |
| **Editor key** | The identifier the editor uses to cache one version of a document. It changes after every saved version |
| **Save callback** | The editor's message to the app that an edited version is ready to be stored |
| **My documents** | The list of documents the user created earlier |
| **Template manifest** | The file listing each template's metadata and file, read by the import command (CAP-8) |

## Strategic design

| Term | Short meaning | Usage note |
|---|---|---|
| **Domain** | The business area the system serves | "the Template Library domain" |
| **Subdomain** | A part of the domain, ranked by how much to invest | core / supporting / generic |
| **Core** | What makes the product different; invest deeply | keep the word "core" |
| **Supporting** | Needed, but every competitor needs it too; build just enough | keep the word "supporting" |
| **Generic** | Plumbing with no business edge; buy or keep thin | keep the word "generic" |
| **Bounded Context** | The boundary of one model and its language; the same word may mean something else in the next context | short form "context"; here a context is usually a service or package |
| **Ubiquitous Language** | The vocabulary shared by the business and the code inside one context | the "Ubiquitous language" section on the page |
| **Context Map** | The map of which context calls, listens to or references which | |
| **Open-host service** | A context opens a stable API for many callers | relationship pattern |
| **Published language** | A context publishes events or contracts others listen to | relationship pattern |
| **Customer–supplier** | Two sides negotiate the contract; the consumer is the customer | relationship pattern |
| **Conformist** | The consumer accepts the supplier's language and does not translate | relationship pattern |
| **Anti-corruption layer (ACL)** | A layer that translates an outside language into our own | also a building block |
| **Shared kernel** | A small part of the model that two sides own and change together | e.g. the `TemplateKind` value shared by catalog and workspace |
| **Partnership / Upstream–downstream / Separate ways** | Evolve together / one side leads / go separate ways | relationship pattern |

## Tactical design (building blocks)

| Term | Short meaning | Usage note |
|---|---|---|
| **Building block** | A named DDD piece in the model (aggregate, entity, value object, service…) | |
| **Aggregate** | A group of data that must be correct together; every change goes through one door | "the Document aggregate" |
| **Aggregate root** | The record at the head of an aggregate and its only entry point | |
| **Entity** | Something with its own identity that lives over time | |
| **Value object** | A value with no identity, compared by content (StoredFile, EditorKey) | |
| **Domain primitive** | A single constrained value type (TemplateId, DocumentId) | |
| **Invariant** | A condition that must never be false inside an aggregate | the "Invariants" section |
| **Rule** | A named business rule; classified by `kind` below | |
| **Policy** | A named decision that changes with context or time ("only a published template can be used") | |
| **Specification** | A reusable test ("a template is publishable when…") | |
| **Authorization** | A rule about who may do what | rule kind |
| **Uniqueness** | A rule against duplicates | rule kind |
| **Workflow** | A rule about the order of steps | rule kind |
| **Lifecycle** | The states an aggregate passes through and the steps between them | "the Document lifecycle" |
| **State / Transition / Guard** | A state / a step between states / a condition that must hold before the step | |
| **Command** | A request to do something (`confirm`, `approve`); can be refused | the "Commands" section |
| **Use case** | What a user does with the domain, usually several commands | |
| **Event** (domain event) | Something that already happened, in past tense (`workspace.document.saved`); other contexts can react | the "Events" section |
| **Domain service** | A business operation that belongs to no single aggregate | |
| **Repository** | The door for reading and writing one aggregate | |
| **Factory** | The place that creates an aggregate when creation has many rules | |
| **Port** | An interface a context declares to call out or to be called | "the Market Data port" |
| **Adapter** | The implementation of a port for one concrete system (ONLYOFFICE Document Server) | |
| **Process manager** | A process that coordinates several aggregates over time (a job that closes abandoned editor sessions) | |
| **Read model** | Read-only data built from another source for display or reports; holds no rules | |
| **EventStorming** | Reading a domain as sentences: actor → command → aggregate → event ← policy | sticky colours on the page follow this grammar |
| **Hotspot** | A spot that is unclear or disputed, recorded as an open question | |

## Status and reference codes

| Symbol | Meaning |
|---|---|
| `observed` | exists in code today |
| `target` | agreed goal, not yet coded |
| `proposed` | suggested, not agreed |
| `unknown` | not yet known |
| `accepted` / `rejected` / `superseded` | decision approved / rejected / replaced by a later one (keep the original text; `supersededBy` points at the new D) |
| `open` / `resolved` / `deferred` | question open / answered / postponed |
| **D12** | Decision number 12 in `docs/domain-model.json` and `.context/decisions/` |
| **OQ8** | Open question number 8 |

**Rule for mentioning D/OQ:** every time a code appears in speech, a log or the model, add its
short content right after it: "D2 (a template update creates a new revision)",
"OQ1 (are renaming and deleting a document in scope?)". The reader never has to look it
up. The renderer annotates codes on the page; agents must do it themselves when they speak.

## Writing style for the model and the pages

Standard sentence: **"A document gets a new editor key after every saved version."** One
sentence, one idea, a subject, what happens and when. Applies everywhere there is text:
description, invariant, rule, transition, event, use case, building block purpose, relation.

- Subject first: *The workspace copies the template file*, *The editor sends the save callback*,
  *The gateway fans out the tick*. Avoid the passive when someone does the act.
- Keep each sentence under about 20 words. A second idea gets a new sentence. No long dashes or
  semicolons as joiners; no parenthesis that holds a whole clause.
- Say the business act, not the code: *"the document returns to ready"* instead of *"UPDATE status
  = READY"*. Field names and function names appear only when the reader must go find that exact place.
- A D/OQ code always carries its short content; the renderer annotates it on the page, agents do
  it in speech.
- Use the DDD terms from the tables above. Use the business words with the meaning in the
  "Business language" table; do not coin a new word for something that already has a name.
- Transition: who acts and on what condition; a side effect states the business consequence
  (*"the template leaves the gallery"*), not a technical command.
- Event: write it as something that just happened, with a subject, so another context knows what
  to react to. Name it `<context>.<aggregate>.<past-tense>` (for example `workspace.document.saved`).
- Command: imperative (`archive_template`, `save_edited_version`). Do not translate or alias command and event names.
