---
name: Office Template Library
status: final
updated: 2026-10-29
sources:
  - ../../../specs/spec-office-template-library/SPEC.md
  - ../../architecture/architecture-office-template-library-2026-10-29/ARCHITECTURE-SPINE.md
---

# Office Template Library — Experience Spine

## Foundation

Responsive web, desktop first, fully usable on tablet and phone. Built with shadcn/ui, React and Tailwind CSS by the `ui-shadcn` skill. `DESIGN.md` is the visual identity reference, and this spine specifies behaviour only. A single anonymous user, with no sign-in (SPEC assumption). The UI is in English.

## Information Architecture

| Surface | Route | Reached from | Purpose (SPEC) |
|---|---|---|---|
| Document gallery | `/templates/docx` | Top bar "Documents"; `/` redirects here | Browse, search and filter DOCX templates (CAP-1, CAP-2) |
| Presentation gallery | `/templates/pptx` | Top bar "Presentations" | The same for PPTX template sets |
| Template preview | `?preview=<templateId>` on a gallery | Click a template card | See every page or slide, then use the template (CAP-3, CAP-4) |
| Editor | `/documents/:id/edit` | "Use template"; Open in My documents | Edit in ONLYOFFICE, download (CAP-5, CAP-6) |
| My documents | `/documents` | Top bar "My documents"; editor "Done" | Reopen or download earlier documents (CAP-7) |
| Not found | any unknown route | — | Explain and offer a way back (CAP-9) |

- **Top bar** on every surface: product name (links to `/`), the three nav items and a theme toggle. On phone, the nav moves into a menu Sheet.
- **Gallery URL state.** The search text (`q`) and category (`category`) live in the URL (AD-10). The preview dialog adds `preview` on top, so Back closes it and the link can be shared.
- **Dialogs stack one level deep at most.**

## Voice and Tone

Plain office language using the domain words: Template, Document, Presentation, Page, Slide, "Use template", "My documents".

| Do | Don't |
|---|---|
| "Use template" | "Get started!" / "Create" |
| "Creating your document…" | "Please wait…" |
| "No templates match "invoce"." | "No results found." |
| "Couldn't load templates. Check that the server is running." | "Something went wrong." |
| "Changes are saved when you close the editor." | "Don't forget to save!" |
| "6 slides" · "2 pages" | "6 items" |

## Component Patterns

| Component | Behaviour |
|---|---|
| Template card | The whole card is a button: click, Enter or Space opens the preview dialog. The thumbnail loads lazily, with a skeleton until it arrives. |
| Search input | Debounced by 250 ms, then written to the URL. It sits above the grid with a clear button. `/` focuses it. |
| Category filter | A row of toggle chips: "All" plus one chip per category that has templates of this kind, each with its count. It scrolls sideways on phone. One category is selected at a time, and picking the active chip again returns to "All". |
| Preview dialog | Opens on page or slide 1. The filmstrip and the ← → keys move between pages. "Use template" creates the document, shows "Creating your document…" on the button, then navigates to the editor. Esc or Back closes it. |
| Editor page | Loads the editor config, then mounts ONLYOFFICE full-height. The header Download button always downloads the last saved version. "Done" returns to My documents. |
| My documents | A table on tablet and desktop (Title, Type, From template, Version, Last saved, actions) and cards on phone. Each row has Open (primary) and Download. Newest first. Above the list: a search box (matches title or template name, debounced, kept in `?q=`) and a type filter All / Document / Presentation (`?kind=`), using the gallery's search and chip patterns. Filtering is client-side; the list is one local user's documents. |
| Theme toggle | Cycles System, Light and Dark, and remembers the choice in local storage. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Loading | Gallery | 8 skeleton cards in the grid's shape, plus skeleton chips. |
| Loading | Preview | The stage and filmstrip show skeletons. Name and description show at once from the gallery data. |
| Loading | Editor | Header shown, with a centred spinner and "Opening the editor…". |
| Loading | My documents | 5 skeleton rows. |
| Error | Gallery / My documents | shadcn Alert (destructive): "Couldn't load templates." with a Retry button that refetches. |
| Error | Use template | The button returns to its normal state. A toast says "Couldn't create the document. Try again." The dialog stays open. |
| Error | Editor script or config | An Alert: "The editor is unavailable. Document Server may still be starting; this takes about a minute after `docker compose up`." It offers Retry and Download. |
| Empty | Gallery with filters | "No templates match "{q}"" (or "…in {category}"), with a "Clear filters" button. |
| Empty | My documents | "No documents yet. Pick a template to start." with buttons to both galleries. |
| Empty, filtered | My documents | `No documents match "{q}"` (or "No {type}s yet") with a Clear filters button. |
| Not found | Unknown route | "Page not found", with a link to the galleries. |
| Not found | `?preview=` with an unknown id | The dialog shows "This template no longer exists." with a Close button. |
| Not found | Editor with an unknown document | "Document not found", with a link to My documents. |
| Archived | Preview of an archived template | An "Archived" badge. "Use template" is disabled with the note "This template was retired. Documents made from it still work." |
| Just closed editor | My documents | The list refetches every 3 s for 30 s, so the new version appears once the save callback lands. |

