"""Free, deterministic extraction of scholarship details from a university page.

Two page shapes are handled:
  * single  - the page IS one scholarship (sections like "Key facts", "Eligibility", "How to apply")
  * listing - the page lists many scholarships, one heading each, followed by "Amount:", "Eligibility:" ...

parse_page() returns a list of dicts (see FIELDS) ready to be matched to database rows.
No network and no paid services: everything is derived from the page structure and wording.
"""
from __future__ import annotations

import html as htmllib
import re
from datetime import date
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from compare import CHROME_HINT, CHROME_TAGS, SOFT_CHROME_TAGS, SOFT_LIMIT, normalize_text
from extract import find_dates, month_num

NAME_WORDS = re.compile(
    r"(scholarship|bursar|award|grant|fellowship|studentship|prize|scheme|stipend|waiver|fund\b|"
    r"excellence|merit|leaders?|chevening|commonwealth)", re.I)
SIGNAL = re.compile(r"(£|€|\$|tuition|eligib|deadline|closing date|apply|amount|value|worth)", re.I)
NOT_A_SCHOLARSHIP_HEADING = re.compile(
    r"^(key facts|summary|overview|eligibility|how to apply|contact|further information|terms|"
    r"related|quick links|main menu|search|footer|filter|featured|in this section|questions|"
    r"application (process|outcome)|selection|timelines?|fees|funding|frequently|faq|share)", re.I)

ROLLING = re.compile(
    r"(no (closing )?deadline|rolling (basis|admission|applications?)|open all year|year[- ]round|"
    r"until further notice|applications? (are )?(accepted|considered) (throughout|all year)|"
    r"ongoing basis|applications? (are )?open (all|throughout))", re.I)
AUTOMATIC = re.compile(
    r"(automatically (considered|awarded|assessed|eligible|applies|apply)|no (separate |additional )?"
    r"application (is )?(required|needed)|you do not need to apply|no need to apply|"
    r"considered automatically|applies automatically)", re.I)
CLOSED = re.compile(
    r"(applications? (are |have )?(now |currently )?closed|(is|are) (now |currently )?closed|"
    r"no longer (accepting|available|open)|not (currently )?(open|accepting)|has now closed|"
    r"closed for (the )?\d{4})", re.I)
VARIES = re.compile(r"(deadlines? (vary|varies|depend)|varies by (programme|course|school|faculty)|"
                    r"see (the )?(individual|programme|course))", re.I)

DEADLINE_CUE = re.compile(
    r"(deadline|closing date|closes?\b|apply by|apply before|applications? (must|close|due)|"
    r"submit(ted)? by|due (date|by)|final date|last date)", re.I)
OPENS_CUE = re.compile(r"(opens?\b|opening date|applications? open)", re.I)

_MON = r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
DAY_MONTH_ONLY = re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+(?:of\s+)?{_MON}\b(?!\.?,?\s+20\d\d)", re.I)

CURRENCY = {"£": "GBP", "€": "EUR", "$": "USD", "US$": "USD", "A$": "AUD", "AU$": "AUD", "C$": "CAD", "CA$": "CAD"}
MONEY = re.compile(
    r"(?P<cur>£|€|US\$|AU\$|CA\$|A\$|C\$|\$|USD|GBP|EUR|AUD|CAD)\s?(?P<num>\d[\d,]*(?:\.\d+)?)\s?(?P<k>[kK]\b)?"
    r"(?P<per>\s?(?:per (?:year|annum|month|semester)|a year|p\.a\.|/year|each year))?")
PERCENT = re.compile(r"\b(\d{1,3})\s?% (?:of )?(?:the )?(?:tuition|fee|fees|discount|off)", re.I)

