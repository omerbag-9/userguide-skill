"""Content helpers for a stakeholder tour. A content file does `from guidekit import *`.

Text arguments accept two shorthands:
  [[Label]]  -> <span class="g-ui">Label</span>   (a control, named exactly as on screen)
  **bold**   -> <strong>bold</strong>

A content file defines SITE, NAV and calls page() for every page. See
reference/example_content.py for a worked example.
"""
import html
import re

__all__ = [
    "PAGES", "page", "t", "p", "note", "route", "steps", "shot", "shots", "reacts", "stop",
    "h2", "table", "cards", "roles", "journey", "deflist", "checklist", "how_stops_work",
]

PAGES = []  # (id, kicker, title, lede, body, nav_title)


def t(text):
    """Escape, then expand the [[ui]] and **bold** shorthands."""
    out = html.escape(text or "", quote=False)
    out = re.sub(r"\[\[(.+?)\]\]", r'<span class="g-ui">\1</span>', out)
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out)


def p(text):
    return f"<p>{t(text)}</p>"


def note(label, text, kind="tip"):
    """kind: tip | warn | info | danger."""
    return f'<div class="g-note" data-kind="{kind}"><span class="g-note-label">{t(label)}</span><p>{t(text)}</p></div>'


def route(*pairs):
    """route(("Sign in as", "Role"), ("Go to", "[[Menu]]"), ("Then", "What to try"))"""
    items = "".join(f"<div><dt>{t(a)}</dt><dd>{t(b)}</dd></div>" for a, b in pairs)
    return f'<dl class="t-route">{items}</dl>'


def steps(items):
    """Each item is "Title" or ("Title", "Detail" | None)."""
    lis = []
    for item in items:
        title, body = (item, None) if isinstance(item, str) else item
        inner = f'<span class="g-step-title">{t(title)}</span>'
        if body:
            inner += f"<p>{t(body)}</p>"
        lis.append(f"<li>{inner}</li>")
    return f'<ol class="g-steps">{"".join(lis)}</ol>'


def shot(file, bold, rest="", size=None):
    """file is the screenshot name without .png; size="narrow" for small dialogs."""
    rest = rest or ""
    alt = html.escape(f"{bold} {rest}".strip(), quote=True)
    cap = f"<strong>{t(bold)}</strong> {t(rest)}".strip()
    size_attr = f' data-size="{size}"' if size else ""
    return (
        f'<figure class="t-shot"{size_attr}><img src="shots/{file}.png" alt="{alt}" loading="lazy" />'
        f"<figcaption>{cap}</figcaption></figure>"
    )


def shots(items):
    return '<div class="t-shots">' + "".join(shot(*i) for i in items) + "</div>"


def reacts(items):
    """Each item is ("When…", "Then…") or ("When…", "Then…", "guard") for blocks and refusals."""
    lis = []
    for item in items:
        kind = f' data-kind="{item[2]}"' if len(item) > 2 else ""
        lis.append(f'<li{kind}><span class="t-when">{t(item[0])}</span><span class="t-then">{t(item[1])}</span></li>')
    return f'<ul class="t-reacts">{"".join(lis)}</ul>'


def stop(hid, heading, rt, st, sh, re_items, re_shots=None):
    """One tour stop: <h2>, route, then the Steps / What you'll see / How the system reacts tabs.

    hid       anchor id (other pages link to page.html#hid)
    rt        list of (label, value) pairs for the route box
    st        steps() items
    sh        shots() items for "What you'll see" ([] if there is no screen)
    re_items  reacts() items for "How the system reacts"
    re_shots  optional shots() items shown under the reactions (error states, results)
    """
    see = shots(sh) if sh else p("This step has no screen of its own.")
    react = reacts(re_items) + (shots(re_shots) if re_shots else "")
    return (
        f'<h2 id="{hid}">{t(heading)}</h2>\n'
        + route(*rt)
        + '<div class="t-tabs"><div class="t-tablist"><button>Steps</button><button>What you\'ll see</button>'
        + "<button>How the system reacts</button></div>"
        + f'<div class="t-panel">{steps(st)}</div><div class="t-panel">{see}</div><div class="t-panel">{react}</div></div>\n'
    )


