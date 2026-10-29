---
id: SPEC-office-template-library
companions:
  - stack.md
  - deliverables.md
  - ../../planning-artifacts/architecture/architecture-office-template-library-2026-10-29/ARCHITECTURE-SPINE.md
sources:
  - ../../../docs/reference/brief.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Office Template Library

## Why

A mandate: a Fullstack Developer take-home test due 2026-11-01 15:00. Reviewers want a template library inside an office app that really runs. A user finds a DOCX or PPTX template, previews it, creates a new document from it, edits it and downloads it. The template itself never changes. The test scores working features, architecture, template and data handling, UX, tests and security, and documentation. It favours quality and clarity over breadth.

## Capabilities

- **CAP-1** Browse gallery
  - **intent:** User browses the templates of one kind (DOCX or PPTX) as a grid showing thumbnail, name, short description and category.
  - **success:** Both galleries list every seeded template with all four fields visible.
- **CAP-2** Search and filter
  - **intent:** User narrows a gallery by free-text search and by category.
  - **success:** A search or category filter shows only matching templates. No match shows an empty state with a way to clear the filter.
- **CAP-3** Preview
  - **intent:** User previews a template before using it.
  - **success:** A DOCX preview shows the rendered document. A PPTX preview shows every slide of the set in order.
- **CAP-4** Create from template
  - **intent:** User clicks "Use template" and gets a new, independent document copied from that template.
  - **success:** A new document exists with its own id. The template file's checksum is unchanged after create, edit and save.
- **CAP-5** Edit
  - **intent:** User edits the new document in the integrated editor in the browser, for both DOCX and PPTX.
  - **success:** An edit saved in the editor is present when the document is reopened. The template and other documents are unaffected.
- **CAP-6** Download
  - **intent:** User downloads the document in its own format (DOCX or PPTX).
  - **success:** The downloaded file opens in Word, PowerPoint or LibreOffice with headings, bold and italic text, lists, tables and images intact.
- **CAP-7** My documents
  - **intent:** User sees the documents created earlier and reopens or downloads any of them.
  - **success:** After a restart, earlier documents are still listed and can be opened and downloaded.
- **CAP-8** Template management
  - **intent:** An operator adds or updates a template (file plus metadata), and it appears in the gallery.
  - **success:** Adding a new template through the documented path shows it in the gallery with no frontend code change and no rebuild.
- **CAP-9** States
  - **intent:** Every screen communicates loading, error, empty and not-found conditions.
  - **success:** An unknown template or document id shows a not-found page. A failing backend or editor shows an error state with a retry, never a blank screen.
- **CAP-10** Seed data
  - **intent:** The app ships with ready-to-try templates loaded automatically on first start.
  - **success:** A fresh start shows at least 5 DOCX templates and at least 3 PPTX template sets, each with a thumbnail and previews.

## Constraints

- Template originals are immutable. No code path opens a template file for writing, and editing always targets a copy.
- The template record holds at least id, kind, name, category, description, file path and preview image(s).
- One application and one template engine serve both kinds. DOCX and PPTX are kinds of the same model, so another kind such as XLSX can be added without a rewrite.
- The integrated editor is ONLYOFFICE Document Server Community Edition, run in Docker as a separate, unmodified service (AGPL-3.0).
- The whole system starts locally with one `docker compose` command. There is no hosted deployment.
- Only DOCX and PPTX files are accepted. Files are addressed by a server-side id, never by a client-supplied path.
- Every third-party library and its license is disclosed, and so is AI-assisted development (Claude Code, BMAD Method).
- Templates and sample data are self-authored or permissively licensed. No employer or client material is used.
- The UI is in English.
- The deadline is 2026-11-01 15:00 (UTC+7), with an effort budget of 6–8 hours. A smaller, working scope beats a broad, fragile one.

## Non-goals

- User accounts, login or per-user isolation.
- Hosted or cloud deployment.
- A UI for authoring or uploading templates. Management goes through the manifest and import path (CAP-8).
- XLSX or other kinds beyond an extension point.
- Real-time multi-user collaboration as a feature.

## Success signal

- A reviewer clones the repo, runs `docker compose up` and opens the app. In both galleries they pick a template, edit the new copy in the browser and download a file that opens with its formatting intact. The template files are byte-identical afterwards.
- Automated tests prove copy isolation and the not-found paths, and the screen recording shows the same flow end to end.

## Assumptions

- There is a single anonymous user, since the brief does not mention authentication.
- Templates are managed through a manifest, a seed/import command and the API, with no admin UI.
- Thumbnails and slide previews are generated from the template files, not drawn by hand.
