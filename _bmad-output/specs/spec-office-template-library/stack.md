# Stack

All choices are decided by the architecture spine (`ARCHITECTURE-SPINE.md`, AD-1 to AD-14). Versions are pinned there.

| Area | Choice |
|---|---|
| Integrated editor | ONLYOFFICE Document Server Community Edition 9.4.0 (Docker, AGPL-3.0, unmodified separate service) |
| Run model | Docker Compose with two services: `app` and `documentserver` |
| Frontend | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router |
| Backend | Node.js 24, Express 5, TypeScript, zod |
| Database | SQLite through Drizzle ORM and better-sqlite3. Files stay on disk |
| Storage | Repo `templates/` (manifest, files, previews) mounted read-only; `STORAGE_ROOT` volume for stored revisions and documents |
| Previews | Rendered offline through the ONLYOFFICE conversion API and committed |
| Editor security | ONLYOFFICE JWT on both directions; signed, version-bound file URLs |
| Tests | Vitest and Supertest |
