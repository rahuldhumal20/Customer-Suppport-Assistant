from datetime import datetime
from app.config import QUEUE_FILE
import os

def escalate_to_human(query: str) -> str:
    path = os.path.abspath(QUEUE_FILE)
    with open(path, "a", encoding="utf-8") as f:
        f.write(
            f"\nTime:   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"Query:  {query}\n"
            f"Status: Pending Human Review\n"
            f"{'─' * 40}\n"
        )
    print(f"[HITL] Escalated query logged to: {path}")
    return (
        f"Escalation Triggered.\n\n"
        f"Ticket added to Human Review Queue.\n\n"
        f"Support team will review:\n{query}"
    )