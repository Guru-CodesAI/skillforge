from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal, Optional
import re

GITHUB_USERNAME_RE = re.compile(r'^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$')

class UserProfileCreate(BaseModel):
    name: str
    email: EmailStr
    github_username: str
    experience_level: Literal["beginner", "intermediate", "advanced"]

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("github_username")
    @classmethod
    def github_username_valid(cls, v: str) -> str:
        v = v.strip().lstrip("@")
        if not v:
            raise ValueError("GitHub username cannot be empty")
        if not GITHUB_USERNAME_RE.match(v):
            raise ValueError("Invalid GitHub username format")
        return v

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    github_username: str
    experience_level: str
    role: str
    trust_score: Optional[float] = None

class MatchRequest(BaseModel):
    target_user_id: str
