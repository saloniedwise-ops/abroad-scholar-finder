import requests
from bs4 import BeautifulSoup

from db import get_active_sources, get_latest_snapshot, insert_snapshot, insert_change
from compare import compare_text, normalize_text

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ScholarshipMonitor/1.0)"
}


def fetch_page(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.text


def extract_text(html: str, css_selector: str | None = None) -> str:
    soup = BeautifulSoup(html, "lxml")

    for tag in soup(["script", "style", "noscript", "header", "footer"]):
        tag.decompose()

    if css_selector:
        node = soup.select_one(css_selector)
        if node:
            return normalize_text(node.get_text("\n", strip=True))

    main = soup.find("main")
    if main:
        return normalize_text(main.get_text("\n", strip=True))

    return normalize_text(soup.get_text("\n", strip=True))


def run():
    sources = get_active_sources()
    print(f"Found {len(sources)} active sources")

    for source in sources:
        source_id = source["id"]
        university_name = source.get("university_name", "")
        url = source.get("source_url")
        css_selector = source.get("css_selector")

        if not url:
            print(f"Skipping {university_name}: no source_url")
            continue

        try:
            html = fetch_page(url)
            extracted_text = extract_text(html, css_selector)

            latest = get_latest_snapshot(source_id)
            old_text = latest["raw_text"] if latest else ""

            comparison = compare_text(old_text, extracted_text)

            if not latest:
                insert_snapshot(source_id, comparison["new_text"], comparison["new_hash"])
                print(f"Initial snapshot saved for {university_name}")
                continue

            if comparison["changed"]:
                insert_snapshot(source_id, comparison["new_text"], comparison["new_hash"])
                insert_change(
                    source_id=source_id,
                    university_name=university_name,
                    old_value=comparison["old_text"][:1000],
                    new_value=comparison["new_text"][:1000],
                )
                print(f"Change detected for {university_name}")
            else:
                print(f"No change for {university_name}")

        except Exception as e:
            print(f"Error for {university_name}: {e}")


if __name__ == "__main__":
    run()
