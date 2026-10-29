---
review: verification (facts and fit)
target: ../ARCHITECTURE-SPINE.md
date: 2026-10-29
verdict: PASS WITH CORRECTIONS
---

# Verification Review — Architecture Spine

Lens: is every committed decision backed by current, checkable facts rather than training-data recall? Plain version numbers were already checked with `npm view` and Docker Hub on 2026-10-29. This review checks fit and facts, mainly the ONLYOFFICE contract (AD-7, Structural Seed) and the toolchain.

**Verdict: PASS WITH CORRECTIONS.** Most ONLYOFFICE facts in AD-7 are correct. Two gaps would cause failures at runtime: where the callback JWT is read from, and which host the callback file `url` points to. The Document Server pin is behind the current 9.x line and slightly mismatched with the React wrapper's peer dependency. TypeScript 7 rules out typescript-eslint. Everything else checks out.

## Verified as correct

| Claim | Status | Evidence |
|---|---|---|
| DS image JWT env vars `JWT_ENABLED` (default `true`), `JWT_SECRET` (default random), `JWT_HEADER` (default `Authorization`), `JWT_IN_BODY` (default `false`) | Correct | https://github.com/ONLYOFFICE/Docker-DocumentServer (README, env table) |
| `ALLOW_PRIVATE_IP_ADDRESS=true` lets DS reach a private-network host (`http://app:3000` resolves to a compose-network private IP) | Correct env var, and it is needed. `ALLOW_META_IP_ADDRESS` is a separate flag and is not needed | Same README |
| Callback statuses: 2 = ready for saving, 4 = closed with no changes, 6 = being edited but current state saved (force save) | Correct | https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/ |
| Callback response must be `{"error": 0}`, or the editor shows an error | Correct | Same page |
| Conversion endpoint for 9.x is `/converter`. `/ConvertService.ashx` was used only before 5.5 | Correct (the spine names no path; the seed should say `/converter`) | https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/request/ |
| `thumbnail.first=false` with `outputtype: png` returns a zip of thumbnails for every page or slide. `aspect`, `width`, `height` control size | Correct, so all DOCX pages and PPTX slides can be rendered | Same page |
| `document.key`: max 128 chars, allowed `0-9 a-z A-Z - . _ =` | `{uuid}-v{n}` is 36 + 2 + digits, hex and hyphens only, so it passes | https://api.onlyoffice.com/docs/docs-api/usage-api/config/document/ |
| `@onlyoffice/document-editor-react@2.3.0` supports React 19 | Correct. Peers are `react ^16.9 \|\| ^17 \|\| ^18 \|\| ^19`. Props are `id`, `documentServerUrl`, `config`, `onLoadComponentError` | `npm view` (2026-10-29); https://github.com/ONLYOFFICE/document-editor-react |
| better-sqlite3 13.0.3 on `node:24` | No native build needed. The tarball ships N-API prebuilds for linux-x64/arm64 (glibc and musl), darwin and win32, has no install script, and requires Node >=22 | `npm pack --dry-run better-sqlite3@13.0.3` |
| drizzle-orm 0.45.4 with better-sqlite3 | Peer `better-sqlite3 >=7` is satisfied | `npm view` |
| drizzle-kit 0.31.11 with TS 7 | It loads TS through esbuild/tsx and has no `typescript` dependency, so it is unaffected | `npm view drizzle-kit dependencies` |
| tsx and Vite with TS 7 | Both transpile with esbuild/Rolldown and never call the `typescript` JS API, so they are unaffected | Package metadata |
| react-router 8.5.1 as a plain SPA library | Fits. v8 still has declarative (`BrowserRouter`) and data (`createBrowserRouter` + `RouterProvider`) modes from the single `react-router` package. Peers are `react >=19.2.7`, Node >=22.22 | `npm view`; https://unpkg.com/react-router@8.4.0/docs/start/modes.md |

## Findings

### F1 (high) — The callback JWT location and shape are not specified

AD-7 says "verifies the JWT" but not where the token is or what is inside it. DS sends the token as `Authorization: Bearer <jwt>` (header name from `JWT_HEADER`). The token payload wraps the body as `{ payload: { key, status, url, ... } }`. When body tokens are enabled, the token can also arrive as `token` in the JSON body. From 10.0 every outgoing token also carries `operation` (`callback` or `download`). The signed file-fetch GET (`/api/files/documents/:id`) also gets an `Authorization` header from DS.

