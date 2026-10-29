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
| **Shared kernel** | A small part of the model that two sides own and change together | e.g. the Protobuf message definitions |
| **Partnership / Upstream–downstream / Separate ways** | Evolve together / one side leads / go separate ways | relationship pattern |

## Tactical design (building blocks)

| Term | Short meaning | Usage note |
|---|---|---|
| **Building block** | A named DDD piece in the model (aggregate, entity, value object, service…) | |
| **Aggregate** | A group of data that must be correct together; every change goes through one door | "the TradeSetup aggregate" |
| **Aggregate root** | The record at the head of an aggregate and its only entry point | |
| **Entity** | Something with its own identity that lives over time | |
| **Value object** | A value with no identity, compared by content (Price, Money) | |
| **Domain primitive** | A single constrained value type (Symbol, PriceLevel) | |
| **Invariant** | A condition that must never be false inside an aggregate | the "Invariants" section |
| **Rule** | A named business rule; classified by `kind` below | |
| **Policy** | A named decision that changes with context or time ("a counter-trend setup needs higher confidence") | |
| **Specification** | A reusable test ("a setup is publishable when…") | |
| **Authorization** | A rule about who may do what | rule kind |
| **Uniqueness** | A rule against duplicates | rule kind |
| **Workflow** | A rule about the order of steps | rule kind |
| **Lifecycle** | The states an aggregate passes through and the steps between them | "the TradeSetup lifecycle" |
| **State / Transition / Guard** | A state / a step between states / a condition that must hold before the step | |
| **Command** | A request to do something (`confirm`, `approve`); can be refused | the "Commands" section |
| **Use case** | What a user does with the domain, usually several commands | |
| **Event** (domain event) | Something that already happened, in past tense (`radar.setup.activated`); other contexts can react | the "Events" section |
| **Domain service** | A business operation that belongs to no single aggregate | |
| **Repository** | The door for reading and writing one aggregate | |
| **Factory** | The place that creates an aggregate when creation has many rules | |
| **Port** | An interface a context declares to call out or to be called | "the Market Data port" |
| **Adapter** | The implementation of a port for one concrete system (Binance feed, CoinGlass API, DeepSeek API) | |
| **Process manager** | A process that coordinates several aggregates over time (the job that expires stale setups) | |
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
short content right after it: "D15 (the official price changes only through an approved review)",
"OQ41 (who owns the venue list when Quant needs a new exchange)". The reader never has to look it
up. The renderer annotates codes on the page; agents must do it themselves when they speak.

## Writing style for the model and the pages

Standard sentence: **"A setup becomes active only after price enters its entry range."** One
sentence, one idea, a subject, what happens and when. Applies everywhere there is text:
description, invariant, rule, transition, event, use case, building block purpose, relation.

- Subject first: *The guardrail rejects the setup*, *The Quant Engine publishes the profile*,
  *The gateway fans out the tick*. Avoid the passive when someone does the act.
- Keep each sentence under about 20 words. A second idea gets a new sentence. No long dashes or
  semicolons as joiners; no parenthesis that holds a whole clause.
- Say the business act, not the code: *"the setup moves to active"* instead of *"UPDATE status
  = ACTIVE"*. Field names and function names appear only when the reader must go find that exact place.
- A D/OQ code always carries its short content; the renderer annotates it on the page, agents do
  it in speech.
- Use the DDD terms from the tables above. Use the business words with the meaning in the
  "Business language" table; do not coin a new word for something that already has a name.
- Transition: who acts and on what condition; a side effect states the business consequence
  (*"the setup leaves the radar feed"*), not a technical command.
- Event: write it as something that just happened, with a subject, so another context knows what
  to react to. Name it `<context>.<aggregate>.<past-tense>` (for example `radar.setup.activated`).
- Command: imperative (`confirm`, `invalidate`). Do not translate or alias command and event names.