DEGREE_PATTERNS = [
    ("Undergraduate", re.compile(r"(undergraduate|bachelor|first degree|\bBA\b|\bBSc\b|\bUG\b)", re.I)),
    ("Postgraduate Taught", re.compile(r"(postgraduate taught|taught (postgraduate|master)|master'?s|\bMSc\b|\bMA\b|\bMBA\b|\bLLM\b|\bPGT\b)", re.I)),
    ("PhD / Research", re.compile(r"(\bPhD\b|doctoral|doctorate|research (degree|student)|\bPGR\b|studentship)", re.I)),
]
FIELD_KEYWORDS = [
    ("Engineering", r"engineering"), ("Business", r"(business|\bMBA\b|management|finance|accounting)"),
    ("Law", r"\blaw\b|\bLLM\b"), ("Medicine & Health", r"(medic|health|nursing|pharmac|dental)"),
    ("Science", r"(science|physics|chemistry|biolog|mathematic|computing|computer)"),
    ("Arts & Humanities", r"(\barts?\b|humanities|music|design|film|history|literature)"),
    ("Social Sciences", r"(social science|economics|politic|psychology|sociology)"),
    ("Sport", r"\bsports?\b|athlet"),
]
AWARD_TYPES = [
    ("Full tuition", r"(full tuition|fully[- ]funded|100% (of )?(tuition|fees))"),
    ("Tuition discount", r"(tuition (fee )?(discount|reduction|waiver)|\d+% (of )?(tuition|fee)|fee (discount|reduction|waiver))"),
    ("Living stipend", r"(stipend|living (costs|allowance|expenses)|maintenance)"),
    ("Travel / flights", r"(flights?|travel (grant|costs)|visa)"),
    ("Research funding", r"(studentship|research (grant|funding))"),
    ("Grant / bursary", r"(bursary|grant)"),
]
NATIONALITY = [
    r"international (and EU )?students?", r"overseas students?", r"(home|UK|EU|Scottish|domestic) students?",
    r"commonwealth (citizens|countries|students?)", r"students? from [A-Z][a-zA-Z ]{2,30}",
    r"[A-Z][a-z]+ (nationals|citizens)",
]

FIELDS = ["name", "amount_display", "amount_value", "amount_currency", "deadline_display", "deadline_date",
          "deadline_type", "deadline_inferred", "opens_date", "eligibility", "requirements", "how_to_apply",
          "application_url", "award_type", "number_of_awards", "nationality", "degree_level",
          "field_category", "summary", "confidence"]


def _clean(s: str, limit: int = 700) -> str:
    s = htmllib.unescape(s)
    s = re.sub(r"\s+", " ", s).strip(" :-–• ")
    return s if len(s) <= limit else s[: limit - 1].rsplit(" ", 1)[0] + "…"


# --------------------------------------------------------------------------- structure
def _marked_lines(soup: BeautifulSoup) -> list[tuple[int, str]]:
    """Document as (heading_level|0, text) lines, headings tagged with their level."""
    for tag in soup(CHROME_TAGS):
        tag.decompose()
    for node in soup.find_all(SOFT_CHROME_TAGS) + soup.find_all(attrs={"class": CHROME_HINT}) \
            + soup.find_all(attrs={"id": CHROME_HINT}):
        if node.decomposed or node.name in ("html", "body", "main", "article") or node.find(re.compile(r"^h[1-3]$")):
            continue
        if len(node.get_text(" ", strip=True)) <= SOFT_LIMIT:
            node.decompose()
    root = soup.find("main") or soup.find("article") or soup.body or soup
    for h in root.find_all(re.compile(r"^h[1-4]$")):
        h.insert_before(f"\n§H{h.name[1]}§")
        h.insert_after("\n")
    out: list[tuple[int, str]] = []
    for line in normalize_text(root.get_text("\n", strip=True)).splitlines():
        m = re.match(r"^§H(\d)§\s*(.*)$", line)
        if m:
            if m.group(2):
                out.append((int(m.group(1)), m.group(2).strip()))
            else:
                out.append((-int(m.group(1)), ""))  # heading text follows on next line
        elif out and out[-1][0] < 0:
            out[-1] = (-out[-1][0], line.strip())
        else:
            out.append((0, line.strip()))
    return [(lvl, t) for lvl, t in out if t]


def _sections(lines: list[tuple[int, str]]) -> list[dict]:
    secs: list[dict] = [{"level": 0, "heading": "", "body": []}]
    for lvl, text in lines:
        if lvl:
            secs.append({"level": lvl, "heading": text, "body": []})
        else:
            secs[-1]["body"].append(text)
    return secs


