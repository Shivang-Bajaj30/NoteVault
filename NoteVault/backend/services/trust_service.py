from typing import Optional, Dict, Any
from database import db

TRUST_THRESHOLD = 5

def can_auto_publish(user: Optional[Dict[str, Any]]) -> bool:
    if not user:
        return False
    if user.get("role") == "admin":
        return True
    return user.get("role") == "moderator" and bool(user.get("isTrusted", False))

def award_clean_upload(moderator_id: str) -> bool:
    """Increment clean upload count and check if user crossed threshold."""
    user = db["users"].find_one({"_id": moderator_id})
    if not user or user.get("role") != "moderator":
        return False
    
    current_count = int(user.get("cleanUploadCount") or 0) + 1
    was_trusted = bool(user.get("isTrusted", False))
    now_trusted = was_trusted or current_count >= TRUST_THRESHOLD

    db["users"].update_one(
        {"_id": moderator_id},
        {"$set": {
            "cleanUploadCount": current_count,
            "isTrusted": now_trusted
        }}
    )
    return (not was_trusted) and now_trusted

def reset_trust(moderator_id: str) -> bool:
    """Safety net: resets a trusted moderator's reputation upon valid report."""
    user = db["users"].find_one({"_id": moderator_id})
    if not user or user.get("role") != "moderator" or not user.get("isTrusted"):
        return False

    db["users"].update_one(
        {"_id": moderator_id},
        {"$set": {
            "cleanUploadCount": 0,
            "isTrusted": False
        }}
    )
    return True
