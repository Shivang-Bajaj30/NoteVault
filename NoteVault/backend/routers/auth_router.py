from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from database import db, next_id
from auth import (
    hash_password,
    verify_password,
    issue_token,
    require_user,
    public_user
)
from services.event_service import emit_event, audit_log

router = APIRouter(prefix="/api/auth", tags=["auth"])

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    university: Optional[str] = ""
    role: Optional[str] = "student"
    reason: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest):
    email_clean = req.email.strip().lower()
    existing = db["users"].find_one({"email": {"$regex": f"^{email_clean}$", "$options": "i"}})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    now = datetime.now(timezone.utc)
    user_id = next_id("user")
    is_mod_req = (req.role or "").lower() == "moderator"
    assigned_role = "moderator" if is_mod_req else "student"

    user_doc = {
        "_id": user_id,
        "name": req.name.strip(),
        "email": email_clean,
        "passwordHash": hash_password(req.password),
        "role": assigned_role,
        "university": (req.university or "").strip(),
        "createdAt": now,
        "cleanUploadCount": 0,
        "isTrusted": False
    }
    db["users"].insert_one(user_doc)

    emit_event("user-events", "user.signup", email_clean)
    audit_log(user_doc, "user.signup", email_clean)

    if is_mod_req:
        mreq = {
            "_id": next_id("mreq"),
            "userId": user_id,
            "userName": req.name.strip(),
            "userEmail": email_clean,
            "status": "approved",
            "reason": (req.reason or "").strip(),
            "createdAt": now
        }
        db["moderatorRequests"].insert_one(mreq)
        emit_event("user-events", "moderator.approved", email_clean)

    token = issue_token(user_doc)
    return {
        "token": token,
        "user": public_user(user_doc),
        "moderatorRequestPending": False
    }

@router.post("/login")
def login(req: LoginRequest):
    email_clean = (req.email or "").strip().lower()
    user = db["users"].find_one({"email": {"$regex": f"^{email_clean}$", "$options": "i"}})
    if not user or not verify_password(req.password, user.get("passwordHash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    emit_event("user-events", "user.login", email_clean)
    token = issue_token(user)
    return {
        "token": token,
        "user": public_user(user)
    }

@router.get("/me")
def me(request: Request):
    user = require_user(request)
    return {"user": public_user(user)}

@router.post("/become-moderator")
def become_moderator(request: Request):
    user = require_user(request)
    user_id = user["_id"]
    now = datetime.now(timezone.utc)
    db["users"].update_one(
        {"_id": user_id},
        {"$set": {
            "role": "moderator",
            "cleanUploadCount": user.get("cleanUploadCount", 0),
            "isTrusted": user.get("isTrusted", False)
        }}
    )
    user["role"] = "moderator"
    
    # Also update any pending moderator requests
    db["moderatorRequests"].update_many(
        {"userId": user_id},
        {"$set": {"status": "approved", "reviewedAt": now}}
    )
    
    emit_event("user-events", "moderator.approved", user.get("email", ""))
    token = issue_token(user)
    return {
        "token": token,
        "user": public_user(user)
    }