# --------------------------------------------------------------------------- fields
def _label_value(body: list[str], label: re.Pattern) -> str | None:
    """'Amount: £1000' on one line, or 'Amount:' followed by the value on the next line."""
    for i, line in enumerate(body):
        m = re.match(rf"^\s*({label.pattern})\s*[:\-–]\s*(.*)$", line, re.I)
        if m:
            val = m.group(m.lastindex).strip()
            if val:
                return val
            if i + 1 < len(body):
                return body[i + 1]
    return None


def _first_date(text: str, today: date) -> tuple[date | None, bool]:
    """(date, inferred). A day+month without a year is assumed to be the next such date."""
    dates = find_dates(text)
    if dates:
        future = sorted(d for d in dates if d >= today)
        return (future[0] if future else max(dates)), False
    m = DAY_MONTH_ONLY.search(text)
    if m:
        try:
            cand = date(today.year, month_num(m.group(2)), int(m.group(1)))
        except ValueError:
            return None, False
        if cand < today:
            cand = date(today.year + 1, cand.month, cand.day)
        return cand, True
    return None, False


def _deadline(body: list[str], today: date) -> dict:
    text = " ".join(body)
    out: dict = {"deadline_type": None, "deadline_date": None, "deadline_display": None,
                 "deadline_inferred": False, "opens_date": None}
    dates: list[date] = []
    inferred_any = False
    for i, line in enumerate(body):
        if DEADLINE_CUE.search(line) and not re.search(r"(outcome|notified|decision)", line, re.I):
            window = " ".join(body[i:i + 2])
            d, inf = _first_date(window, today)
            if d:
                dates.append(d)
                inferred_any = inferred_any or inf
        if OPENS_CUE.search(line) and out["opens_date"] is None and re.match(r"^\s*(opens?|opening date)\b", line, re.I):
            d, _ = _first_date(" ".join(body[i:i + 2]), today)
            out["opens_date"] = d
    if dates:
        future = sorted(set(d for d in dates if d >= today))
        chosen = future[0] if future else max(dates)
        out.update(deadline_date=chosen, deadline_inferred=inferred_any,
                   deadline_display=f"{chosen.day} {chosen.strftime('%b %Y')}",
                   deadline_type="fixed" if future else "closed")
        if not future:
            out["deadline_display"] += " (passed)"
        elif len(future) > 1:
            out["deadline_display"] += f" (next of {len(future)} rounds)"
        return out
    if CLOSED.search(text):
        out.update(deadline_type="closed", deadline_display="Closed")
    elif AUTOMATIC.search(text):
        out.update(deadline_type="automatic", deadline_display="Automatic, no separate application")
    elif ROLLING.search(text):
        out.update(deadline_type="rolling", deadline_display="Rolling, apply any time")
    elif VARIES.search(text):
        out.update(deadline_type="varies", deadline_display="Varies by programme, see official page")
    return out


def _amount(text: str) -> dict:
    res = {"amount_display": None, "amount_value": None, "amount_currency": None}
    for line in text.split("\n"):
        if not re.search(r"(award|scholarship|bursary|worth|value|amount|tuition|fee|funding|grant|£|€|\$)", line, re.I):
            continue
        m = MONEY.search(line)
        if m:
            num = float(m.group("num").replace(",", ""))
            if m.group("k"):
                num *= 1000
            cur = CURRENCY.get(m.group("cur"), m.group("cur").upper())
            if num >= 50:  # ignore "£5 application fee"-style noise
                res.update(amount_display=_clean(m.group(0), 60).rstrip(",.;"), amount_value=num, amount_currency=cur)
                return res
        p = PERCENT.search(line)
        if p:
            res.update(amount_display=f"{p.group(1)}% of tuition", amount_value=float(p.group(1)),
                       amount_currency="%")
            return res
        if re.search(r"(full tuition|fully[- ]funded)", line, re.I):
            res["amount_display"] = "Full tuition / fully funded"
            return res
    return res


def _section_text(secs: list[dict], heading: re.Pattern, limit: int = 700) -> str | None:
    for s in secs:
        if s["heading"] and heading.search(s["heading"]) and s["body"]:
            return _clean(" ".join(s["body"]), limit)
    return None


def _degree(text: str) -> str | None:
    found = [name for name, pat in DEGREE_PATTERNS if pat.search(text)]
    return ", ".join(found) if found else None


