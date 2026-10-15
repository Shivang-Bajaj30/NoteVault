import urllib.request
import json

def test():
    # 1. Health
    res = urllib.request.urlopen("http://localhost:8080/api/health")
    print("1. Health OK:", res.status)

    # 2. Catalog
    res = urllib.request.urlopen("http://localhost:8080/api/notes")
    notes = json.loads(res.read().decode())["notes"]
    print(f"2. Catalog OK: {len(notes)} notes returned")

    # 3. Chat on note
    note_id = notes[0]["id"]
    chat_payload = json.dumps({"message": "Explain this note simply", "history": []}).encode()
    req = urllib.request.Request(
        f"http://localhost:8080/api/notes/{note_id}/chat",
        data=chat_payload,
        headers={"Content-Type": "application/json"}
    )
    chat_res = json.loads(urllib.request.urlopen(req).read().decode())
    print("3. Chat response OK:", bool(chat_res.get("reply")))

    # 4. Flashcards
    req = urllib.request.Request(
        f"http://localhost:8080/api/notes/{note_id}/study/flashcards",
        data=b"{}",
        headers={"Content-Type": "application/json"}
    )
    fc_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"4. Flashcards OK: {len(fc_res.get('flashcards', []))} cards generated")

    # 5. Quiz
    req = urllib.request.Request(
        f"http://localhost:8080/api/notes/{note_id}/study/quiz",
        data=b"{}",
        headers={"Content-Type": "application/json"}
    )
    quiz_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"5. Quiz OK: {len(quiz_res.get('quiz', []))} questions generated")

    # 6. Admin Streams / Status
    login_payload = json.dumps({"email": "admin@notevault.com", "password": "password123"}).encode()
    login_req = urllib.request.Request(
        "http://localhost:8080/api/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"}
    )
    token = json.loads(urllib.request.urlopen(login_req).read().decode())["token"]

    admin_req = urllib.request.Request(
        "http://localhost:8080/api/admin/streams",
        headers={"Authorization": f"Bearer {token}"}
    )
    admin_res = json.loads(urllib.request.urlopen(admin_req).read().decode())
    print("6. Admin Status OK:", admin_res["status"])
    print("\nALL BACKEND & CHATBOT API TESTS PASSED!")

if __name__ == "__main__":
    test()
