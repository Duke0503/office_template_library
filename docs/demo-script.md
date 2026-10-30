# Demo video script

A screen recording of about 5 minutes that walks through every requirement in the brief. Each scene lists what to do on screen and what to say. Timings are a guide only.

## Before recording

1. Start from a clean state, so My documents is empty and the counts are clear.
   This deletes the documents created by earlier test runs:

   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

2. Wait until `http://localhost:3000/api/health` shows `"documentServer":"up"` (about a minute).
3. Warm up the editor once: open any template, click **Use template**, wait for the editor, then close the tab.
   The first editor load is slow. Then run `docker compose down -v && docker compose up -d` again, or keep that one document.
4. Browser: one window at about 1440×900, zoom 100%, light theme, no other tabs, bookmarks bar hidden.
5. Have these ready in other windows: VS Code with the repo open, a terminal in the repo folder, and Word or LibreOffice to open a downloaded file.
6. Optional: run `npm test` and `npm run test:e2e` before recording, and keep the terminal output for scene 10.

## Scenes

### 1. Introduction (0:00–0:20)

**Screen:** `http://localhost:3000`, the Document templates gallery.

**Say:** "This is my Office Template Library. It has two products, a document library for DOCX and a presentation library for PPTX. Both run on one template engine. Users pick a template, preview it, and create their own copy, which they edit in ONLYOFFICE inside the app. The original template never changes."

### 2. Gallery, search and filter (0:20–1:00)

**Do:**

1. Point at a card: thumbnail, name, description, category.
2. Type `invoice` in the search box. One card remains. Point at `?q=invoice` in the address bar.
3. Reload the page. The search is still there.
4. Clear the search. Click the **Education** chip, then **All**.
5. Type `zzz`. The empty state appears. Click **Clear filters**.

**Say:** "There are six document templates and four presentations. Search matches name, description and category, and the filters live in the URL, so a filtered view can be shared or reloaded. Every list has loading, error and empty states."

### 3. Preview (1:00–1:30)

**Do:**

1. Click **Project Proposal**. The preview dialog opens with the full page.
2. Go to **Presentations** and open **Startup Pitch Deck**.
3. Page with the right arrow key and click a slide in the filmstrip. Press **Escape**.

**Say:** "The preview shows every page or slide. The images are rendered by ONLYOFFICE itself, so they match what the editor shows. You can page with the keyboard, and the dialog's address can be shared."

### 4. Use a DOCX template and edit it (1:30–2:45)

**Do:**

1. Go to **Documents** and open **Invoice**. Click **Use template**.
2. The editor opens. Point at the **v1** badge in the header.
3. Edit the document:
   - Under "Bill to", replace `Sunrise Retail Co., Ltd.` with a new client name.
   - Add a line of text and make it **bold**.
4. Click **Done**.

**Say:** "Use template makes a copy of the template and checks its SHA-256 checksum, then opens the copy in ONLYOFFICE. I'm editing my copy, not the template. ONLYOFFICE saves when the editor closes. It calls back to my API, which stores the file as a new version."

### 5. My documents: save, search, download (2:45–3:30)

**Do:**

1. My documents opens. After a few seconds the Invoice row shows **Version 2** and "just now".
2. Type `invoice` in the search box, then click the **Documents** type filter. Clear both.
3. Click **Download** on the Invoice row and open the file in Word.
   Show that the new client name, the bold line, the tables and the totals are all there.

**Say:** "Here is the saved version 2. My documents has search and a type filter too. The downloaded file opens in Word with the edits, and the original formatting is intact: tables, bold text, headings."

### 6. The original template is unchanged (3:30–3:50)

**Do:**

1. Go back to the Documents gallery and open the **Invoice** preview. It still shows `Sunrise Retail Co., Ltd.`
2. Click **Use template** again. The new copy opens without the edits. Click **Done**.

**Say:** "The template is untouched. Template files are stored read-only, every save writes a new file, and the tests compare checksums before and after."

### 7. Presentation flow (3:50–4:25)

**Do:**

1. Go to **Presentations** and open **Quarterly Business Review**. Click **Use template**.
2. Change the title on slide 1 and click **Done**.
3. In My documents, the presentation appears, and its version goes up after the save.

**Say:** "Presentations use the same engine and the same flow. DOCX and PPTX are two entries in a registry, so adding XLSX later is one entry."

### 8. States, theme, responsive (4:25–4:50)

**Do:**

1. Open `http://localhost:3000/templates/xlsx`. The page shows **Page not found**.
2. Open `http://localhost:3000/documents/00000000-0000-0000-0000-000000000000/edit`. The page shows **Document not found**.
3. Click the theme toggle to switch to dark mode, then back.
4. Open DevTools and switch to a phone viewport. Show the gallery and the preview sheet.

**Say:** "Unknown pages, templates and documents each get a clear message. The app has light and dark themes and works from phone to desktop."

### 9. Adding a template without UI changes (4:50–5:15)

**Screen:** VS Code, `templates/manifest.json`.

**Say:** "Templates come only from this manifest. To add one, I put the file in `templates/files`, add an entry here, render its previews and restart the app. The gallery picks it up with no code change and no rebuild. Replacing a file creates a new revision, and removing an entry archives the template, while documents made from it keep working."

### 10. Architecture and tests (5:15–5:45)

**Do:**

1. Show the README architecture diagram on GitHub.
2. Show the terminal output: `npm test` (20 passed) and `npm run test:e2e` (14 passed).

**Say:** "It's a modular monolith, with an Express API and a React app in one container, and ONLYOFFICE Document Server beside it. The catalog, workspace and editor modules talk only through ports. There are 20 API tests, and Playwright end-to-end tests drive the real editor, save a DOCX and check the downloaded file."

### 11. Close (5:45–6:00)

**Say:** "Everything runs with one command, `docker compose up`. The README covers setup, architecture, the API, limits, licenses, and how I used AI. Thanks for watching."

## Tips

- Saving takes a few seconds after **Done**. If version 2 doesn't appear yet, wait; the list refreshes on its own for 30 seconds.
- If the editor shows "The editor is unavailable", Document Server is still starting. Wait and click **Retry**.
- To keep the video short, cut the waits for the editor to load.
