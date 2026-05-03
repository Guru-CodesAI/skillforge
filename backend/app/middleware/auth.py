from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.firebase import verify_firebase_token

PUBLIC_PATHS = {"/", "/docs", "/openapi.json", "/redoc", "/health"}

class FirebaseAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            # Must return JSONResponse directly — raising HTTPException inside
            # BaseHTTPMiddleware does not work correctly with exception handlers
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid authorization header"},
            )

        token = auth_header.split(" ", 1)[1]
        user = verify_firebase_token(token)
        if not user:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
            )

        request.state.user = user
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            import traceback
            print(f"[ROUTE ERROR] {type(e).__name__}: {e}")
            traceback.print_exc()
            return JSONResponse(status_code=500, content={"detail": str(e)})
