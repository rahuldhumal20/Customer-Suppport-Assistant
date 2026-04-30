from datetime import datetime
import os

# Always write next to this file's location, no matter where uvicorn runs from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUEUE_FILE = os.path.join(BASE_DIR, "..", "human_review_queue.txt")

def escalate_to_human(query):
    path = os.path.abspath(QUEUE_FILE)

    with open(path, "a", encoding="utf-8") as file:
        file.write(
            f"""
Time:   {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Query:  {query}
Status: Pending Human Review
{"─" * 40}
"""
        )

    print(f"[HITL] Escalated query logged to: {path}")  # confirm in terminal

    return f"""
Escalation Triggered.

Ticket added to Human Review Queue.

Support team will review:
{query}
"""