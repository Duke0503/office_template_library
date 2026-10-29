# Stack

**Decided** means the user confirmed it. **Proposed** is a default that `bmad-architecture` confirms or replaces.

| Area | Choice | Status | Note |
|---|---|---|---|
| Integrated editor | ONLYOFFICE Document Server Community Edition (Docker) | Decided | Edits DOCX and PPTX in the browser with full formatting. AGPL-3.0, run as a separate unmodified service |
| Run model | Docker Compose: app, Document Server, database | Decided | One command. The Document Server and the app must reach each other for file fetch and the save callback |
| Frontend | React, Vite, TypeScript | Proposed | Embeds the ONLYOFFICE editor through its JavaScript API |
| Backend | Node.js, Express, TypeScript | Proposed | Template and document API, file serving, ONLYOFFICE callback |
| Database | SQLite through Prisma | Proposed | Template and document metadata. Files stay on disk |
| Storage | `storage/templates/` (read-only originals and previews), `storage/documents/` (copies) | Proposed | The templates volume is mounted read-only into the app container |
| Previews | Generated from template files at import (ONLYOFFICE conversion API or LibreOffice) | Proposed | Thumbnail per template, one image per slide for PPTX |
| Editor security | ONLYOFFICE JWT enabled; callback requests verified | Proposed | |
| Tests | Vitest and Supertest (API); Playwright smoke test optional | Proposed | Copy isolation by checksum, not-found paths, callback save |
