"""Page-text cleaning and change detection.

The old crawler hashed the whole page, so cookie banners, menus, "last updated"
stamps and copyright years made almost every page look "modified" every day.
Here we strip page chrome and volatile lines before hashing.
"""
from __future__ import annotations

import hashlib
import re

from bs4 import BeautifulSoup

# Always noise, whatever their size.
CHROME_TAGS = ["script", "style", "noscript", "iframe", "svg", "button", "select"]
# Page furniture, but some sites wrap the WHOLE page in these (e.g. ASP.NET puts everything in
# <form>), so they are only removed when small.
SOFT_CHROME_TAGS = ["header", "footer", "nav", "aside", "form"]
SOFT_LIMIT = 1500  # characters of text
MIN_KEEP_RATIO = 0.35  # never let cleaning throw away most of the page
CHROME_HINT = re.compile(
    r"cookie|consent|banner|breadcrumb|menu|nav|footer|social|share|newsletter|"
    r"modal|popup|skip", re.I)

# Lines that change without the scholarship changing.
VOLATILE = re.compile(
    r"(last (updated|modified|reviewed)|page updated|copyright|©|all rights reserved|"
    r"cookie|privacy policy|share this|follow us|skip to|back to top|"
    r"\bviews?\b:?\s*\d+|\d+\s+(visitors|views))", re.I)


def normalize_text(text: str) -> str:
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def extract_text(html: str, css_selector: str | None = None) -> str:
    soup = BeautifulSoup(html, "lxml")
    raw_len = len(soup.get_text(" ", strip=True))
    for tag in soup(CHROME_TAGS):
        tag.decompose()
    candidates = soup.find_all(SOFT_CHROME_TAGS) + soup.find_all(attrs={"class": CHROME_HINT}) \
        + soup.find_all(attrs={"id": CHROME_HINT})
    for node in candidates:
        if node.decomposed or node.name in ("html", "body", "main", "article"):
            continue
        if len(node.get_text(" ", strip=True)) <= SOFT_LIMIT:  # small widget, not the page itself
            node.decompose()

    if css_selector:
        node = soup.select_one(css_selector)
        if node:
            return normalize_text(node.get_text("\n", strip=True))
    node = soup.find("main") or soup.find("article") or soup.body or soup
    text = normalize_text(node.get_text("\n", strip=True))
    if raw_len and len(text) < raw_len * MIN_KEEP_RATIO:
        # Cleaning removed most of the page: prefer complete-but-noisy over empty.
        fallback = BeautifulSoup(html, "lxml")
        for tag in fallback(["script", "style", "noscript", "svg"]):
            tag.decompose()
        text = normalize_text((fallback.body or fallback).get_text("\n", strip=True))
    return text


def stable_text(text: str) -> str:
    """Text used for hashing: drop volatile lines."""
    return "\n".join(l for l in normalize_text(text).splitlines() if not VOLATILE.search(l))


def make_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def compare_text(old_text: str, new_text: str) -> dict:
    old_norm = stable_text(old_text or "")
    new_norm = stable_text(new_text or "")
    return {
        "changed": make_hash(old_norm) != make_hash(new_norm),
        "old_text": old_norm,
        "new_text": new_norm,
        "old_hash": make_hash(old_norm),
        "new_hash": make_hash(new_norm),
    }
