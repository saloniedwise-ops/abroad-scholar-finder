from datetime import datetime, timezone
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from supabase import create_client
import config

config.require_supabase()
supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

SENDER_EMAIL = os.getenv("ALERT_SENDER_EMAIL", "")
SENDER_APP_PASSWORD = os.getenv("ALERT_SENDER_APP_PASSWORD", "")
RECIPIENT_EMAIL = os.getenv("ALERT_RECIPIENT_EMAIL", "")


def get_today_changes():
    today = datetime.now(timezone.utc).date().isoformat()

    response = (
        supabase.table("scholarship_changes")
        .select("*")
        .gte("detected_at", f"{today}T00:00:00+00:00")
        .lte("detected_at", f"{today}T23:59:59+00:00")
        .execute()
    )
    return response.data or []


def build_summary(changes):
    if not changes:
        return "No scholarship changes detected today."

    grouped = {
        "added": [],
        "removed": [],
        "modified": [],
        "deadline_changed": [],
        "amount_changed": [],
    }

    for change in changes:
        change_type = change.get("change_type", "")
        university_name = change.get("university_name", "")
        summary = change.get("change_summary", "")

        if change_type in grouped:
            grouped[change_type].append(f"- {summary} ({university_name})")

    lines = ["Scholarship Updates Today", ""]

    for key, title in [
        ("added", "Added"),
        ("removed", "Removed"),
        ("modified", "Page Content Updated"),
        ("deadline_changed", "Deadline Changed"),
        ("amount_changed", "Amount Changed"),
    ]:
        if grouped[key]:
            lines.append(title + ":")
            lines.extend(grouped[key])
            lines.append("")

    return "\n".join(lines).strip()


def send_email(subject: str, body: str):
    if not SENDER_EMAIL or not SENDER_APP_PASSWORD or not RECIPIENT_EMAIL:
        raise ValueError(
            "Missing email environment variables. Set ALERT_SENDER_EMAIL, ALERT_SENDER_APP_PASSWORD, and ALERT_RECIPIENT_EMAIL."
        )

    message = MIMEMultipart()
    message["From"] = SENDER_EMAIL
    message["To"] = RECIPIENT_EMAIL
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
        server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, message.as_string())


def main():
    changes = get_today_changes()
    summary_text = build_summary(changes)

    print("\n=========== EMAIL SUMMARY ===========\n")
    print(summary_text)
    print("\n====================================\n")

    subject = f"Scholarship Monitor Update - {datetime.now(timezone.utc).date()}"
    send_email(subject, summary_text)
    print("Email sent successfully.")


if __name__ == "__main__":
    main()