from datetime import datetime, timezone
from database import db, next_id
from auth import hash_password
from config import DEMO_ENABLED

def seed_demo_data():
    if not DEMO_ENABLED:
        return

    now = datetime.now(timezone.utc)
    hashed_pwd = hash_password("password123")

    demo_users = [
        {
            "email": "admin@notevault.com",
            "name": "Nova Admin",
            "role": "admin",
            "university": "NoteVault HQ",
            "cleanUploadCount": 0,
            "isTrusted": False
        },
        {
            "email": "aisha@notevault.com",
            "name": "Aisha Khan",
            "role": "moderator",
            "university": "Northeastern University",
            "cleanUploadCount": 6,
            "isTrusted": True
        },
        {
            "email": "diego@notevault.com",
            "name": "Diego Alvarez",
            "role": "moderator",
            "university": "University of Texas",
            "cleanUploadCount": 2,
            "isTrusted": False
        },
        {
            "email": "student@notevault.com",
            "name": "Sam Lee",
            "role": "student",
            "university": "University of Washington",
            "cleanUploadCount": 0,
            "isTrusted": False
        }
    ]

    for item in demo_users:
        existing = db["users"].find_one({"email": {"$regex": f"^{item['email']}$", "$options": "i"}})
        if existing:
            # Update password and core attributes to ensure demo persona logins work
            db["users"].update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "name": item["name"],
                    "role": item["role"],
                    "university": item["university"],
                    "passwordHash": hashed_pwd,
                    "cleanUploadCount": item["cleanUploadCount"],
                    "isTrusted": item["isTrusted"]
                }}
            )
        else:
            doc = {
                "_id": next_id("user"),
                "email": item["email"],
                "name": item["name"],
                "role": item["role"],
                "university": item["university"],
                "passwordHash": hashed_pwd,
                "cleanUploadCount": item["cleanUploadCount"],
                "isTrusted": item["isTrusted"],
                "createdAt": now
            }
            db["users"].insert_one(doc)

    # Ensure demo classes exist if table empty
    if db["classes"].count_documents({}) == 0:
        c1 = {
            "_id": next_id("class"),
            "name": "CS 201 — Data Structures",
            "subject": "Computer Science",
            "description": "Core algorithms, trees, graphs, and problem solving.",
            "createdBy": "admin",
            "createdAt": now
        }
        c2 = {
            "_id": next_id("class"),
            "name": "CS 301 — Data Engineering",
            "subject": "Data Engineering",
            "description": "Streaming pipelines, Kafka, and analytics workflows.",
            "createdBy": "admin",
            "createdAt": now
        }
        c3 = {
            "_id": next_id("class"),
            "name": "BIO 110 — Cell Biology",
            "subject": "Biology",
            "description": "Cells, organelles, membranes, and energy cycles.",
            "createdBy": "admin",
            "createdAt": now
        }
        db["classes"].insert_many([c1, c2, c3])

    # Ensure demo notes exist if table empty
    if db["notes"].count_documents({}) == 0:
        admin_user = db["users"].find_one({"role": "admin"}) or db["users"].find_one({})
        admin_id = str(admin_user["_id"]) if admin_user else "admin"
        admin_name = admin_user.get("name", "Nova Admin") if admin_user else "Nova Admin"
        
        c1 = db["classes"].find_one({"name": {"$regex": "CS 201"}})
        c2 = db["classes"].find_one({"name": {"$regex": "CS 301"}})
        c3 = db["classes"].find_one({"name": {"$regex": "BIO 110"}})

        notes = [
            {
                "_id": next_id("note"),
                "title": "Binary Search Trees & AVL Balancing",
                "description": "Comprehensive guide on tree traversals, left-right rotations, and amortized complexity analysis.",
                "subject": "Computer Science",
                "classId": str(c1["_id"]) if c1 else "class-cs201",
                "className": c1.get("name", "CS 201 — Data Structures") if c1 else "CS 201 — Data Structures",
                "tags": ["Trees", "Algorithms", "Data Structures"],
                "fileName": "CS201_AVL_Trees_Notes.pdf",
                "fileId": None,
                "fileSize": 184520,
                "fileSha256": "4a7d3b9e28f7c10d8a5e9b3c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0",
                "status": "approved",
                "isDeleted": False,
                "uploadedBy": admin_id,
                "uploaderName": admin_name,
                "autoPublished": True,
                "createdAt": now,
                "updatedAt": now
            },
            {
                "_id": next_id("note"),
                "title": "Distributed Streaming & Kafka Architecture",
                "description": "Partitions, consumer groups, offset management, and fault tolerance in high-throughput distributed messaging.",
                "subject": "Data Engineering",
                "classId": str(c2["_id"]) if c2 else "class-cs301",
                "className": c2.get("name", "CS 301 — Data Engineering") if c2 else "CS 301 — Data Engineering",
                "tags": ["Kafka", "Streaming", "Distributed Systems"],
                "fileName": "CS301_Kafka_Pipelines.pdf",
                "fileId": None,
                "fileSize": 248900,
                "fileSha256": "5b8e4c0f39a8d21e9b6f0c4d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d1",
                "status": "approved",
                "isDeleted": False,
                "uploadedBy": admin_id,
                "uploaderName": admin_name,
                "autoPublished": True,
                "createdAt": now,
                "updatedAt": now
            },
            {
                "_id": next_id("note"),
                "title": "Cellular Respiration & Krebs Cycle Cheatsheet",
                "description": "Step-by-step biochemical breakdown of glycolysis, citric acid cycle, electron transport chain, and ATP synthesis.",
                "subject": "Biology",
                "classId": str(c3["_id"]) if c3 else "class-bio110",
                "className": c3.get("name", "BIO 110 — Cell Biology") if c3 else "BIO 110 — Cell Biology",
                "tags": ["Biology", "Krebs Cycle", "Metabolism"],
                "fileName": "BIO110_Metabolism_Review.pdf",
                "fileId": None,
                "fileSize": 312450,
                "fileSha256": "6c9f5d1a40b9e32f0c7a1d5e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d2",
                "status": "approved",
                "isDeleted": False,
                "uploadedBy": admin_id,
                "uploaderName": admin_name,
                "autoPublished": True,
                "createdAt": now,
                "updatedAt": now
            }
        ]
        db["notes"].insert_many(notes)
