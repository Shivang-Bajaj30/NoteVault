import hashlib
import re
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, Response, UploadFile, File, Form, status
from pydantic import BaseModel

from database import db, fs, next_id, serialize_doc, serialize_docs
from auth import require_user, require_role, optional_user
from services.trust_service import can_auto_publish, award_clean_upload
from services.event_service import emit_event, audit_log

router = APIRouter(prefix="/api", tags=["notes"])

class ReviewRequest(BaseModel):
    decision: str

@router.get("/notes")
def list_notes(
    q: Optional[str] = None,
    classId: Optional[str] = None,
    subject: Optional[str] = None
):
    query = {"isDeleted": False, "status": "approved"}
    if classId and classId.strip():
        query["classId"] = classId.strip()
    if subject and subject.strip():
        query["subject"] = {"$regex": f"^{re.escape(subject.strip())}$", "$options": "i"}

    cursor = db["notes"].find(query).sort("createdAt", -1)
    notes = list(cursor)

    needle = (q or "").strip().lower()
    if needle:
        filtered = []
        for n in notes:
            tags_str = " ".join(n.get("tags") or [])
            haystack = f"{n.get('title', '')} {n.get('description', '')} {n.get('subject', '')} {tags_str}".lower()
            if needle in haystack:
                filtered.append(n)
        notes = filtered

    return {"notes": serialize_docs(notes)}

@router.get("/notes/search")
def search_notes(q: Optional[str] = None):
    return list_notes(q=q)

@router.get("/notes/mine")
def my_notes(request: Request):
    user = require_role("moderator", "admin")(request)
    cursor = db["notes"].find({
        "isDeleted": False,
        "uploadedBy": user["_id"]
    }).sort("createdAt", -1)
    return {"notes": serialize_docs(list(cursor))}

@router.get("/admin/notes")
def pending_notes(request: Request):
    require_role("admin")(request)
    cursor = db["notes"].find({
        "isDeleted": False,
        "status": "pending"
    }).sort("createdAt", -1)
    return {"notes": serialize_docs(list(cursor))}

@router.get("/notes/{note_id}")
def get_note(note_id: str, request: Request):
    note = db["notes"].find_one({"_id": note_id, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note.get("status") != "approved":
        current_user = optional_user(request)
        if not current_user or (current_user["_id"] != note.get("uploadedBy") and current_user.get("role") != "admin"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    return {"note": serialize_doc(note)}

@router.post("/notes", status_code=status.HTTP_201_CREATED)
async def upload_note(
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(""),
    subject: Optional[str] = Form("General"),
    classId: Optional[str] = Form(None),
    tags: Optional[List[str]] = Form(None),
    file: UploadFile = File(...)
):
    user = require_role("moderator", "admin")(request)

    clean_title = (title or "").strip()
    if not clean_title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A document file is required")

    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds 25 MB limit")

    filename = file.filename or f"{clean_title.lower().replace(' ', '-')}.pdf"
    ext_match = re.search(r"\.(pdf|pptx?|docx?|png|jpe?g)$", filename, re.IGNORECASE)
    if not ext_match:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported document type")

    file_hash = hashlib.sha256(file_bytes).hexdigest()
    duplicate = db["notes"].find_one({"fileHash": file_hash, "isDeleted": False})
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate file detected (same SHA-256 hash)")

    content_type = file.content_type or "application/octet-stream"
    grid_id = fs.put(file_bytes, filename=filename, contentType=content_type)
    file_id_str = str(grid_id)

    tag_list = []
    if tags:
        for t in tags:
            for sub in str(t).split(","):
                if sub.strip():
                    tag_list.append(sub.strip())

    clean_desc = (description or "").strip()
    auto_pub = can_auto_publish(user)
    # Spec: auto-publishes if trusted moderator and description >= 20 chars
    note_status = "approved" if (auto_pub and len(clean_desc) >= 20) else "pending"
    flagged = auto_pub and note_status == "pending"

    now = datetime.now(timezone.utc)
    note_id = next_id("note")
    note_doc = {
        "_id": note_id,
        "title": clean_title,
        "description": clean_desc,
        "subject": (subject or "General").strip(),
        "classId": classId,
        "tags": tag_list,
        "fileName": filename,
        "fileId": file_id_str,
        "fileUrl": f"/api/notes/{note_id}/file",
        "fileHash": file_hash,
        "uploadedBy": user["_id"],
        "uploadedByName": user.get("name", ""),
        "status": note_status,
        "isDeleted": False,
        "createdAt": now
    }
    db["notes"].insert_one(note_doc)

    emit_event("note-events", "note.uploaded", note_id)
    if note_status == "approved":
        emit_event("note-events", "note.approved", note_id)
    elif flagged:
        emit_event("note-events", "note.flagged", note_id)

    audit_log(user, "note.auto_published" if note_status == "approved" else "note.submitted", clean_title)

    return {
        "note": serialize_doc(note_doc),
        "autoPublished": note_status == "approved"
    }

@router.get("/notes/{note_id}/file")
def download_note_file(note_id: str, request: Request):
    note = db["notes"].find_one({"_id": note_id, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note.get("status") != "approved":
        user = require_user(request)
        if user["_id"] != note.get("uploadedBy") and user.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    file_id = note.get("fileId")
    if not file_id or not ObjectId.is_valid(file_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File is not available")

    try:
        grid_file = fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in storage")

    content = grid_file.read()
    content_type = grid_file.content_type or "application/octet-stream"
    filename = note.get("fileName") or "document.pdf"

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    emit_event("download-events", "file.downloaded", note_id)
    return Response(content=content, media_type=content_type, headers=headers)

@router.post("/notes/{note_id}/delete")
@router.delete("/notes/{note_id}")
def delete_note(note_id: str, request: Request):
    user = require_user(request)
    note = db["notes"].find_one({"_id": note_id, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if str(user["_id"]) != str(note.get("uploadedBy")) and user.get("role") not in ("admin", "moderator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own notes")

    db["notes"].update_one({"_id": note_id}, {"$set": {"isDeleted": True}})
    audit_log(user, "note.deleted", note.get("title", ""))
    emit_event("note-events", "note.deleted", note_id)
    return {"ok": True}

@router.post("/admin/notes/{note_id}/review")
def review_note(note_id: str, req: ReviewRequest, request: Request):
    admin = require_role("admin")(request)
    decision = (req.decision or "").lower()
    if decision not in ("approve", "reject"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decision must be approve or reject")

    note = db["notes"].find_one({"_id": note_id, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Note is not pending review")

    is_approved = (decision == "approve")
    new_status = "approved" if is_approved else "rejected"
    now = datetime.now(timezone.utc)

    db["notes"].update_one(
        {"_id": note_id},
        {"$set": {"status": new_status, "reviewedAt": now}}
    )
    note["status"] = new_status
    note["reviewedAt"] = now

    if is_approved:
        uploader_id = note.get("uploadedBy")
        if uploader_id:
            newly_trusted = award_clean_upload(uploader_id)
            if newly_trusted:
                uploader = db["users"].find_one({"_id": uploader_id})
                name = uploader.get("name", "") if uploader else uploader_id
                audit_log(admin, "moderator.trusted", name)
                emit_event("note-events", "trust.updated", uploader_id)
        emit_event("note-events", "note.approved", note_id)
    else:
        emit_event("note-events", "note.rejected", note_id)

    audit_log(admin, "note.approved" if is_approved else "note.rejected", note.get("title", ""))
    return {"note": serialize_doc(note)}
