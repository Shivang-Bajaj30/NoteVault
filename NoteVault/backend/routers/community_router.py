import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from database import db, next_id, serialize_doc, serialize_docs
from auth import require_user, require_role, optional_user
from services.trust_service import reset_trust
from services.event_service import emit_event, audit_log

router = APIRouter(prefix="/api", tags=["community"])

class ClassRequest(BaseModel):
    name: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    description: Optional[str] = ""

class ReportRequest(BaseModel):
    noteId: str
    reason: str = Field(..., min_length=1)

class ResolveReportRequest(BaseModel):
    decision: str

class ModeratorReviewRequest(BaseModel):
    decision: str

# ---------- Classes ----------

@router.get("/classes")
def list_classes():
    cursor = db["classes"].find().sort("createdAt", -1)
    classes = list(cursor)
    out = []
    for c in classes:
        cid = str(c.get("_id"))
        note_count = db["notes"].count_documents({
            "isDeleted": False,
            "status": "approved",
            "classId": cid
        })
        out.append({
            "id": cid,
            "name": c.get("name", ""),
            "subject": c.get("subject", ""),
            "description": c.get("description", ""),
            "noteCount": note_count
        })
    return {"classes": out}

@router.post("/classes")
def create_class(req: ClassRequest, request: Request):
    name = req.name.strip()
    subject = req.subject.strip()
    desc = (req.description or "").strip()

    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course Code & Title is required.")
    if not subject:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject / Department is required.")

    # Check for existing course with same name (case-insensitive)
    existing = db["classes"].find_one({"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}})
    if existing:
        cid = str(existing.get("_id"))
        note_count = db["notes"].count_documents({"isDeleted": False, "status": "approved", "classId": cid})
        return {
            "class": {
                "id": cid,
                "name": existing.get("name", name),
                "subject": existing.get("subject", subject),
                "description": existing.get("description", desc),
                "noteCount": note_count
            },
            "message": f"Course '{name}' already exists and is now selected."
        }

    user = optional_user(request)
    user_id = user["_id"] if user else "guest"
    user_name = user.get("name", "Guest Contributor") if user else "Guest Contributor"

    now = datetime.now(timezone.utc)
    cid = next_id("class")
    doc = {
        "_id": cid,
        "name": name,
        "subject": subject,
        "description": desc,
        "createdBy": user_id,
        "creatorName": user_name,
        "createdAt": now
    }
    db["classes"].insert_one(doc)
    audit_log(user or {"_id": "guest", "name": user_name}, "class.created", name)
    emit_event("class-events", "class.created", cid)
    return {
        "class": {
            "id": cid,
            "name": doc["name"],
            "subject": doc["subject"],
            "description": doc["description"],
            "noteCount": 0
        }
    }

# ---------- Reports ----------

@router.get("/reports")
def list_reports(request: Request):
    require_role("admin")(request)
    cursor = db["reports"].find().sort("createdAt", -1)
    return {"reports": serialize_docs(list(cursor))}

@router.post("/reports")
def create_report(req: ReportRequest, request: Request):
    user = require_user(request)
    reason = (req.reason or "").strip()
    if not reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A reason is required to report a note")

    note = db["notes"].find_one({"_id": req.noteId, "isDeleted": False})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    now = datetime.now(timezone.utc)
    report_id = next_id("report")
    report_doc = {
        "_id": report_id,
        "noteId": note["_id"],
        "noteTitle": note.get("title", ""),
        "reportedBy": user["_id"],
        "reportedByName": user.get("name", ""),
        "reason": reason,
        "status": "open",
        "createdAt": now
    }
    db["reports"].insert_one(report_doc)

    audit_log(user, "report.created", note.get("title", ""))
    emit_event("note-events", "note.reported", note["_id"])
    return {"report": serialize_doc(report_doc)}

@router.post("/reports/{report_id}/resolve")
def resolve_report(report_id: str, req: ResolveReportRequest, request: Request):
    admin = require_role("admin")(request)
    report = db["reports"].find_one({"_id": report_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.get("status") != "open":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Report already resolved")

    decision = (req.decision or "").lower()
    valid = (decision == "valid")
    new_status = "valid" if valid else "dismissed"
    now = datetime.now(timezone.utc)

    db["reports"].update_one(
        {"_id": report_id},
        {"$set": {
            "status": new_status,
            "resolvedBy": admin["_id"],
            "resolvedAt": now
        }}
    )
    report["status"] = new_status
    report["resolvedBy"] = admin["_id"]
    report["resolvedAt"] = now

    if valid:
        note_id = report.get("noteId")
        note = db["notes"].find_one({"_id": note_id})
        if note:
            # Send note back to pending review queue
            db["notes"].update_one({"_id": note_id}, {"$set": {"status": "pending"}})
            uploader_id = note.get("uploadedBy")
            if uploader_id and reset_trust(uploader_id):
                uploader = db["users"].find_one({"_id": uploader_id})
                name = uploader.get("name", "") if uploader else uploader_id
                audit_log(admin, "moderator.trust_reset", name)
                emit_event("note-events", "trust.updated", uploader_id)
        emit_event("note-events", "report.valid", report_id)
    else:
        emit_event("note-events", "report.dismissed", report_id)

    audit_log(admin, "report.valid" if valid else "report.dismissed", report.get("noteTitle", ""))
    return {"report": serialize_doc(report)}

# ---------- Moderator Verification ----------

@router.get("/moderator-requests")
def list_moderator_requests(request: Request):
    require_role("admin")(request)
    cursor = db["moderatorRequests"].find().sort("createdAt", -1)
    return {"requests": serialize_docs(list(cursor))}

@router.post("/moderator-requests/{request_id}/review")
def review_moderator_request(request_id: str, req: ModeratorReviewRequest, request: Request):
    admin = require_role("admin")(request)
    decision = (req.decision or "").lower()
    if decision not in ("approved", "rejected"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decision must be approved or rejected")

    mreq = db["moderatorRequests"].find_one({"_id": request_id})
    if not mreq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if mreq.get("status") != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request already reviewed")

    is_approved = (decision == "approved")
    now = datetime.now(timezone.utc)
    db["moderatorRequests"].update_one(
        {"_id": request_id},
        {"$set": {
            "status": decision,
            "reviewedBy": admin["_id"],
            "reviewedAt": now
        }}
    )
    mreq["status"] = decision
    mreq["reviewedBy"] = admin["_id"]
    mreq["reviewedAt"] = now

    user_id = mreq.get("userId")
    user = db["users"].find_one({"_id": user_id})
    if user:
        if is_approved:
            db["users"].update_one(
                {"_id": user_id},
                {"$set": {
                    "role": "moderator",
                    "isTrusted": False,
                    "cleanUploadCount": 0
                }}
            )
            audit_log(admin, "moderator.approved", user.get("name", ""))
        else:
            audit_log(admin, "moderator.rejected", user.get("name", ""))

    emit_event("user-events", f"moderator.{decision}", mreq.get("userEmail", ""))
    return {"request": serialize_doc(mreq)}