def _build_record(name: str, secs: list[dict], body: list[str], links: list[tuple[str, str]], today: date,
                  url: str) -> dict:
    text = "\n".join(body)
    name = re.sub(r"\s*[,;–|-]\s*(closing date|deadline|closes|apply by)\b.*$", "", name, flags=re.I)
    rec: dict = {"name": _clean(name, 180)}
    rec.update(_deadline(body, today))
    amt = _amount(text)
    if not amt["amount_display"]:
        lv = _label_value(body, re.compile(r"(amount|value|award value|funding)"))
        if lv:
            amt = _amount(lv) if MONEY.search(lv) or PERCENT.search(lv) else {**amt, "amount_display": _clean(lv, 80)}
    rec.update(amt)
    rec["eligibility"] = _section_text(secs, re.compile(r"(eligib|who can apply|criteria|who is it for)", re.I)) \
        or _label_value(body, re.compile(r"(eligibility|who can apply|criteria)"))
    rec["requirements"] = _section_text(secs, re.compile(r"(requirement|supporting documents|what you.?ll need|selection)", re.I))
    rec["how_to_apply"] = _section_text(secs, re.compile(r"(how to apply|application process|apply now|applying)", re.I)) \
        or _label_value(body, re.compile(r"(how to apply|application)"))
    n = re.search(r"(?:number of (?:scholarships|awards|places)[:\s]+([^\n]{1,40}))|(\b\d+|one|two|three|four|five|ten) "
                  r"(?:full |partial )?(?:scholarships|awards|bursaries|places) (?:are |is )?(?:available|offered|awarded)", text, re.I)
    rec["number_of_awards"] = _clean((n.group(1) or n.group(2)), 40) if n else None
    rec["award_type"] = next((label for label, pat in AWARD_TYPES if re.search(pat, text, re.I)), None)
    nat = None
    for pat in NATIONALITY:
        m = re.search(pat, text)
        if m:
            nat = _clean(m.group(0), 80)
            break
    rec["nationality"] = nat
    rec["degree_level"] = _degree(name + " " + text[:1500])
    rec["field_category"] = next((f for f, pat in FIELD_KEYWORDS if re.search(pat, name, re.I)), None)
    apply_link = next((href for txt, href in links if re.search(r"(apply|application|portal|register)", txt, re.I)), None)
    rec["application_url"] = urljoin(url, apply_link) if apply_link else None
    summary_lines = [l for l in body if len(l) > 60 and not DEADLINE_CUE.search(l)]
    rec["summary"] = _clean(summary_lines[0], 400) if summary_lines else None
    core = [rec["deadline_type"], rec["amount_display"], rec["eligibility"], rec["how_to_apply"], rec["degree_level"]]
    rec["confidence"] = round(sum(1 for c in core if c) / len(core), 2)
    return rec


# --------------------------------------------------------------------------- public
def parse_page(html: str, url: str, today: date | None = None) -> list[dict]:
    today = today or date.today()
    soup = BeautifulSoup(html, "lxml")
    page_title = re.split(r"\s[|\-–]\s", (soup.title.string or "") if soup.title else "")[0].strip()
    links = [(a.get_text(" ", strip=True), a["href"]) for a in soup.find_all("a", href=True)
             if a["href"].startswith(("http", "/")) and not a["href"].startswith("//")]
    lines = _marked_lines(soup)
    secs = _sections(lines)

    # Listing page: many same-level headings that look like scholarship names with award signals.
    for level in (3, 2, 4):
        cands = [s for s in secs if s["level"] == level and NAME_WORDS.search(s["heading"])
                 and not NOT_A_SCHOLARSHIP_HEADING.match(s["heading"])
                 and SIGNAL.search(" ".join(s["body"]))]
        if len(cands) >= 3:
            recs = []
            for s in cands:
                if len(re.findall(r"[A-Za-z]", htmllib.unescape(s["heading"]))) < 6:
                    continue
                sub = [t for t in s["body"]]
                recs.append(_build_record(s["heading"], [s], sub, links, today, url) | {"mode": "listing"})
            return recs

    h1 = next((s["heading"] for s in secs if s["level"] == 1 and NAME_WORDS.search(s["heading"])), None)
    name = h1 or page_title or "Scholarship"
    body = [t for _, t in lines]
    return [_build_record(name, secs, body, links, today, url) | {"mode": "single"}]
