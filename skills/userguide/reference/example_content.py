"""Worked example: a small tour for "Brightdesk", a fictional desk-booking app.

It shows the shape of a content file and the tone of the writing. Copy the
patterns, not the words: every project gets its own pages, roles, flows and
rules, read from its own code and captured from its own screens.

The screenshot names below (b-…) are illustrative. A real guide uses the shots
you captured; build.py stops with "missing screenshot" for any that don't exist.
"""
from guidekit import *  # noqa: F403

SITE = {
    "id": "brightdesk",                # short; prefixes this guide's browser storage keys
    "product": "Brightdesk",
    "captured": "March 3, 2026",
    # Say plainly where the screens came from and that the data is made up.
    "footer": "Screens were captured from a local build of Brightdesk on March 3, 2026. "
              "Companies, people and bookings are sample data.",
    "brand": {
        "primary": "#24324a",          # the product's dark brand colour (from its theme or globals CSS)
        "accent": "#e8833a",           # its highlight / button colour
        # "logo": "logo.png",          # relative to this file; without it the product name is shown
        "body_font": "'Source Sans 3', -apple-system, 'Segoe UI', sans-serif",
        "heading_font": "Fraunces, Georgia, serif",
        "fonts_url": "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600"
                     "&family=Source+Sans+3:wght@400;600;700&display=swap",
    },
}

# Reading order. A full guide usually has 15–25 pages, e.g.
#   Start here (index, sign-in) · Onboarding · one group per app or area ·
#   Reference (rules, not-yet, checklist)
NAV = [
    ("Start here", ["index"]),
    ("Member app", ["booking"]),
    ("Reference", ["rules", "not-yet", "checklist"]),
]

# ── Welcome page ───────────────────────────────────────────────────────────

page(
    "index",
    "Stakeholder tour",
    "Welcome to the Brightdesk tour",
    "A guided walk through Brightdesk, one person and one screen at a time. Read it, or sign in and follow along.",
    "\n".join([
        p("Brightdesk is how companies share office space. Members book a desk or a meeting room for the day, "
          "team admins manage who can book what, and space managers run the floors and approve the bookings that "
          "need approval."),
        p("Every stop tells you **who to sign in as**, **where to go** and **what to do**, with screens from the "
          "current version of the system. You can read it straight through, or sign in to the test site and follow along."),
        how_stops_work(),
        h2("roles", "The people who use Brightdesk"),
        roles([
            ("Member", "Books desks and rooms for themselves, checks in on the day, and cancels plans that change.",
             "booking.html", "Book a desk"),
            ("Team Admin", "Manages their team's members and booking limits.", "rules.html#limits", "Booking limits"),
            ("Space Manager", "Runs the floors and approves bookings for restricted rooms.",
             "booking.html#approval", "Approving a booking"),
        ]),
        h2("journey", "The journey of one booking"),
        journey([
            ("A member books", "They pick a day, a floor and a desk. Most desks are confirmed straight away.",
             "booking.html#choose", "Booking a desk"),
            ("A manager approves, where needed", "Restricted rooms wait for a Space Manager.",
             "booking.html#approval", "Approving a booking"),
            ("The member checks in", "A booking not checked in by 10:00 is released for others.",
             "rules.html#limits", "Time limits"),
        ]),
        h2("start", "Where to start"),
        cards([
            ("booking.html", "Booking a desk", "The core of the app: choose, confirm, and what happens next."),
            ("rules.html", "Statuses, emails and rules", "Every status, email and time limit on one page."),
            ("not-yet.html", "Not in this version yet", "Things the screens mention that don't work yet."),
            ("checklist.html", "Tour checklist", "Tick off each stop as you try it yourself."),
        ]),
        note("About the screens", "All screenshots come from a local build of the current code. People, companies "
             "and bookings are sample data. Calendar invitations were simulated, because they need a live "
             "calendar account."),
    ]),
    nav_title="Welcome to the tour",
)

# ── A feature page: the core transaction, one stop per step ────────────────

