from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from database import db
from services.ai_study_service import (
    chat_with_note,
    chat_general,
    generate_study_analysis,
    generate_quiz,
    generate_flashcards
)
from config import GEMINI_API_KEY

router = APIRouter(prefix="/api", tags=["ai-study"])

class ChatMessage(BaseModel):
    role: Optional[str] = "user"
    sender: Optional[str] = "user"
    text: Optional[str] = ""
    content: Optional[str] = ""

class NoteChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: Optional[List[Dict[str, Any]]] = []

class GeneralChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: Optional[List[Dict[str, Any]]] = []

@router.post("/notes/{note_id}/chat")
def handle_note_chat(note_id: str, req: NoteChatRequest):
    note = db["notes"].find_one({"_id": note_id, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    reply = chat_with_note(note_id, req.message, req.history)
    return {
        "reply": reply,
        "noteId": note_id,
        "noteTitle": note.get("title", "")
    }

@router.post("/notes/{note_id}/study/analyze")
def handle_study_analyze(note_id: str):
    note = db["notes"].find_one({"_id": note_id, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    analysis = generate_study_analysis(note_id)
    return {"analysis": analysis}

@router.post("/notes/{note_id}/study/quiz")
def handle_study_quiz(note_id: str, count: Optional[int] = 4):
    note = db["notes"].find_one({"_id": note_id, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    quiz = generate_quiz(note_id, count=count or 4)
    return {"quiz": quiz}

@router.post("/notes/{note_id}/study/flashcards")
def handle_study_flashcards(note_id: str, count: Optional[int] = 6):
    note = db["notes"].find_one({"_id": note_id, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    flashcards = generate_flashcards(note_id, count=count or 6)
    return {"flashcards": flashcards}

@router.post("/chat")
def handle_general_chat(req: GeneralChatRequest):
    reply = chat_general(req.message, req.history)
    return {"reply": reply}

@router.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "NoteVault Python API Backend",
        "aiEngine": "Google Gemini" if GEMINI_API_KEY else "Intelligent Academic Engine",
        "streamProcessing": "Decommissioned in favor of direct API"
    }

@router.get("/health/streams")
def streams_health_check():
    """Compatibility endpoint for any existing health monitors."""
    return {
        "service": "notevault-ai-api",
        "status": "HEALTHY",
        "processingEnabled": True,
        "mode": "api-direct"
    }
