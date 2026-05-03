from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
import os

from app.core.firebase import init_firebase
from app.core.limiter import limiter
from app.middleware.auth import FirebaseAuthMiddleware
from app.routers import users, github, matching, admin

load_dotenv()
init_firebase()

app = FastAPI(title="SkillForge API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Re-raise HTTPException so its status code is preserved;
# only catch truly unexpected errors as 500.
@app.exception_handler(HTTPException)
async def passthrough_http_exception(request: Request, exc: HTTPException):
    return await http_exception_handler(request, exc)

# Temporarily disabled to expose real errors during development
# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     return JSONResponse(
#         status_code=500,
#         content={"detail": "An unexpected error occurred. Please try again."},
#     )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(FirebaseAuthMiddleware)

app.include_router(users.router)
app.include_router(github.router)
app.include_router(matching.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"status": "SkillForge API running"}

@app.get("/health")
def health():
    return {"status": "ok"}
