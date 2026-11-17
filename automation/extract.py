"""Deterministic extraction of deadline and amount from scholarship page text."""
from __future__ import annotations

import re
from datetime import date

MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august",
     "september", "october", "november", "december"], 1)}


def month_num(name: str) -> int:
    return MONTHS[name.lower()] if name.lower() in MONTHS else \
        [v for k, v in MONTHS.items() if k.startswith(name.lower()[:3])][0]

_MON = r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
# 29 August 2025 / 29th Aug 2025 / August 29, 2025
DATE_DMY = re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+(?:of\s+)?{_MON}\.?,?\s+(20\d{{2}})\b", re.I)
DATE_MDY = re.compile(rf"\b{_MON}\.?\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(20\d{{2}})\b", re.I)
DATE_ISO = re.compile(r"\b(20\d{2})-(\d{2})-(\d{2})\b")

DEADLINE_CUE = re.compile(
    r"(deadline|closing date|closes?|apply (?:by|before)|applications? (?:must|close|due)|"
    r"submit(?:ted)? by|due (?:date|by)|final date)", re.I)

AMOUNT = re.compile(
    r"((?:£|€|\$|US\$|A\$|AU\$|C\$|CA\$|USD|GBP|EUR|AUD|CAD)\s?\d[\d,]*(?:\.\d+)?(?:\s?[kK]\b)?"
    r"(?:\s?(?:per (?:year|annum|month)|a year|p\.a\.|/year|off tuition))?"
    r"|\b\d{1,3}\s?% (?:of )?(?:tuition|fee|fees|discount)"
    r"|\bfull tuition(?: fee)?s?(?: waiver)?|\bfully[- ]funded)", re.I)


def _mk(y: int, m: int, d: int) -> date | None:
    try:
        return date(y, m, d)
    except ValueError:
        return None


def find_dates(line: str) -> list[date]:
    out: list[date] = []
    for m in DATE_DMY.finditer(line):
        dt = _mk(int(m.group(3)), month_num(m.group(2)), int(m.group(1)))
        if dt: out.append(dt)
    for m in DATE_MDY.finditer(line):
        dt = _mk(int(m.group(3)), month_num(m.group(1)), int(m.group(2)))
        if dt: out.append(dt)
    for m in DATE_ISO.finditer(line):
        dt = _mk(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        if dt: out.append(dt)
    return out


def extract_deadline(text: str, today: date | None = None) -> tuple[date, str] | None:
    """Return (date, display) for the most relevant deadline, or None.

    Only dates found on/next to a deadline cue word count. When several are present
    prefer the earliest one that is still in the future, else the latest one.
    """
    today = today or date.today()
    lines = text.splitlines()
    found: set[date] = set()
    for i, line in enumerate(lines):
        if not DEADLINE_CUE.search(line):
            continue
        window = " ".join(lines[i:i + 2])  # cue and value are often on adjacent lines
        found.update(find_dates(window))
    if not found:
        return None
    future = sorted(d for d in found if d >= today)
    chosen = future[0] if future else max(found)
    return chosen, f"{chosen.day} {chosen.strftime('%b %Y')}"


def extract_amount(text: str) -> str | None:
    """First concrete money value / tuition share near an award-ish cue."""
    for line in text.splitlines():
        if not re.search(r"(award|scholarship|bursary|worth|value|tuition|fee|funding|grant)", line, re.I):
            continue
        m = AMOUNT.search(line)
        if m:
            amt = re.sub(r"\s+", " ", m.group(1)).strip()
            return amt[:60]
    return None
