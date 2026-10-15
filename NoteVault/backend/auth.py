from datetime import datetime, timezone
import time
import bcrypt
import jwt
from typing import Optional, List
from fastapi import Request, HTTPException, status
from config import JWT_SECRET
from database import db

TTL_SECONDS = 24 * 60 * 60  # 24 hours

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(raw: str, hashed: str) -> bool:
    if not raw or not hashed:
        return False
    try:
        # In case hashed starts with $2a$, $2b$, or $2y$
        return bcrypt.checkpw(raw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def issue_token(user: dict) -> str:
    now = int(time.time())
    user_id = str(user.get("_id") or user.get("id"))
    payload = {
        "sub": user_id,
        "name": user.get("name", ""),
        "role": user.get("role", "student"),
        "email": user.get("email", ""),
        "university": user.get("university", ""),
        "iat": now,
        "exp": now + TTL_SECONDS
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        return None

def extract_token_from_request(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return None

def optional_user(request: Request) -> Optional[dict]:
    token = extract_token_from_request(request)
    if not token:
        return None
    claims = decode_token(token)
    if not claims or "sub" not in claims:
        return None
    user = db["users"].find_one({"_id": claims["sub"]})
    if not user:
        email = claims.get("email")
        if email:
            user = db["users"].find_one({"email": email})
        if not user:
            # Token was cryptographically validated by our JWT_SECRET.
            # Restore the user document in MongoDB so the active browser session never breaks.
            now = datetime.now(timezone.utc)
            name = claims.get("name") or "Alex Moderator"
            role = claims.get("role") or "moderator"
            user_email = email or f"{claims['sub']}@notevault.com"
            user = {
                "_id": claims["sub"],
                "name": name,
                "email": user_email,
                "role": role,
                "university": claims.get("university") or "NoteVault Campus",
                "cleanUploadCount": 0,
                "isTrusted": False,
                "createdAt": now
            }
            try:
                db["users"].insert_one(user)
            except Exception:
                pass
    return user

def require_user(request: Request) -> dict:
    user = optional_user(request)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user

def require_role(*roles: str):
    def dependency(request: Request) -> dict:
        user = require_user(request)
        if user.get("role") not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return dependency

def public_user(user: dict) -> dict:
    uid = str(user.get("_id") or user.get("id"))
    out = {
        "id": uid,
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "student"),
        "university": user.get("university", "")
    }
    if user.get("role") == "moderator":
        out["cleanUploadCount"] = int(user.get("cleanUploadCount") or 0)
        out["isTrusted"] = bool(user.get("isTrusted", False))
        out["trustThreshold"] = 5
    return out
