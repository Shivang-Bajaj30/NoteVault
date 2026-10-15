import os
import io
import json
import re
from typing import List, Dict, Any, Optional
from bson import ObjectId
import pdfplumber

from config import GEMINI_API_KEY
from database import db, fs

_gemini_client = None

def _get_gemini_client():
    global _gemini_client
    if _gemini_client:
        return _gemini_client
    api_key = GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            # Try current recommended model
            try:
                _gemini_client = genai.GenerativeModel("gemini-1.5-flash")
            except Exception:
                _gemini_client = genai.GenerativeModel("gemini-1.5-pro")
            return _gemini_client
        except Exception as e:
            print(f"[AI Study Service] Gemini init warning: {e}")
    return None

def extract_note_text(note_id: str) -> Dict[str, str]:
    """Extracts metadata and document text from MongoDB and GridFS."""
    note = db["notes"].find_one({"_id": note_id})
    if not note:
        return {"title": "Note", "subject": "General", "description": "", "text": ""}

    title = note.get("title", "")
    subject = note.get("subject", "General")
    description = note.get("description", "")
    tags = note.get("tags", [])
    extracted_text = ""

    file_id = note.get("fileId")
    if file_id:
        try:
            if ObjectId.is_valid(file_id):
                grid_out = fs.get(ObjectId(file_id))
                file_bytes = grid_out.read()
                file_name = note.get("fileName", "").lower()
                if file_name.endswith(".pdf") or file_name.endswith(".txt") or b"%PDF" in file_bytes[:10]:
                    try:
                        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                            pages_text = []
                            for page in pdf.pages[:10]:  # Up to 10 pages
                                txt = page.extract_text()
                                if txt:
                                    pages_text.append(txt)
                            extracted_text = "\n\n".join(pages_text)
                    except Exception:
                        try:
                            extracted_text = file_bytes.decode("utf-8", errors="ignore")[:8000]
                        except Exception:
                            pass
        except Exception as e:
            print(f"[AI Study Service] Could not read file from GridFS: {e}")

    full_context = f"Title: {title}\nSubject: {subject}\nDescription: {description}\nTags: {', '.join(tags)}"
    if extracted_text:
        full_context += f"\n\nDocument Content Excerpt:\n{extracted_text[:6000]}"
    else:
        full_context += f"\n\nCore Topic Details: {title} in {subject}. {description}"

    return {
        "title": title,
        "subject": subject,
        "description": description,
        "tags": tags,
        "context": full_context,
        "extracted_text": extracted_text
    }

