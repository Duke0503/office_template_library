---
review: adversarial
target: ../ARCHITECTURE-SPINE.md
date: 2026-10-29
lens: 'Pairs of units that each obey every AD yet build incompatibly'
verdict: 'Not ready to build from. Sound shape, but 5 high-likelihood holes (H1-H5) need tightened ADs first.'
---

# Adversarial Review — Architecture Spine, Office Template Library

## Verdict

The paradigm, module split and most ADs are right for the scope. But the spine pins down *who* may
mutate things, not *how* they agree on identity, ordering and shape. Two competent developers (or two
agent sessions) can obey AD-1 to AD-10 exactly and still produce units that do not fit together. The
worst cases sit on the scored path: save from the editor (CAP-5), copy isolation under revision
(CAP-4/CAP-8), and "add a template with no rebuild" (CAP-8). Close H1-H5 before stories are written.
H6-H12 are cheaper and can go into the conventions table.

Holes are ordered by how likely they are to bite in a 6-8 hour build.

---

## High-likelihood holes

### H1 — Editor key rotation vs. concurrent / sequential callbacks (editor adapter x `saveEditedVersion`)

**Pair:** `editor` callback adapter and workspace `saveEditedVersion`.

**How both obey the ADs and still clash:**

- AD-7 maps status 2 **and 6** to `saveEditedVersion`. AD-6 says *every* save sets
  `editorKey = {documentId}-v{n}`.
- ONLYOFFICE sends status 6 (force-save) while the editing session is still open, under the session's
  key. Later it sends status 2 under **the same key** when the session closes.
- Developer A (workspace) implements the domain-model guard "the callback names the document's current
  editor key". After status 6 rotated the key to `-v2`, the final status 2 with key `-v1` is rejected.
  Because AD-7 says to answer `{"error":0}` once the JWT is verified, Document Server considers the
  final edits saved. **The last edits are lost without any error.**
- Developer B skips the key guard. Then two callbacks that arrive close together both read
  `version = 1`, both compute `n = 2` and both write `documents/{id}/v2.docx`. One silently overwrites
  the other, because AD-6 says "first write the file, then the transaction".
- The domain model maps only status 2 (status 6 is "logged and ignored"), while the spine maps 2 and 6.
  These are two sources that disagree.

**Proposed rule (tighten AD-6 + AD-7):**

- Version allocation and the file write are serialised per document. Write the incoming bytes to
  `documents/{id}/tmp-{uuid}`. Then, in one SQLite transaction (or under a per-document in-process
  mutex), run `UPDATE documents SET version = version + 1 … RETURNING version`, rename the temp file
  to `v{n}.{ext}` and commit. A version file is never overwritten: rename fails if the target exists.
- `editorKey` identifies the **session's content baseline**. It rotates only on status 2 (the session
  ended with changes). Status 6 stores a new version but **keeps** the key. Status 4 changes nothing.
- A callback is accepted if `body.key === document.editorKey`. A callback whose key does not match is
  logged and answered `{"error":0}` without any write. This is safe only because of the previous point.
- Alternatively, and simpler for the budget: turn force-save off in the editor config, handle **only**
  status 2, and update the domain model to match. Either way, the spine and the domain model must say
  the same thing.

### H2 — `{"error":0}` on failure, and the callback download URL (callback adapter x Document Server)

**Pair:** callback route and the save command that fetches `body.url`.

- AD-7: "the response is always `{"error":0}` once verified". If fetching `body.url` or the
  transaction fails, Document Server is still told that the save succeeded, and it discards its copy.
  The result is silent data loss on the main scored flow.
- AD-7 covers the URLs that Document Server uses to reach the app (`APP_INTERNAL_URL`). It says nothing
  about the reverse direction. `body.url` in a status 2 callback is built from the host the editor was
  opened on, which is `PUBLIC_DOCSERVER_URL` = `http://localhost:8080`. Inside the app container,
  `localhost:8080` is the app itself, so the fetch fails. Combined with the first point, this means
  "edits never persist, no error anywhere". This is the classic ONLYOFFICE-in-compose bug.