page(
    "booking",
    "Member app",
    "Booking a desk",
    "Choosing a day and a desk, confirming it, and what happens when a booking needs approval.",
    "\n".join([
        p("The walkthrough follows **Sam Okoye** from Northwind Design booking a desk on the third floor for Thursday."),
        note("Try it", "Sign in as a member and select Book a desk. Nothing is reserved until you confirm."),
        stop("choose", "Step 1: Choose a day and a desk",
             [("Sign in as", "Member"), ("Go to", "[[Book a desk]]"), ("Then", "Pick Thursday, floor 3")],
             [("Pick the day", "The calendar shows how full each day already is."),
              ("Pick a floor", "The floor plan shows free desks in white and booked desks in grey."),
              ("Select a free desk", "Its details open on the right: monitor, standing desk, nearby rooms."),
              ("Select [[Continue]]", None)],
             [("b-floor-plan", "The floor plan", "for Thursday, with free and booked desks."),
              ("b-desk-details", "A desk's details.", None)],
             [("The desk was just taken by someone else", "\"This desk is no longer free. Pick another one.\" "
               "The plan refreshes.", "guard"),
              ("The member already has a booking that day", "\"You already have a desk on Thursday.\" "
               "One desk per person per day.", "guard"),
              ("The day is more than 14 days away", "It cannot be selected; bookings open 14 days ahead.", "guard")]),
        stop("confirm", "Step 2: Confirm",
             [("Sign in as", "Member"), ("Go to", "Booking step 2")],
             [("Check the summary", "Day, floor, desk and check-in deadline."),
              ("Select [[Confirm booking]]", None)],
             [("b-confirm", "Confirm booking.", "The check-in deadline is shown before you commit.")],
             [("The booking is confirmed", "Status **Confirmed**. The member is emailed \"Your desk for Thursday\" "
               "with a calendar invitation."),
              ("The team is over its weekly limit", "\"Your team has used all its desk days this week.\" "
               "Team Admins set the limit.", "guard")],
             [("b-confirmed", "Confirmed,", "with the desk and deadline.")]),
        stop("approval", "Approving a booking",
             [("Sign in as", "Space Manager"), ("Go to", "[[Approvals]]"), ("Then", "Approve or decline")],
             [("Open [[Approvals]]", "Bookings for restricted rooms wait here, oldest first."),
              ("Select [[Approve]] or [[Decline]]", "Declining asks for a reason, which the member sees.")],
             [("b-approvals", "Approvals", "waiting for a Space Manager.")],
             [("A booking is approved", "Status **Confirmed** and the member is emailed."),
              ("A booking is declined", "Status **Declined** with the reason. The member is emailed "
               "\"Your booking was declined\"."),
              ("Nobody acts within 24 hours", "The request expires and the room is released.", "guard")]),
    ]),
)

# ── Reference ──────────────────────────────────────────────────────────────

page(
    "rules",
    "Reference",
    "Statuses, emails and rules",
    "Every status, automatic email and time limit in one place.",
    "\n".join([
        h2("statuses", "Booking statuses"),
        table(["Status", "Means", "Who moves it on"], [
            ["Requested", "Waiting for a Space Manager (restricted rooms only)", "Space Manager approves or declines"],
            ["Confirmed", "Reserved for the member", "Member checks in or cancels"],
            ["Checked in", "The member arrived", "Final"],
            ["Released", "Not checked in by the deadline", "Final"],
            ["Declined", "Refused by a Space Manager, with a reason", "Final"],
            ["Cancelled", "Cancelled by the member", "Final"],
        ]),
        h2("emails", "Automatic emails"),
        table(["When", "Who gets it", "Subject"], [
            ["A booking is confirmed", "The member", "Your desk for {day}"],
            ["A booking is declined", "The member", "Your booking was declined"],
            ["A booking is released", "The member", "Your desk was released"],
        ]),
        note("No email for these", "A member cancelling their own booking does not send an email.", "warn"),
        h2("limits", "Time limits"),
        table(["What", "How long"], [
            ["Booking window", "Up to 14 days ahead"],
            ["Check-in deadline", "10:00 on the day"],
            ["Approval request", "Expires after 24 hours"],
        ]),
    ]),
)

page(
    "not-yet",
    "Reference",
    "Not in this version yet",
    "Things the screens mention that do not work yet, so nobody is caught out in a demo.",
    table(["Item", "What you will notice", "Status"], [
        ["Recurring bookings", "The \"Repeat weekly\" switch is shown but does nothing.", "Not wired"],
        ["Usage reports", "The Reports menu item opens an empty page.", "Not built"],
    ]),
)

page(
    "checklist",
    "Reference",
    "Tour checklist",
    "Every stop in the tour as a checklist, to try yourself on the test site.",
    checklist(
        [
            ("member", "Member", [
                ("book", "Book a desk for a day next week.", "booking.html#choose"),
                ("double", "Try to book a second desk on the same day.", "booking.html#choose"),
            ]),
            ("manager", "Space Manager", [
                ("approve", "Approve a request for a restricted room.", "booking.html#approval"),
            ]),
        ],
        ("A note on the test site", "The test site is shared. Saving creates test records that others will see.", "warn"),
    ),
)
