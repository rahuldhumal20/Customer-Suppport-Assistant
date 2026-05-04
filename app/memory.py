chat_history = []

def save_to_memory(question: str, answer: str):
    chat_history.append({"question": question, "answer": answer})
    if len(chat_history) > 5:
        chat_history.pop(0)

def get_memory_context() -> str:
    return "".join(
        f"\nUser:\n{item['question']}\n\nBot:\n{item['answer']}\n"
        for item in chat_history
    )

def clear_memory():
    chat_history.clear()