**Proposed rule (tighten AD-7):**

- Answer `{"error":0}` **only after** the version is committed. On any failure, answer `{"error":1}`
  (HTTP 200) so that Document Server keeps the changes and retries. A failed JWT check returns 403.
- The editor adapter rewrites the origin of every URL Document Server hands back (`body.url`,
  `changesurl`, conversion `fileUrl`) to `DOCSERVER_INTERNAL_URL` (`http://documentserver`) before it
  fetches. Add `DOCSERVER_INTERNAL_URL` to `config.ts` and `.env.example`. The adapter accepts only
  URLs whose host is a configured Document Server host (this also prevents SSRF).

### H3 — Revision pinning during create (`DocumentFactory` x `TemplateImporter`)

**Pair:** workspace `DocumentFactory` (through `TemplateSource`) and catalog `TemplateImporter`,
running concurrently. `npm run templates:import` "can also be run by hand", which means a second
process against the same SQLite file and volume.

- The `TemplateSource` shape is not specified. A natural implementation is
  `getPublished(id) → {name, revision}` plus `openFile(id) → stream`. If the importer commits
  revision n+1 between those two calls, the document records origin `r{n}` but holds the bytes of
  `r{n+1}`.
- AD-2: "compares sha256 checksums". Compared against what? Hashing the stream you just read proves
  nothing. Comparing against the template row's checksum gives a spurious failure under the race.
- The importer might update the `templates` row *before* it writes and chmods `r{n+1}/` (AD-4 does not
  fix the order). A create in that window reads a key whose file does not exist yet.
- Two importer processes (start-up import plus a manual one) both compute `n+1`.
- AD-5 lists only the `categories` and `templates` tables, but the ER diagram has
  `TEMPLATE_REVISION_FILE`. One developer stores the current file on the `templates` row. Another
  creates a `template_revisions` table. The AD-2 test "every template checksum unchanged" then has
  nothing to iterate for old revisions in the first design.

**Proposed rule (new AD, "Revision-pinned template reads"):**

- `TemplateSource.getPublishedRevision(templateId)` returns an immutable descriptor
  `{templateId, revision, kind, name, storageKey, sha256, size}`. `TemplateSource.open(descriptor)`
  opens **that** storage key. `DocumentFactory` compares the copy's sha256 against
  `descriptor.sha256`. `TemplateOrigin` is built from the same descriptor.
- `catalog` owns a `template_revisions` table `(template_id, revision, storage_key, sha256, size,
  created_at)` with UNIQUE `(template_id, revision)`. `templates.current_revision` points into it.
- Importer order: write the file → chmod 0444 → verify sha256 → *then* in one transaction insert the
  revision row and move `current_revision`. Revision files are never deleted.
- SQLite runs with `journal_mode=WAL` and `busy_timeout=5000`. The start-up import completes before
  `app.listen()`.

### H4 — "No rebuild" vs. the Docker image, and non-deterministic seeds (manifest x Dockerfile x generator)

**Pair:** `Dockerfile`/compose and the `TemplateImporter` + `scripts/generate-templates.ts`.

- CAP-8 success: a new template appears "with no frontend code change and no rebuild". If the
  Dockerfile does `COPY templates/` (the obvious thing), adding a template needs `docker compose build`.
  Every AD is obeyed, and CAP-8 fails.
- `docx` and `pptxgenjs` write the current time into `docProps/core.xml` and ZIP entry times. If any
  developer runs the generator at build or start (CAP-10 "loaded automatically on first start" invites
  this), the checksum changes, AD-4 creates a new revision on **every start**, and documents' origin
  revisions drift for no reason.
- AD-4 says revisions are "stored at `templates/{templateId}/r{n}/`", while the repo directory is also
  `templates/` (manifest, sources, previews). One developer writes revisions into the repo checkout.
  The structural seed says `storage/templates`. Two meanings for one path.

