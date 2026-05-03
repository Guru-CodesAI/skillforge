import firebase_admin
from firebase_admin import credentials, auth, firestore
from dotenv import load_dotenv
import os

load_dotenv()

_initialized = False

def init_firebase():
    global _initialized
    if not _initialized:
        cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json"))
        firebase_admin.initialize_app(cred)
        _initialized = True

def verify_firebase_token(id_token: str) -> dict | None:
    try:
        return auth.verify_id_token(id_token)
    except Exception as e:
        print(f"[TOKEN ERROR] {type(e).__name__}: {e}")
        return None

def get_firestore():
    return firestore.client()
