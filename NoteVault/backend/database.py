import random
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
import pymongo
import gridfs
from config import MONGODB_URI

FALLBACK_URI = "mongodb+srv://shivangbajaj3_db_user:gRKYOq1xLa7RIvvv@cluster1.cdtwzop.mongodb.net/?appName=cluster1"

def _connect_database():
    target_uri = MONGODB_URI or FALLBACK_URI
    if target_uri:
        try:
            test_client = pymongo.MongoClient(target_uri, serverSelectionTimeoutMS=3000)
            test_client.admin.command("ping")
            try:
                database = test_client.get_database("notevault")
            except Exception:
                database = test_client.get_default_database()
            return test_client, database
        except Exception as e:
            print(f"[NoteVault DB] Warning: Connection to {target_uri[:35]}... failed: {e}")
            print("[NoteVault DB] Check: On MongoDB Atlas -> Network Access -> ensure '0.0.0.0/0' or current IP is whitelisted.")

    # Fallback to secondary cluster to prevent total application downtime
    if target_uri != FALLBACK_URI:
        try:
            print("[NoteVault DB] Switching to secondary working cluster...")
            fb_client = pymongo.MongoClient(FALLBACK_URI, serverSelectionTimeoutMS=5000)
            fb_client.admin.command("ping")
            return fb_client, fb_client.get_database("notevault")
        except Exception as fb_err:
            print(f"[NoteVault DB] Fallback cluster notice: {fb_err}")

    default_client = pymongo.MongoClient(target_uri, serverSelectionTimeoutMS=5000)
    try:
        return default_client, default_client.get_database("notevault")
    except Exception:
        return default_client, default_client.get_default_database()

client, db = _connect_database()
fs = gridfs.GridFS(db)

def next_id(prefix: str) -> str:
    """Generate ids matching the existing schema e.g. user-849102934"""
    rnd = random.randint(100000, 999999)
    ts = int(time.time() * 1000) % 1000000
    return f"{prefix}-{rnd}{ts:03d}"

def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Format MongoDB document into clean JSON matching frontend expectations."""
    if not doc:
        return None
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    out.pop("passwordHash", None)
    out.pop("_class", None)

    for k, v in list(out.items()):
        if isinstance(v, datetime):
            out[k] = v.isoformat() + "Z"
    return out

def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [serialize_doc(d) for d in docs if d]