**Proposed rule (tighten AD-4):**

- `./templates` is **bind-mounted read-only** into the app container (`/app/templates:ro`) and is not
  copied into the image. "Add a template" is defined as: edit the manifest, add the file and previews,
  then run `docker compose restart app` (or `docker compose exec app npm run templates:import`).
  Document this in the README.
- Seed sources and previews are **committed artefacts**. The generator and preview renderer are
  developer-only scripts, never run at build or start. The generator pins all document dates and ZIP
  times so that re-running it is byte-stable.
- Storage keys are always `templates/{templateId}/r{n}/source.{ext}` **relative to `STORAGE_ROOT`**
  (`/data/storage`). Code never resolves storage keys against the repo `templates/` directory. Name the
  two constants `MANIFEST_DIR` and `STORAGE_ROOT`.
- A manifest entry that disappears entirely is treated as archived (never deleted), with a warning
  logged.

### H5 — Preview ownership, numbering and caching (importer x preview route x web)

**Pair:** catalog importer/preview route and the web preview dialog/gallery card.

- AD-4 says previews are committed in the manifest. The domain model says the importer asks
  `PreviewRenderer` to render them, and the spine diagram keeps `catApp → PreviewRenderer`. The result
  is two producers of one artefact. If the importer renders at start-up, start-up depends on Document
  Server being up and slow, and any failure leaves a template without previews, which breaks the
  invariant "a published template has a thumbnail and at least one preview".
- `GET /api/templates/:id/previews/:n`: is `n` 0- or 1-based? Is the thumbnail `n=0`, `n=1` or its own
  image? A web developer who builds the URLs (`/previews/${i}`) with a 0-based loop gets 404 on the last
  slide or skips the first.