## Interaction Primitives

- Mouse and touch first, with full keyboard support.
- `/` focuses the search box. Esc closes the dialog or menu. ← → move between pages in the preview.
- Every action responds within 100 ms: a pressed state, a spinner on the button, or navigation.
- There are no hover-only affordances. Everything shown on hover is also reachable by focus or tap.
- **Banned:** infinite scroll (the catalog is small and always shown in full), confirmation dialogs for safe actions, and auto-opening the editor in a new tab.

## Accessibility Floor

- WCAG 2.2 AA. Brand colours keep AA contrast in both themes (white on `#2563EB` is 5.2:1).
- Each card has an accessible name of "{name}, {category}, {page count}". Thumbnails use `alt=""` because the card names them.
- The preview dialog traps focus and returns it to the card that opened it. Filmstrip items are buttons named "Page 2 of 5" or "Slide 2 of 5".
- Tab order matches reading order. Focus rings use shadcn's `ring` token.
- Result counts are announced with `aria-live="polite"`, for example "4 templates" and "No templates match".
- The ONLYOFFICE editor is a third-party iframe, and its accessibility is ONLYOFFICE's.

## Responsive & Platform

| Width | Behaviour |
|---|---|
| Desktop ≥ 1280 px | 4–5 column grid. The preview dialog is about 1100 px wide, with the stage left and the info panel right. |
| Tablet 768–1279 px | 3 column grid. The preview dialog is nearly full-screen. My documents stays a table. |
| Phone < 768 px | 1–2 column grid. Nav goes into a menu Sheet. Category chips scroll sideways. The preview becomes a full-screen sheet with stage, then filmstrip, then info, with "Use template" pinned to the bottom. My documents becomes cards. The editor uses ONLYOFFICE's mobile view. |

## Key Flows

### Flow 1 — An invoice before lunch (Linh, office manager, Tuesday 11:40)

1. Linh opens the app. It lands on Document templates.
2. She types "invoice". The grid narrows to one card as she types.
3. She clicks the Invoice card. The preview opens on page 1, showing the VAT table she needs.
4. She clicks "Use template". The button reads "Creating your document…", and the editor opens on her own copy.
5. She changes the client name and two line items, then clicks "Done".
6. **Climax:** My documents shows "Invoice", version 2, "Last saved just now". She clicks Download, and the file opens in Word with the table and bold totals intact. The Invoice template in the gallery is unchanged for her colleague.

Failure: Document Server is still starting → the editor shows "The editor is unavailable…" with Retry. A minute later Retry opens it.

### Flow 2 — Slides for tomorrow's class (Bao, teacher, evening, on a tablet)

1. Bao taps Presentations, then the Education chip.
2. He opens Classroom Lesson and swipes through its 4 slides in the preview.
3. He taps "Use template", edits the title slide and one card in the editor, then taps Done.
4. **Climax:** The next morning he opens My documents on the classroom PC, taps Open on "Classroom Lesson", and finds his edits there. He downloads the PPTX for the projector.

Failure: he follows an old shared link to a retired template → the preview shows the Archived badge and explains that his earlier documents still work.
