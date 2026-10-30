# Demo video script

A screen recording of about 5–6 minutes. Rather than going through the requirements one by one, the video follows **one continuous story**: today the user has two jobs, sending an invoice to a client and preparing the quarterly review slides. Every requirement of the brief comes up naturally while doing those two jobs. The technical part comes at the end.

Each scene has **Do** (on screen), **Say** (narration) and **Bridge** (the line that leads into the next scene).

| Part | Content | Brief requirements shown |
|---|---|---|
| Opening | Introduction and the two jobs | |
| Job 1 | Invoice: find → preview → create → edit → save → download → template unchanged | Gallery, search, filter, preview, use template, editor, save, download, formatting kept, original untouched |
| Job 2 | Quarterly review slides, then finding files in My documents | PPTX gallery, slide preview, My documents search |
| Details | Errors, dark theme, phone | Loading, error and not-found states, responsive |
| Behind it | Adding templates, architecture, tests | Templates added without UI changes, data model, quality |

## Before recording

1. Start from a clean state, so My documents is empty. This deletes the documents created by earlier test runs:

   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

2. Wait about a minute, until `http://localhost:3000/api/health` shows `"documentServer":"up"`.
3. The first editor load is slow. Do one full rehearsal, then repeat step 1 before the real take.
4. Browser: one window at about 1440×900, zoom 100%, light theme, no other tabs, bookmarks bar hidden.
5. Have ready in other windows: Word (to open the download), VS Code with the repo, and a terminal showing the output of `npm test` and `npm run test:e2e`.

## Opening (0:00–0:20)

**Do:** open `http://localhost:3000`, the Document templates gallery.

**Say:** "This is the Office Template Library, a library of document and presentation templates for an office app. To show how it works, I'll play someone with two jobs today: send an invoice to a new client, and prepare the quarterly review slides."

**Bridge:** "Let's start with the invoice."

## Job 1: Send an invoice

### 1.1 Find the template (0:20–0:45)

**Do:**

1. Scan the grid. Point at one card: thumbnail, name, description, category.
2. Click the **Finance** chip; only finance templates remain. Click **All**.
3. Type `invoice` in the search box; one card remains. Point at `?q=invoice` in the address bar.

**Say:** "Each template is a card with a preview image, a name, a description and a category. I can filter by category or just type. The filters live in the URL, so a colleague I send the link to sees exactly what I see."

**Bridge:** "Before using it, I want to see what it looks like."

### 1.2 Preview (0:45–1:00)

**Do:** click the **Invoice** card. The preview dialog opens. Point at the sample client `Sunrise Retail Co., Ltd.` and the services table.

**Say:** "The preview shows the whole template. ONLYOFFICE renders these images itself, so they match what I'll see in the editor. It already has the services table, VAT and the total, which is what I need."

**Bridge:** "I'll click Use template."

### 1.3 Create a copy and edit it (1:00–1:50)

**Do:**

1. Click **Use template**. The editor opens. Point at the **v1** badge in the header.
2. Under "Bill to", replace `Sunrise Retail Co., Ltd.` with the new client's name.
3. Add a note line and make it **bold**.
4. Click **Done**.

**Say:** "Use template makes a copy of the template, checks its checksum to be sure it's identical, and opens the copy in ONLYOFFICE, inside the app. I change the client and add a bold note. I'm editing my own copy, not the template. When I'm finished, I click Done."

**Bridge:** "Done takes me to my documents."

### 1.4 Save and download (1:50–2:30)

**Do:**

1. My documents opens. After a few seconds the Invoice row shows **Version 2** and "just now".
2. Click **Download** and open the file in Word. Point at the new client, the bold note, the tables and the total.

**Say:** "When the editor closes, ONLYOFFICE sends the edited file to the server, which stores it as version 2. I download it and open it in Word. The new client and the bold note are there, and the template's tables, headings and formatting are intact. It's ready to send."

**Bridge:** "One important question: did the template change?"

### 1.5 The template is unchanged (2:30–2:45)

**Do:** click **Documents** in the top bar and open the **Invoice** preview. It still shows `Sunrise Retail Co., Ltd.`

**Say:** "The template is exactly as it was, so the next colleague gets a clean copy. Template files are stored read-only, every save writes a new file, and the tests compare the template's checksum before and after."

**Bridge:** "That's the first job done. Now the quarterly slides."

## Job 2: Quarterly review slides

### 2.1 Pick and preview a presentation (2:45–3:10)

**Do:**

1. Press Escape, then click **Presentations** in the top bar.
2. Open **Quarterly Business Review**. Page through a few slides with the right arrow key and click one in the filmstrip.

**Say:** "The presentation library works the same way. The preview lets me page through every slide, with the keyboard or the filmstrip. This one has the summary, the numbers and the plan."

**Bridge:** "I'll use this one."

### 2.2 Create and edit (3:10–3:35)

**Do:** click **Use template**. Change the subtitle on slide 1 to your quarter. Click **Done**.

**Say:** "Same flow: copy, edit in ONLYOFFICE, Done. Documents and presentations share one engine. DOCX and PPTX are two entries in a registry, so adding Excel later is one more entry."

**Bridge:** "Now my list has a few files in it."

### 2.3 Find a file again (3:35–3:55)

**Do:**

1. In My documents, point at the two new documents.
2. Click the **Presentations** filter, then **All**. Type `invoice` in the search box.
3. Change it to `zzz`; the empty state appears. Click **Clear filters**.

**Say:** "As the list grows, I can filter by type or search by name. A wrong search says clearly that nothing matches, and offers to clear the filters. To keep editing a file, I click Open."

**Bridge:** "That's the main flow. A few details next."

## Details (3:55–4:25)

**Do**, without stopping:

1. Switch to the dark theme with the toggle, then back.
2. Open DevTools and switch to a phone viewport. Show the gallery and a preview. Close DevTools.
3. Type `localhost:3000/documents/00000000-0000-0000-0000-000000000000/edit` in the address bar. The page shows **Document not found**, with a link back to My documents. Click it.

**Say:** "There are light and dark themes, and the app works on a phone. An old link to a document that no longer exists gets a clear explanation and a way back. Every screen has loading, error and not-found states."

**Bridge:** "Finally, what's behind it."

## Behind the app (4:25–5:15)

### Adding a template without UI changes

**Do:** switch to VS Code, open `templates/manifest.json` and point at one entry.

**Say:** "Templates are declared in this manifest. To add one, I copy the file into the templates folder, add an entry here, render its previews and restart the app. No UI code changes. Replacing a file creates a new revision. Removing an entry archives the template, and documents made from it keep working."

### Architecture and tests

**Do:** open the README on GitHub and show the architecture diagram. Switch to the terminal: `npm test` (20 passed) and `npm run test:e2e` (14 passed).

**Say:** "The Express API and the React app run in one container, with ONLYOFFICE Document Server in its own container beside it. Inside, three modules, catalog, workspace and editor, talk to each other through ports. There are 20 API tests, and Playwright end-to-end tests replay the flow I just showed against the real editor: edit, save, download and check the contents."

## Close (5:15–5:30)

**Do:** return to the browser, on the gallery.

**Say:** "Everything runs with one command, `docker compose up`. The README covers setup, architecture, the API, limits, third-party licenses, and how I used AI. Thanks for watching."

## Tips

- Say the **Bridge** line while you click through to the next screen, so there are no silences.
- Saving takes a few seconds after **Done**. If version 2 isn't there yet, keep talking; the list refreshes on its own for 30 seconds.
- If the editor shows "The editor is unavailable", Document Server is still starting. Wait, then click **Retry**.
- When editing the video, cut the waits for the editor to load.