- The URL has no revision in it. After a revision, the browser and TanStack Query serve stale images
  for a template whose previews changed (the domain model side effect: "gallery shows the new
  previews").

**Proposed rule (new AD, "Previews"):**

- Previews are committed files, listed per template in the manifest in order. The importer **copies**
  them into `templates/{id}/r{n}/preview-{k}.png` (k is 1-based) and records `preview_count`. The
  `PreviewRenderer` port is used only by `scripts/render-previews.ts`. Remove the runtime
  `catalog → editor` arrow, or mark it script-only.
- The thumbnail is preview 1. There is no separate thumbnail asset.
- The API returns **absolute-path URLs** (`thumbnailUrl`, `previewUrls[]`) that include the revision:
  `/api/templates/:id/revisions/:rev/previews/:k`, served with
  `Cache-Control: public, max-age=31536000, immutable`. The web client never builds preview URLs.

---

## Medium-likelihood holes

### H6 — `DocumentStatus` (`ready`/`editing`) vs. AD-6

The domain model has `status` and an `open_in_editor` transition. AD-6 allows only two commands to
mutate a document, so `GET /editor-config` cannot set `editing`. One developer adds a status column
that never leaves `ready`. Another mutates it in a GET.
**Rule:** drop `DocumentStatus` from the persisted schema and the API for this scope (the editor
session is Document Server state). Update the domain model accordingly. Editor config is a pure query.

### H7 — The signed file URL is not bound to the version the key names

`GET /api/files/documents/:id?token=` "serves the current version". A config issued for
key `-v1` can be fetched after `v2` is committed, so Document Server caches v2 bytes under the v1 key.
This is a key-content mismatch, which ONLYOFFICE treats as corruption or stale cache.
**Rule:** the token's claims are `{documentId, version, exp}`, the route serves
`documents/{id}/v{version}.{ext}` from the claim, and `editorKey` is derived from the same version.
Download (CAP-6) keeps serving the current version.

### H8 — Category identity in the URL and the API

D3 shares categories across kinds. AD-10 puts `category` in URL params, but neither the API seed nor
AD-8 says whether it is the slug or the UUID. The web sends a slug (readable URL), the gallery query
filters by `categoryId`, and nothing matches. A `?category=` carried across from the DOCX tab to the
PPTX tab may name a category with no PPTX templates.
**Rule:** categories appear publicly by **slug** (`?category=business`). Templates and documents
appear by UUID. An unknown or kind-empty category slug returns the empty state (200, `[]`), not 404.
`q` is matched case-insensitively against name and description only, with a `LOWER()` comparison, and
is trimmed. Empty `q` means no filter.

### H9 — Archived template: 404 or a readable record?

AD-4 archives the template. The domain model says create is refused. The spine leaves open what
`GET /api/templates/:id` returns for an archived id, and what `POST /templates/:id/documents` returns.
The web "not found" state (CAP-9) and a document's origin link depend on the answer.
**Rule:** `GET` returns archived templates with `status: "archived"`. The gallery list excludes them.
`POST …/documents` on an archived template returns `409 TEMPLATE_ARCHIVED`. `TEMPLATE_NOT_FOUND` (404)
means the id is unknown. Add both codes to the shared zod error-code enum.

### H10 — `PUBLIC_DOCSERVER_URL` reaching the browser

AD-7 says the browser loads the editor from `PUBLIC_DOCSERVER_URL`, an API env var. A web developer
reads it through `import.meta.env.VITE_…`, which bakes it in at build time. Changing the port then
needs a rebuild, and the value differs between dev and compose.
**Rule:** the `editor-config` response includes `documentServerUrl`. The web client never reads
Document Server settings from build-time env.

### H11 — Document shape on the wire: where `kind` and the file type come from

`kinds.ts` holds the mapping (AD-3), but the API documents can expose `kind`, `fileType`, `ext` or
`mime` in different ways. The web download link and editor `documentType` then disagree.
**Rule:** the API exposes only `kind`. Every derived value (ext, MIME, documentType, label) comes from
`kinds.ts` on both sides. Download sets `Content-Disposition: attachment; filename*=UTF-8''{title}.{ext}`
with RFC 5987 encoding.

### H12 — chmod 0444 and the checksum test on a Windows host

The dev host is Windows. There, `fs.chmod(0o444)` only sets the read-only attribute, and a mode
assertion (`stat.mode & 0o777 === 0o444`) fails. One developer asserts the mode bits. Another asserts
only checksums.
**Rule:** the AD-2 test asserts **checksums** of every `template_revisions` row (before and after
create, save and download), plus "opening a template key for writing throws" through the
`TemplateStore` type surface. Mode bits are best-effort and are not asserted cross-platform.

---

## Not raised (judged theoretical for this scope)

- Multi-user collaborative sessions (a non-goal), Document Server cache eviction, or UUID collision in
  editor keys.
- Migrations order across the two Drizzle schema files. Worth one line in conventions (one
  `drizzle.config.ts` listing both schemas, migrations run before the import), but unlikely to clash.

## Summary of proposed AD changes

| Hole | Change |
|---|---|
| H1 | AD-6/AD-7: serialised version allocation with temp file + rename; key rotates only on status 2 (or force-save off); key-match guard; spine and domain model aligned |
| H2 | AD-7: `{"error":0}` only after commit, else `{"error":1}`; rewrite DS-returned URLs to `DOCSERVER_INTERNAL_URL` |
| H3 | New AD: revision-pinned `TemplateSource` descriptor; `template_revisions` table; importer write order; WAL + busy_timeout |
| H4 | AD-4: bind-mounted read-only `./templates`; committed byte-stable seeds; `MANIFEST_DIR` vs `STORAGE_ROOT`; removed entry = archived |
| H5 | New AD: committed previews copied by the importer; 1-based; thumbnail = preview 1; revision-stamped immutable URLs returned by the API |
| H6-H12 | Conventions: drop DocumentStatus; version-bound file token; category by slug; archived = 409; runtime DS URL; `kind`-only wire shape; checksum-based immutability test |
