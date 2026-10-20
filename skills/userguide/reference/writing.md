# Page plan and writing rules

## Who reads this
Stakeholders, clients, new staff and testers. They are not developers. They want to
know what the system does, who does what, and what happens when they click. They
may read it straight through or sign in to the test site and follow along.

## Page plan (aim for 15–25 pages)
Group pages in the sidebar in this order. Page ids are short kebab-case; titles are
plain-English tasks.

1. **Start here**
   - `index`: Welcome to the {Product} tour. Contains:
     - one paragraph on what the product is and who uses it
     - `how_stops_work()`
     - "The people who use {Product}" as `roles()` cards, one per role, each linking to its best page
     - "The journey of one {core thing}" as `journey()` steps across the whole system, each linking to its page
     - "Where to start" `cards()`
     - an "About the screens" `note()`: where the screens came from, the date, that the data is sample data, and what was simulated
   - `sign-in`: Signing in and getting around. Contains:
     - an accounts `table()`: Role | Sign in at | Sample account in these screens | Lands on
     - a warn `note()` telling readers to get the real test-site URL, accounts and passwords from the project team
     - a stop per sign-in page, with wrong-password and blocked-account reactions
     - a stop for "The frame around every page": menu, header, bell, account menu, what each role cannot open
2. **Onboarding**, if the product has one: sign-up, verification, approval.
3. **One group per app or area** (portal, admin console, mobile app, …). Use one page per feature, in the order a user meets them. Follow **one sample protagonist** (an organisation and a person) through the core transaction, and name them in the page intro.
4. **Reference**
   - `rules`: Statuses, emails and rules, as tables:
     - status tables (Status | Means | who moves it on)
     - automatic emails (When | Who gets it | Subject)
     - time limits
     - money, tax and other rules
     - a warn note listing events that do NOT send email
   - `not-yet`: Not in this version yet. One table of everything stubbed, unwired, server-only, inconsistent or misleading (Item | What you will notice | Status). This page protects the people demoing the product.
   - `checklist`: Tour checklist, grouped by role, every item linking to `page.html#stop`.

## A stop
Every feature page is a short intro `p()` (optional `note("Try it", …)`) followed by
one `stop()` per task.
- **Heading:** a task ("Approve a new account", "Step 2: Choose a time").
- **Route:** `Sign in as` (role), `Go to` (menu path using `[[Menu label]]`), and optionally `Then` (what to try).
- **Steps:** click by click, with the exact on-screen words in `[[ ]]`. Put the action in the title and the detail in the text.
- **What you'll see:** 1–4 screenshots. Each caption opens with a bold phrase ending in a period or comma, then one short clause. Prefer real states: filled forms, populated lists, success messages.
- **How the system reacts:** this is where the business rules live. Each item is "When …" / "Then …":
  - what is saved, emailed (with the subject line), notified, charged, released or recalculated
  - who else sees the change
  - which limits apply
  - mark refusals, blocks and validation as `"guard"`, and quote the exact message
  - put screenshots of error or result states under the reactions (`re_shots`)

## Writing rules
- Plain English, active voice, short sentences, from the reader's side of the screen.
- Name things the way the screen does. Quote labels, statuses and messages **exactly** from the source.
- Only describe what you verified in the code or on screen. If something is stubbed, it goes on `not-yet`, never in a stop as if it works.
- State numbers precisely: time limits, fees and thresholds, copied from the code.
- No emoji, no marketing tone, no "simply" or "just".
- Use sample data that sounds real (people, places, records), and keep it consistent across pages.
- If a screenshot shows a stand-in (a mocked payment window, for example), say so in its caption.
- Never put real credentials, secrets or private customer data in the guide.

## Helper cheat sheet (`from guidekit import *`)

| Helper | Use |
|---|---|
| `page(id, kicker, title, lede, body, nav_title=None)` | register a page; `kicker` is the group name; `lede` is one sentence |
| `stop(hid, heading, route_pairs, steps, shots, reacts, re_shots=None)` | one tour stop |
| `p(text)` · `h2(id, text)` · `note(label, text, kind)` | paragraph, section heading, callout (`tip`/`warn`) |
| `table(head, rows, stack=True)` | first cell is the row heading; stacks into cards on phones |
| `roles([(name, desc, href, link)])` · `journey([(title, text, href, link)])` · `cards([(href, title, desc)])` | welcome-page blocks |
| `how_stops_work()` | standard "How each stop works" section |
| `checklist(groups, closing_note)` | the checklist page body |
| `[[Label]]` · `**bold**` | inline shorthands inside any text |

See `example_content.py` for every helper in use.
