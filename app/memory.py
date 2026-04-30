chat_history=[]

def save_to_memory(question,answer):

    chat_history.append({
       "question":question,
       "answer":answer
    })

    if len(chat_history)>5:
        chat_history.pop(0)


def get_memory_context():

    context=""

    for item in chat_history:

        context += f"""
User:
{item['question']}

Bot:
{item['answer']}
"""

    return context

def clear_memory():
    global memory_store
    memory_store = []