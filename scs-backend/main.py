from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.mongodb import get_database
from modules.products.router import router as products_router
from modules.warehouses.router import router as warehouses_router
from modules.auth.router import router as auth_router
from modules.movements.router import router as movements_router

app = FastAPI(title="scs-backend", root_path="")
origins = [
    "http://localhost:5173",  # Local (Vite)
    "https://scs-foafjil5r-cesarks81-4647s-projects.vercel.app", # Tu URL de Vercel
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(products_router, prefix="/api/products")
app.include_router(warehouses_router, prefix="/api/warehouses")
app.include_router(movements_router, prefix="/api/movements")

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "scs-backend API"}

@app.get("/api/test")
async def test():
    return {"status": "ok"}

@app.get("/api/health")
async def health():
    try:
        db = await get_database()
        await db.command("ping")
        return {"mongodb": "ok"}
    except Exception as e:
        return {"mongodb": "error", "detail": str(e)}