def h2(hid, text):
    return f'<h2 id="{hid}">{t(text)}</h2>'


def table(head, rows, stack=True):
    """First cell of each row becomes the row heading (and the card title on phones)."""
    th = "".join(f"<th>{t(h)}</th>" for h in head)
    body = ""
    for r in rows:
        cells = f'<th scope="row">{t(r[0])}</th>' + "".join(f"<td>{t(c)}</td>" for c in r[1:])
        body += f"<tr>{cells}</tr>"
    attr = " data-stack" if stack else ""
    return f'<div class="g-tablewrap"{attr}><table><thead><tr>{th}</tr></thead><tbody>{body}</tbody></table></div>'


def cards(items, cols=2):
    """items: (href, title, description)."""
    out = "".join(
        f'<a class="g-cardlink" href="{href}"><span class="g-cardlink-title">{t(title)}</span>'
        f'<span class="g-cardlink-desc">{t(desc)}</span><span class="g-cardlink-more">Start this stop →</span></a>'
        for href, title, desc in items
    )
    return f'<div class="g-grid" data-cols="{cols}">{out}</div>'


def roles(items, cols=3):
    """items: (role name, what they do, href, link text)."""
    out = "".join(
        f'<div class="t-role"><h3>{t(name)}</h3><p>{t(desc)}</p><a href="{href}">{t(link)} →</a></div>'
        for name, desc, href, link in items
    )
    return f'<div class="g-grid" data-cols="{cols}">{out}</div>'


def journey(items):
    """Numbered story steps: (title, text, href or None, link text or None)."""
    lis = []
    for title, text, href, link in items:
        a = f' <a href="{href}">{t(link)}</a>' if href else ""
        lis.append(f'<li><span class="g-step-title">{t(title)}</span><p>{t(text)}{a}</p></li>')
    return f'<ol class="g-steps">{"".join(lis)}</ol>'


def deflist(items):
    return '<dl class="g-deflist">' + "".join(f"<dt>{t(a)}</dt><dd>{t(b)}</dd>" for a, b in items) + "</dl>"


def how_stops_work():
    """The standard "How each stop works" section for the welcome page."""
    return (
        h2("how-to-read", "How each stop works")
        + route(("Sign in as", "The role to use"), ("Go to", "Where to click in the menu"), ("Then", "What to try"))
        + p("Under each route, three tabs:")
        + deflist([
            ("Steps", "What to do, click by click, in the words the screen uses."),
            ("What you'll see", "The real screen, captured from the system. Click any screenshot to open it full size."),
            ("How the system reacts", "What happens when you act: what it saves, warns about, blocks, emails or passes on to someone else. This is where the business rules show."),
        ])
    )


def checklist(groups, closing_note=None):
    """groups: (anchor id, heading, [(check id, text, "page.html#anchor"), ...])."""
    out = [
        p("Tick each stop as you try it on the test site. Your ticks are kept in this browser only, so you can come back later and carry on."),
        '<div class="t-progress"><span class="t-progress-label">0 stops completed</span><div class="t-progress-bar"><span></span></div>'
        '<button type="button" class="g-iconbtn" data-check-reset>Reset</button></div>',
    ]
    for hid, heading, items in groups:
        lis = "".join(
            f'<li><label><input type="checkbox" data-id="{cid}" /><span>{t(text)} <a href="{href}">How →</a></span></label></li>'
            for cid, text, href in items
        )
        out.append(f'<h2 id="{hid}">{t(heading)}</h2><ul class="t-check">{lis}</ul>')
    if closing_note:
        out.append(note(*closing_note))
    return "\n".join(out)


def page(pid, kicker, title, lede, body, nav_title=None):
    """Register a page. pid "index" is the welcome page. nav_title shortens the sidebar label."""
    PAGES.append((pid, kicker, title, lede, body, nav_title or title))
