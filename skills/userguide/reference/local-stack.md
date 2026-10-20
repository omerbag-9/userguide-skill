# Running the product locally and capturing it

Lessons from real runs. Read this before step 2 of SKILL.md.

## Bring the stack up
- Read the README, docker-compose files, `.env.example` and the env validation code (Joi/zod/envalid) to learn what is required.
- **Database and cache:**
  - Prefer locally installed Postgres/MySQL/Redis (`pg_ctlcluster 16 main start`, `redis-server --daemonize yes`) over Docker when both exist; it's faster and has fewer moving parts.
  - Create a dedicated database for the guide.
- **Env files:**
  - Copy `.env.example` to the git-ignored env file (`.env`, `.env.local`). Confirm it is ignored (`git check-ignore`) before writing.
  - Never commit env files.
- **Placeholder values:** apps often refuse to boot on placeholders. Generate real secrets (`openssl rand -base64 32`) for JWT and encryption keys, and use valid-looking emails.
- **Debug flags:** turn on any flag that returns one-time codes, invite links or reset tokens in API responses when email is not configured (look for flags such as a debug or dev-mode switch for auth codes, a log or console mail driver, or a mail catcher). Grep the mail and auth services for how codes are exposed in development.
- **Data:** run the migrations and every seed script. Catalogue and reference data usually lives in seeds.
- **Frontend in production mode:** build and start the frontend in production mode (`next build && next start`, `vite build && vite preview`, …). Dev servers add badges, overlays and slower pages, and some (`next dev`) rewrite tracked files such as AGENTS.md. Check `git status` in every repo before finishing and revert anything the tooling changed.
- **Restarting servers:** keep long-running servers in the background with a pidfile, and restart through a small script. Never `pkill -f <pattern>` from the same shell command line that contains that pattern; it matches and kills its own shell.

## Third-party services
Payment widgets, couriers, SMS, maps and similar services block flows locally. Keep the real application code in the loop:
1. Read the client code for the service: base URL env var, endpoints, request body and the response fields the code actually reads.
2. Write a tiny local mock with Node's `http` module. It should answer those endpoints with plausible data, keep state in memory (for example "a transaction exists for this invoice once initialised"), and log each request. Point the app's base-URL env var at it and restart the backend.
3. For browser-side widgets (hosted payment forms, embedded widgets loaded from another domain), use `routeScript()` from `capture.mjs`:
   - serve a stand-in script that draws a simple, clearly generic form
   - expose a function your capture script calls to post the same success message the real widget posts (read the frontend's message parser for the exact shape)
4. Webhooks: if settlement normally arrives by webhook, check whether the app also reconciles by polling (status endpoints often re-check after N seconds) before building a signed webhook sender.
5. Caption every screenshot that shows a stand-in, and mention it in the welcome page's "About the screens" note.

## Creating the sample data
- **Go through the real UI where you can.** It exercises the flows you are documenting and gives you their screenshots. Use the API (with the session cookie from a curl login) only for setup the UI can't do, for example fetching a debug invite link.
- **Story:**
  - one protagonist organisation and person, with a realistic name and address in the right country
  - two to four other organisations in different states (pending, approved, denied, suspended)
  - a person in every role
  - realistic domain records (customers, products, projects …)
  - several core transactions taken through every status: accepted, denied, cancelled, completed
- **Rate limits:** endpoints such as invites or codes often allow ~5 a minute. Space those calls out, or do other captures while you wait.
- **Read the response:** if a UI action reports a partial failure (for example "saved but email not sent"), fetch the debug link from the API response instead of retrying.

## Capturing
- Write small capture scripts per area that import `scripts/capture.mjs` by absolute path. Run them with `node script.mjs` from a folder where `playwright` resolves (the project, or the global npm root that `capture.mjs` finds itself).
- If no Chromium is installed, run `npx playwright install chromium`, or set `CHROMIUM_PATH` to an existing binary.
- **Exploring a screen:** before scripting a form, dump it once:
  ```js
  await page.locator('main').locator('input,select,textarea,button').evaluateAll(a => a.map(e => `${e.tagName} ${e.type} ${e.placeholder} ${e.textContent.trim().slice(0,30)}`))
  ```
  Also print `innerText` of `main` or `[role=dialog]`. This gives the exact labels for both the script and the guide's wording.
- **Locators:** prefer placeholder, role and name, and visible text. Dialogs are `[role=dialog]` or `[role=alertdialog]`; menus are `[role=menu]` and `[role=menuitem]`.
- **Common traps:**
  - autocomplete dropdowns cover buttons: click the dialog heading to close them, not Escape, which may close the dialog
  - a button may be pre-selected, so its accessible name changes ("Approver: Jane Doe")
  - placeholders may mirror sibling values, so use positional inputs when needed
  - catalogue cards often need a "View" button rather than a click on the text
- **What to capture:**
  - empty states and populated states
  - each validation error that matters, and each blocked sign-in
  - every confirmation dialog
  - the result after each action, including its toast
  - full-page captures for long forms and detail pages
- Hide dev-only banners (for example a "development build" notice that prints a one-time code) with `hideText()` before the shot.
- **Review:** after each area, run `scripts/contact_sheet.sh` and look at the sheet. Re-shoot blank, wrong, duplicate or empty frames. If a list page is empty, create content (a webinar, a table, a staff member) and re-shoot it.
- Keep raw shots in a scratch folder outside the repos. `build.py` copies only the ones the pages use.