**Correction:** Add to AD-7: "The callback handler accepts the token from `body.token` or from the `Authorization: Bearer` header, verifies it with HS256 and `ONLYOFFICE_JWT_SECRET`, and trusts only the verified claims (`payload.*` when present, else the top-level claims), never the unsigned body. Conversion requests from the API to DS send `Authorization: Bearer` with the body wrapped in `payload`." Also say how compose maps the secret: DS reads `JWT_SECRET`, not `ONLYOFFICE_JWT_SECRET`, so set `JWT_SECRET=${ONLYOFFICE_JWT_SECRET}` and `JWT_ENABLED=true` explicitly on the DS service.
Sources: https://api.onlyoffice.com/docs/docs-api/additional-api/signature/request/token-in-header/ , https://api.onlyoffice.com/docs/docs-api/additional-api/signature/request/token-in-body/ , https://github.com/ONLYOFFICE/Docker-DocumentServer

### F2 (high) — The host in the callback `url` may be unreachable from the app container

On status 2 or 6, the API must download the edited file from the `url` that DS supplies. AD-7 separates browser-reachable URLs from container-reachable URLs for app-to-DS traffic in one direction only. The download link DS returns is usually built from the public host the browser used, for example `http://localhost:8080/cache/files/...`. Inside the app container, `localhost:8080` is the app container itself. The docs show only a placeholder host (`https://documentserver/url-to-edited-document.docx`) and do not commit to how the host is formed. This is a known docker-compose gotcha, which is why integrations such as Nextcloud have a separate "address for internal requests" setting.

**Correction:** Add an env var `DOCSERVER_INTERNAL_URL=http://documentserver` and a rule: "Before downloading the callback `url`, the editor adapter replaces its origin with `DOCSERVER_INTERNAL_URL`." Cover this with a test, and check it in the first ONLYOFFICE spike story.
Source: https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/ (shows the `url` field with no host guarantee)

### F3 (medium) — Status 6 combined with a per-save editorKey bump can split the editing session

AD-6 changes `editorKey` on every save, and AD-7 maps status 6 to `saveEditedVersion`. Status 6 is a force save while the session continues (`forcesavetype` 0–3). It happens only when force save is enabled or triggered. If the key is bumped on status 6, anyone who opens the editor next gets a new key, and so a separate session, while the original session is still open. The original session later sends status 2 under the old key.

**Correction:** Pick one:
- (a) Leave force save off (the default) and state that status 6 is not expected.
- (b) On status 6, write the version file but do not rotate `editorKey`. Rotate the key only on status 2.

Either way, compare the callback `key` with the current `editorKey` and log a mismatch.
Source: https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/

### F4 (medium) — The Document Server pin is behind and misaligned with the React wrapper

Docker Hub on 2026-10-29 lists `9.3.1`, `9.4.0` (2026-05-19) and `10.0.0` (2026-10-12). `9.3.0` is neither the latest patch nor the latest minor. `@onlyoffice/document-editor-react@2.3.0` declares the peer `@onlyoffice/doceditor-types >=9.3.1`, and npm 7+ will install the newest types (10.0.1) against a 9.3.0 server. 10.0 also changes the JWT contract: outgoing tokens carry an `operation` claim, and the converter rejects editor-config tokens.

**Correction:** Pin `onlyoffice/documentserver:9.4.0` and `@onlyoffice/doceditor-types@9.4.x`. These are the current stable 9.x line and satisfy the peer range. Record 10.0 as deferred, with a note to check the F1 token handling when upgrading. If 9.3.0 is kept on purpose, write down why.
Sources: https://hub.docker.com/r/onlyoffice/documentserver/tags , `npm view @onlyoffice/document-editor-react@2.3.0 peerDependencies`, https://api.onlyoffice.com/docs/docs-api/additional-api/signature/request/token-in-body/

### F5 (low) — TypeScript 7 rules out typescript-eslint and other tools that use the TS JS API

`typescript@7.0.2` is the native compiler. Its main export is only `lib/version.cjs`, and the API sits under `typescript/unstable/*`. `typescript-eslint@8.72.1` requires the peer `typescript >=4.8.4 <6.1.0`. shadcn and Vite starter templates usually include ESLint with typescript-eslint, so the scaffold will hit an `ERESOLVE` conflict or a runtime failure. tsx, Vite, Vitest, drizzle-kit and shadcn (ts-morph bundles its own TS) are unaffected.

**Correction:** Add to the Stack or Conventions: "Lint with a linter that does not use the TS API (Biome or oxlint), or install TypeScript 6.0 alongside, used by ESLint only. `tsc --noEmit` (TS 7) is the type gate."
Source: `npm view typescript-eslint peerDependencies`, `npm view typescript@7.0.2 exports`

## Minor notes

- The Structural Seed should name the conversion endpoint `POST {DOCSERVER_INTERNAL_URL}/converter` with `async: false` and a unique conversion `key` (for example `preview-{templateId}-r{n}`). A sync request that times out can only be retried with the same key.
- Previews are committed (AD-4) and rendered by `scripts/render-previews.ts`, so runtime conversion is optional. The `PreviewRenderer` port should say whether it runs only at build time.
- The 10-minute signed file URL is fine. DS fetches the file when the editor opens, and converter fetches happen at once.