def _clean_json_response(raw_text: str) -> str:
    cleaned = re.sub(r"^```json\s*", "", raw_text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"^```\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    return cleaned.strip()

# ==================== GEMINI POWERED ACTIONS ====================

def generate_study_analysis(note_id: str) -> Dict[str, Any]:
    doc_info = extract_note_text(note_id)
    context = doc_info["context"]
    title = doc_info["title"]
    subject = doc_info["subject"]

    client = _get_gemini_client()
    if client:
        prompt = f"""
You are an expert academic tutor. Analyze the following study material and generate a structured study breakdown.
Return ONLY valid JSON matching this schema:
{{
  "summary": "Clear, informative 2-3 paragraph study summary of the material",
  "keyConcepts": ["Concept 1: concise definition/explanation", "Concept 2: ...", "Concept 3: ...", "Concept 4: ...", "Concept 5: ..."],
  "studyOutline": [
    {{"title": "Section Title", "points": ["Key point A", "Key point B"]}}
  ],
  "difficulty": "Beginner | Intermediate | Advanced",
  "estimatedStudyTime": "e.g. 20-30 mins"
}}

Material:
{context}
"""
        try:
            resp = client.generate_content(prompt)
            data = json.loads(_clean_json_response(resp.text))
            # Cache summary & keyConcepts on note document in DB
            db["notes"].update_one(
                {"_id": note_id},
                {"$set": {
                    "summary": data.get("summary"),
                    "keyConcepts": data.get("keyConcepts")
                }}
            )
            return data
        except Exception as e:
            print(f"[AI Study Service] Gemini study analysis error: {e}")

    # Fallback smart academic analyzer
    return _fallback_study_analysis(doc_info)

def generate_quiz(note_id: str, count: int = 4) -> List[Dict[str, Any]]:
    doc_info = extract_note_text(note_id)
    context = doc_info["context"]

    client = _get_gemini_client()
    if client:
        prompt = f"""
You are an academic test maker. Generate {count} high-quality multiple choice practice questions based on this study material.
Return ONLY valid JSON as a list of questions:
[
  {{
    "id": "q1",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this answer is correct and explains the underlying concept."
  }}
]

Material:
{context}
"""
        try:
            resp = client.generate_content(prompt)
            data = json.loads(_clean_json_response(resp.text))
            if isinstance(data, list) and len(data) > 0:
                return data
        except Exception as e:
            print(f"[AI Study Service] Gemini quiz error: {e}")

    return _fallback_quiz(doc_info, count)

def generate_flashcards(note_id: str, count: int = 6) -> List[Dict[str, Any]]:
    doc_info = extract_note_text(note_id)
    context = doc_info["context"]

    client = _get_gemini_client()
    if client:
        prompt = f"""
Generate {count} effective spaced-repetition study flashcards based on this material.
Return ONLY valid JSON as a list of flashcards:
[
  {{
    "id": "fc1",
    "question": "Front of card (prompt, definition request, or conceptual question)",
    "answer": "Back of card (clear, concise answer)"
  }}
]

Material:
{context}
"""
        try:
            resp = client.generate_content(prompt)
            data = json.loads(_clean_json_response(resp.text))
            if isinstance(data, list) and len(data) > 0:
                # Cache flashcards on note
                db["notes"].update_one(
                    {"_id": note_id},
                    {"$set": {"flashcards": [{"q": item["question"], "a": item["answer"]} for item in data]}}
                )
                return data
        except Exception as e:
            print(f"[AI Study Service] Gemini flashcards error: {e}")

    return _fallback_flashcards(doc_info, count)

def chat_with_note(note_id: str, message: str, history: List[Dict[str, str]] = None) -> str:
    doc_info = extract_note_text(note_id)
    context = doc_info["context"]
    title = doc_info["title"]
    history = history or []

    client = _get_gemini_client()
    if client:
        prompt = f"""
You are a friendly, encouraging, and knowledgeable AI Study Tutor for NoteVault.
The student is studying the following document:
{context}

Guidelines:
1. Ground your answers primarily in this study material, but offer helpful analogies, clear step-by-step explanations, or practice exercises if requested.
2. Structure answers with clear bullet points or bold terms where appropriate.
3. Be conversational and academic.

Conversation history:
"""
        for h in history[-6:]:  # last 6 exchanges
            role = "Student" if h.get("sender") == "user" or h.get("role") == "user" else "Tutor"
            prompt += f"{role}: {h.get('text') or h.get('content', '')}\n"

        prompt += f"Student: {message}\nTutor:"

        try:
            resp = client.generate_content(prompt)
            return resp.text.strip()
        except Exception as e:
            print(f"[AI Study Service] Gemini chat error: {e}")

    return _fallback_chat_reply(doc_info, message)

def chat_general(message: str, history: List[Dict[str, str]] = None) -> str:
    history = history or []
    client = _get_gemini_client()
    if client:
        prompt = """
You are the NoteVault Study Companion AI chatbot.
You help students, teachers, and learners with any question, topic, concept, explanation, code example, or problem across all fields:
computer science, software development, science, mathematics, literature, history, engineering, and general knowledge.

Guidelines:
- Give thorough, accurate, and easy-to-understand explanations.
- Use clean formatting, bullet points, and code blocks with markdown when helpful.
- Be friendly, encouraging, and directly address what the user asked.

Conversation history:
"""
        for h in history[-8:]:
            role = "User" if h.get("sender") == "user" or h.get("role") == "user" else "Tutor"
            prompt += f"{role}: {h.get('text') or h.get('content', '')}\n"

        prompt += f"User: {message}\nTutor:"
        try:
            resp = client.generate_content(prompt)
            return resp.text.strip()
        except Exception as e:
            print(f"[AI Study Service] Gemini general chat error: {e}")

    # Fallback general response
    return (
        f"I'm your NoteVault AI Study Companion! Regarding your question on '{message}': "
        "To get full live responses for any topic, ensure GEMINI_API_KEY is configured in backend/.env. "
        "You can explore notes in the catalog or ask questions directly here!"
    )

# ==================== FALLBACK ACADEMIC ENGINE ====================

def _fallback_study_analysis(doc_info: Dict[str, Any]) -> Dict[str, Any]:
    title = doc_info["title"]
    subject = doc_info["subject"]
    description = doc_info["description"]
    tags = doc_info.get("tags") or []

    summary = (
        f"This study document covers foundational and applied principles of {title} in {subject}. "
        f"{description} Mastering this material enables students to understand core architectural trade-offs, "
        "analyze problem patterns, and apply theory in practical examination and real-world settings."
    )

    concepts = [
        f"{title} Fundamentals: Core definitions and structural rules essential for {subject}.",
        f"System Mechanics: Key inputs, processing behavior, and state management mechanisms.",
        f"Design Patterns & Best Practices: Standard patterns used by industry professionals and researchers.",
        f"Verification & Edge Cases: Common pitfalls, debugging workflows, and performance considerations."
    ]

    outline = [
        {"title": "1. Overview & Objectives", "points": [f"Introduction to {title}", "Core terminology and prerequisites"]},
        {"title": "2. Technical Mechanics", "points": ["Step-by-step workflow", "Data flow and state transformations"]},
        {"title": "3. Exam Review & Critical Points", "points": ["Comparison with alternative approaches", "Key equations and definitions"]}
    ]

    return {
        "summary": summary,
        "keyConcepts": concepts,
        "studyOutline": outline,
        "difficulty": "Intermediate",
        "estimatedStudyTime": "20-25 mins"
    }

def _fallback_quiz(doc_info: Dict[str, Any], count: int = 4) -> List[Dict[str, Any]]:
    title = doc_info["title"]
    subject = doc_info["subject"]
    description = doc_info["description"]

    return [
        {
            "id": "q1",
            "question": f"What is the primary objective of studying '{title}'?",
            "options": [
                f"To understand foundational concepts and applications in {subject}",
                "To replace existing database architectures entirely",
                "To eliminate client-side validation",
                "To manually audit server log files"
            ],
            "correctIndex": 0,
            "explanation": f"The core purpose of '{title}' is to build a systematic understanding of {subject} concepts as outlined in the course syllabus."
        },
        {
            "id": "q2",
            "question": f"Which of the following best describes the key mechanism in {title}?",
            "options": [
                "Unbounded random polling without consensus",
                f"{description if len(description) < 65 else description[:65] + '...'}",
                "Disabling indexes to improve read throughput",
                "Synchronous blocking loops on the main UI thread"
            ],
            "correctIndex": 1,
            "explanation": f"As highlighted in the study overview: {description}"
        },
        {
            "id": "q3",
            "question": f"When applying {title} in practice, what is a critical consideration?",
            "options": [
                "Ignoring edge cases and error boundaries",
                "Assuming network latency is zero",
                "Ensuring idempotency, fault-tolerance, and proper validation",
                "Never logging transactions or state changes"
            ],
            "correctIndex": 2,
            "explanation": "Robust systems in this domain require verification, idempotency, and proper boundary handling."
        },
        {
            "id": "q4",
            "question": f"How should students evaluate trade-offs in {subject}?",
            "options": [
                "Always choose the fastest tool regardless of reliability",
                "Balance latency, consistency, complexity, and resource overhead",
                "Strictly avoid automated testing",
                "Rely solely on default configurations"
            ],
            "correctIndex": 1,
            "explanation": "Engineering and academic analyses always require balancing throughput, correctness, and architectural simplicity."
        }
    ][:count]

def _fallback_flashcards(doc_info: Dict[str, Any], count: int = 6) -> List[Dict[str, Any]]:
    title = doc_info["title"]
    subject = doc_info["subject"]
    description = doc_info["description"]

    cards = [
        {"id": "fc1", "question": f"What is {title}?", "answer": f"A key study topic in {subject}: {description}"},
        {"id": "fc2", "question": f"Why is {title} critical in {subject}?", "answer": "It provides theoretical grounding and practical methodologies for solving core problems in this area."},
        {"id": "fc3", "question": "What is the primary trade-off to consider?", "answer": "Balancing operational complexity, throughput, and correctness guarantees."},
        {"id": "fc4", "question": "What common pitfall should you avoid?", "answer": "Failing to account for boundary conditions, invalid state transitions, or unhandled errors."},
        {"id": "fc5", "question": "How can you verify understanding?", "answer": "Solve practice questions, explain the workflow to a peer, and trace sample execution paths."},
        {"id": "fc6", "question": "Key takeaway for exams:", "answer": f"Memorize key definitions, recognize standard patterns, and understand the workflow of {title}."}
    ]
    return cards[:count]

def _fallback_chat_reply(doc_info: Dict[str, Any], message: str) -> str:
    title = doc_info["title"]
    subject = doc_info["subject"]
    desc = doc_info["description"]
    msg_lower = message.lower()

    if "summary" in msg_lower or "explain" in msg_lower or "what is" in msg_lower:
        return (
            f"### Study Summary: {title}\n\n"
            f"**Subject:** {subject}\n\n"
            f"**Core Focus:** {desc}\n\n"
            "**Key Points to Remember:**\n"
            f"1. **Core Concept:** {title} represents a central paradigm in {subject}.\n"
            "2. **Mechanism:** Understand the sequence of events and how data/states transform.\n"
            "3. **Application:** Be prepared to analyze edge cases and compare against alternative approaches.\n\n"
            "Would you like me to quiz you on this, generate flashcards, or deep dive into a specific part?"
        )
    elif "quiz" in msg_lower or "test" in msg_lower or "question" in msg_lower:
        return (
            f"I have loaded practice questions for **{title}**! You can click the **'Practice Quiz'** tab "
            "above to test yourself interactively with immediate score feedback and full explanations."
        )
    elif "flashcard" in msg_lower or "card" in msg_lower:
        return (
            f"I've generated flashcards for **{title}**! Switch to the **'Flashcards'** tab above to review "
            "front/back definitions and test your recall."
        )
    else:
        return (
            f"Regarding your question about **{title}**:\n\n"
            f"> *\"{message}\"*\n\n"
            f"In the context of **{subject}**, {title} focuses on: {desc}. "
            "To answer this effectively in an exam or project, emphasize the underlying principles, "
            "explain the cause-and-effect relationship, and highlight why this approach was chosen over alternatives.\n\n"
            "Feel free to ask for a concrete example, a step-by-step breakdown, or clarification on any concept!"
        )
