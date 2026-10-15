from collections import Counter
from fastapi import APIRouter, Request
from database import db, serialize_doc, serialize_docs
from auth import require_role, public_user
from services.event_service import (
    recent_audit_logs,
    recent_events,
    total_events_count,
    last_event_time
)
from config import GEMINI_API_KEY

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/analytics")
def get_analytics(request: Request):
    require_role("admin")(request)

    live_notes = list(db["notes"].find({"isDeleted": False}))
    approved_notes = [n for n in live_notes if n.get("status") == "approved"]
    pending_notes = [n for n in live_notes if n.get("status") == "pending"]

    subject_counts = Counter(n.get("subject", "General") for n in approved_notes)

    moderators = list(db["users"].find({"role": "moderator"}))
    trusted_count = sum(1 for m in moderators if m.get("isTrusted"))
    unproven_count = len(moderators) - trusted_count

    open_reports = db["reports"].count_documents({"status": "open"})
    pending_requests = db["moderatorRequests"].count_documents({"status": "pending"})

    return {
        "totals": {
            "notes": len(live_notes),
            "approved": len(approved_notes),
            "pending": len(pending_notes),
            "classes": db["classes"].count_documents({}),
            "users": db["users"].count_documents({}),
            "openReports": open_reports,
            "pendingModeratorRequests": pending_requests
        },
        "uploadsPerSubject": dict(subject_counts),
        "trustedModerators": trusted_count,
        "unprovenModerators": unproven_count
    }

@router.get("/users")
def get_users(request: Request):
    require_role("admin")(request)
    cursor = db["users"].find().sort("createdAt", -1)
    users_out = []
    for u in cursor:
        row = public_user(u)
        created = u.get("createdAt")
        row["createdAt"] = created.isoformat() + "Z" if hasattr(created, "isoformat") else str(created)
        users_out.append(row)
    return {"users": users_out}

@router.get("/audit")
def get_audit(request: Request):
    require_role("admin")(request)
    return {"logs": recent_audit_logs(50)}

@router.get("/streams")
def get_streams_status(request: Request):
    require_role("admin")(request)
    # Reflects the retirement of Kafka Streams in favor of direct API + AI Chatbot engine
    return {
        "status": "AI_API_ACTIVE",
        "lastProcessedAt": last_event_time(),
        "totalProcessed": total_events_count(),
        "consumerLag": 0,
        "instance": "python-api-backend",
        "topics": ["notevault.events", "notevault.ai-study"],
        "processor": {
            "status": "HEALTHY",
            "service": "notevault-ai-api",
            "streamProcessingRetired": True,
            "aiEngine": "Google Gemini" if GEMINI_API_KEY else "Intelligent Academic Engine"
        }
    }

@router.get("/events")
def get_events(request: Request):
    require_role("admin")(request)
    return {"events": recent_events(50)}
