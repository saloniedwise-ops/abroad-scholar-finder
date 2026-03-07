import hashlib


def normalize_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    cleaned = [line for line in lines if line]
    return "\n".join(cleaned)


def make_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def compare_text(old_text: str, new_text: str):
    old_norm = normalize_text(old_text or "")
    new_norm = normalize_text(new_text or "")

    return {
        "changed": make_hash(old_norm) != make_hash(new_norm),
        "old_text": old_norm,
        "new_text": new_norm,
        "old_hash": make_hash(old_norm),
        "new_hash": make_hash(new_norm),
    }
