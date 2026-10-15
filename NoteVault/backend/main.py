import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ALLOWED_ORIGINS, PORT
from seeder import seed_demo_data

from routers.auth_router import router as auth_router
from routers.notes_router import router as notes_router
from routers.community_router import router as community_router
from routers.admin_router import router as admin_router
from routers.ai_study_router import router as ai_study_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed demo users on startup
    try:
        seed_demo_data()
        print("[NoteVault] Demo accounts initialized.")
    except Exception as e:
        print(f"[NoteVault] Seeder notice: {e}")
    yield

app = FastAPI(
    title="NoteVault API",
    description="Python Backend for NoteVault with AI Study Chatbot & Content Generation",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS or ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(community_router)
app.include_router(admin_router)
app.include_router(ai_study_router)

@app.get("/")
def root():
    return {
        "name": "NoteVault API",
        "version": "2.0.0",
        "architecture": "Python FastAPI + MongoDB + AI Chatbot",
        "streamProcessing": "Decommissioned in favor of direct API"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
