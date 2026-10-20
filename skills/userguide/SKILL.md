---
name: userguide
description: Build a complete stakeholder tour (user guide) for the current project. A static multi-page HTML site with real screenshots captured from the running app, a route + Steps / What you'll see / How the system reacts layout for every task, business rules, a reference page and a checklist, branded to the product. Use when the user asks for a user guide, product tour, walkthrough, onboarding guide, stakeholder guide or demo guide for a codebase, or types /userguide.
---

# Stakeholder tour builder

Produces `userguide/` (plus a zip, and a private artifact page when available) that
non-technical readers can browse from `file://`. Pages look identical across
projects; only the brand colours, fonts, logo and content change.

`${CLAUDE_SKILL_DIR}` below is the directory containing this SKILL.md (Claude Code fills it in; in other tools, use that directory's path). Everything here is
yours to run; work end to end, and ask the user only when something truly cannot
be worked out from the code. Name the stakeholders' product in the user's words.

## What is fixed and what you write
- **Fixed (never edit per project):** `assets/` (guide.css, tour.css, guide.js, tour.js, boot.js) and `scripts/`.
- **You write one content file**, `guide_content.py`, in a scratch folder outside the repos. It holds:
  - `SITE`: id, product, capture date, footer, brand colours, fonts and logo
  - `NAV`: groups and page ids in reading order
  - one `page(...)` call per page, built from the `guidekit` helpers
- **`scripts/build.py`** turns that file plus a folder of screenshots into the site. It generates `brand.css` and `site.js`, renders every page, and fails on missing pages, screenshots or link anchors.

Read `reference/example_content.py` (a trimmed real guide) and `reference/writing.md` (page plan, writing rules, helper cheat sheet) before writing content. Read `reference/local-stack.md` before running the app.

## Workflow

### 1. Understand the product (read-only)
- Read the READMEs, AGENTS.md/CLAUDE.md, routes and pages, nav/sidebar configs, role and permission definitions, and backend services, in every repo of the session.
- Delegate a **very thorough** read-only exploration to a subagent if you can. Ask it for a functional map written for non-technical readers, quoting **exact UI strings** (labels, headings, statuses, validation and error messages). The map should cover:
  - roles: what each sees and can do, and where each lands after sign-in
  - public pages
  - every main flow, step by step
  - status machines
  - automatic emails (with subjects) and in-app notifications
  - time limits, money, tax and shipping rules, and what the backend blocks
  - a list of anything stubbed, unwired, server-only or inconsistent
- From the frontend, collect:
  - the product name
  - the primary (dark brand) and accent colours, from the theme, tailwind or globals CSS
  - the body and heading fonts, as a Google Fonts URL when they are Google fonts
  - a logo file, usually in `public/` (`convert logo.png -resize 360x logo.png` if huge)

### 2. Run it locally with a believable story
Follow `reference/local-stack.md`. In short:
- Run the database and cache locally, the migrations and seeds, the backend, and a **production build** of the frontend.
- Turn on debug flags that expose codes and invite links.
- Put local mocks behind third-party services (payments, couriers, SMS).
- Create the sample data **through the real UI**: one protagonist organisation and person, other organisations in different states, a person in every role, and the core transaction taken through every status.

### 3. Capture screenshots
- Write per-area capture scripts that import `${CLAUDE_SKILL_DIR}/scripts/capture.mjs` (`open`, `settle`, `shot`, `hideText`, `routeScript`).
- Use a 1440×900 viewport, and `{ full: true }` for long pages.
- Name files `<area>-<thing>`, for example `p-checkout-step1`, `a-order-accept-dialog`, `pub-landing`.
- Capture empty and populated states, validation errors, blocked sign-ins, every confirmation dialog, and the result after each action.
- Review each batch with `bash ${CLAUDE_SKILL_DIR}/scripts/contact_sheet.sh <shots> <sheet.png> '<glob>'`, then look at the image. Re-shoot anything blank, wrong or empty.

### 4. Write the content file
Follow `reference/writing.md` exactly:
- page plan: Start here → Onboarding → one group per app or area → Reference (rules, not-yet, checklist)
- every task is a `stop()` with route, steps, screenshots and reactions
- "How the system reacts" carries the business rules
- quote exact labels inside `[[ ]]`
- never present stubbed features as working: they go on the `not-yet` page

### 5. Build, compress, verify
```bash
python3 -I ${CLAUDE_SKILL_DIR}/scripts/build.py --content guide_content.py --shots <shots> --out <out>/userguide
bash ${CLAUDE_SKILL_DIR}/scripts/compress.sh <out>/userguide/shots
node ${CLAUDE_SKILL_DIR}/scripts/verify.mjs <out>/userguide <out>/guide-review
```
- Fix every build error and every verify problem, then rebuild.
- Look at the review screenshots: welcome page and busiest page, light and dark, desktop and 390px.
- Compress after build. Build copies from the raw shots folder, so re-run compress after each rebuild.

### 6. Deliver
- **Zip:** `cd <out> && zip -qr <project>-userguide.zip userguide`, then send the zip to the user (SendUserFile, or name its path).
- **Artifact:** if an Artifact tool is available, publish a private multi-file artifact:
  1. Load its design skill if the tool requires that.
  2. Run `python3 -I ${CLAUDE_SKILL_DIR}/scripts/prepare_artifact.py <out>/userguide <out>/pub`.
  3. Publish `<out>/pub/main.html` with `root` = `<out>/pub` and `files` = the list in `<out>/pub/files.json`, plus a one-line description and icon `guide`.
- **No commits:** do not commit the guide into any repo unless the user asks. App lint presets often reject static HTML, and excluding a folder from lint usually needs their approval.
- **Clean up:** check `git status` in every repo and revert side effects such as dev servers rewriting files. Leave env files ignored and uncommitted.
- **Report briefly:**
  - the page list
  - how the screens were made and what was simulated
  - what the user must fill in (test-site URL, accounts, passwords)
  - the not-yet items worth reviewing
  - anything you could not capture

## Quality bar
- Every page passes build validation, and `verify.mjs` reports no problems.
- Every stop has at least one real screenshot, unless the step truly has no screen.
- Every reaction that blocks something quotes the exact message and is marked `"guard"`.
- Emails name their subject, and time limits and fees are exact numbers from the code.
- The guide reads as plain English for a non-developer: no code identifiers, file paths or HTTP talk.
