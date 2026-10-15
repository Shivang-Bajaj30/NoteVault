from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from database import db, next_id, serialize_docs

def emit_event(topic: str, event_type: str, payload: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    doc = {
        "_id": next_id("event"),
        "topic": topic,
        "type": event_type,
        "payload": payload,
        "createdAt": now
    }
    db["streamEvents"].insert_one(doc)
    return doc

def audit_log(user: Optional[Dict[str, Any]], action: str, target: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    uid = str(user.get("_id") or user.get("id")) if user else "system"
    uname = user.get("name", "System") if user else "System"
    doc = {
        "_id": next_id("audit"),
        "userId": uid,
        "userName": uname,
        "action": action,
        "target": target,
        "createdAt": now
    }
    db["auditLogs"].insert_one(doc)
    emit_event("audit-stream", action, target)
    return doc

def recent_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    docs = list(db["auditLogs"].find().sort("createdAt", -1).limit(limit))
    return serialize_docs(docs)

def recent_events(limit: int = 50) -> List[Dict[str, Any]]:
    docs = list(db["streamEvents"].find().sort("createdAt", -1).limit(limit))
    return serialize_docs(docs)

def total_events_count() -> int:
    return db["streamEvents"].count_documents({})

def last_event_time() -> Optional[str]:
    doc = db["streamEvents"].find_one(sort=[("createdAt", -1)])
    if doc and "createdAt" in doc:
        val = doc["createdAt"]
        return val.isoformat() + "Z" if isinstance(val, datetime) else str(val)
    return None
