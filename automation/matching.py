"""Match scholarships found on a page to the rows already in the database."""
from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher

NOISE = re.compile(r"\b(the|of|for|and|in|at|scholarships?|bursar(y|ies)|awards?|grants?|programme|program|"
                   r"scheme|fund|international|students?|20\d\d(/\d\d)?)\b")


def normalize_name(name: str) -> str:
    n = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode().lower()
    n = re.sub(r"\b20\d\d(?:[/-](?:20)?\d\d)?\b", " ", n)  # 2026, 2026/27, 2026-2027
    n = re.sub(r"[^a-z0-9 ]+", " ", n)
    return re.sub(r"\s+", " ", NOISE.sub(" ", n)).strip()


def similarity(a: str, b: str) -> float:
    na, nb = normalize_name(a), normalize_name(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    ta, tb = set(na.split()), set(nb.split())
    jaccard = len(ta & tb) / len(ta | tb)
    return max(SequenceMatcher(None, na, nb).ratio(), jaccard)


def slugify(text: str) -> str:
    t = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", t)).strip("-")[:110]


def match_records(records: list[dict], rows: list[dict], threshold: float = 0.8):
    """Return (pairs, unmatched_records).

    pairs: list of (record, row). A page with exactly one scholarship and exactly one linked
    row is paired directly; otherwise records are paired greedily by name similarity.
    """
    if len(records) == 1 and len(rows) == 1:
        return [(records[0], rows[0])], []
    scored = sorted(
        ((similarity(rec["name"], row["scholarship_name"]), i, j)
         for i, rec in enumerate(records) for j, row in enumerate(rows)), reverse=True)
    used_r, used_w, pairs = set(), set(), []
    for score, i, j in scored:
        if score < threshold:
            break
        if i in used_r or j in used_w:
            continue
        used_r.add(i)
        used_w.add(j)
        pairs.append((records[i], rows[j]))
    return pairs, [r for i, r in enumerate(records) if i not in used_r]
