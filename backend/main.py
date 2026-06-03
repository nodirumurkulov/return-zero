from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import sizing, fitscores

app = FastAPI(title="Return Zero API")

import os
ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://*.vercel.app"
).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sizing.router, prefix="/api/sizing")
app.include_router(fitscores.router, prefix="/api/fitscores")


@app.on_event("startup")
async def warmup():
    from loaders.data import load_all
    from services.sizing import compute_sizing_signals
    load_all()
    compute_sizing_signals()


@app.get("/health")
def health():
    return {"status": "ok"}
