# ⚡ SkillForge — AI-Powered Hackathon Teammate Finder

> An intelligent developer matching platform that leverages GitHub-based skill verification, trust scoring algorithms, and TF-IDF cosine similarity to connect developers for hackathons and collaborative projects.

---

## Table of Contents

1. [Abstract](#abstract)
2. [Problem Statement](#problem-statement)
3. [System Architecture](#system-architecture)
4. [Technology Stack](#technology-stack)
5. [Core Modules](#core-modules)
6. [AI Matching Engine](#ai-matching-engine)
7. [GitHub Skill Verification](#github-skill-verification)
8. [Trust Scoring System](#trust-scoring-system)
9. [Security Architecture](#security-architecture)
10. [Database Design](#database-design)
11. [API Reference](#api-reference)
12. [Project Structure](#project-structure)
13. [Setup & Installation](#setup--installation)
14. [Environment Configuration](#environment-configuration)
15. [Deployment](#deployment)
16. [Future Enhancements](#future-enhancements)

---

## Abstract

SkillForge is a full-stack AI-powered web platform designed to solve the problem of inefficient team formation in hackathons and collaborative software projects. Traditional teammate-finding methods rely on self-reported skills, social networks, or random matching — all of which suffer from information asymmetry and lack of objective verification.

SkillForge addresses this by:
- **Verifying skills objectively** through GitHub repository analysis (languages, commit activity, stars, forks)
- **Computing trust scores** based on GitHub activity quality and profile completeness
- **Matching developers** using TF-IDF vectorization and cosine similarity on verified skill data
- **Enforcing security** through Firebase Authentication with server-side token verification and RBAC

The system follows a hybrid architecture: Firebase handles authentication and identity, while a Python FastAPI backend handles all AI logic, GitHub API integration, and business rules — ensuring clean separation of concerns and production-grade security.

---

## Problem Statement

Hackathon team formation suffers from three core problems:

| Problem | Impact |
|---|---|
| Self-reported skills are unverifiable | Teams form based on inflated or inaccurate skill claims |
| No objective compatibility metric | Random or social-bias-driven matching leads to skill imbalances |
| No trust or credibility signal | Bad actors or inactive developers waste team slots |

SkillForge solves all three by grounding every match in real, verifiable GitHub data processed through an AI pipeline.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│         React 18 + TypeScript + Vite (Port 3000)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Firebase Auth│  │  Axios + JWT │  │  Vite Dev Proxy  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼───────────────────┼────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────┐  ┌──────────────────────────────────────┐
│  Firebase Auth  │  │        FastAPI Backend (Port 8080)    │
│  (Google Cloud) │  │                                      │
│                 │  │  ┌────────────┐  ┌────────────────┐  │
│  • ID Token     │  │  │ Auth       │  │  Rate Limiter  │  │
│    Generation   │  │  │ Middleware │  │  (slowapi)     │  │
│  • Token        │  │  └─────┬──────┘  └────────────────┘  │
│    Verification │  │        │                              │
└─────────────────┘  │  ┌─────▼──────────────────────────┐  │
                     │  │         Router Layer            │  │
                     │  │  /users  /github  /matching     │  │
                     │  │  /admin                         │  │
                     │  └─────┬──────────────────────────┘  │
                     │        │                              │
                     │  ┌─────▼──────────────────────────┐  │
                     │  │        Service Layer            │  │
                     │  │  GitHub Service  │  AI Matching │  │
                     │  │  Trust Score     │  Engine      │  │
                     │  └─────┬──────────────────────────┘  │
                     └────────┼─────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌────────────────┐ ┌──────────┐ ┌──────────────┐
     │ Cloud Firestore│ │ GitHub   │ │ Firebase     │
     │ (default)      │ │ REST API │ │ Admin SDK    │
     │ Native Mode    │ │ v3       │ │              │
     └────────────────┘ └──────────┘ └──────────────┘
```

### Request Flow

```
User Action
    │
    ▼
React Component
    │
    ▼
Axios Interceptor → attaches Firebase ID Token as Bearer header
    │
    ▼
Vite Proxy → forwards to FastAPI (same-origin, no CORS)
    │
    ▼
FirebaseAuthMiddleware → verifies token via Firebase Admin SDK
    │
    ├── Invalid Token → 401 Unauthorized
    │
    ▼
Route Handler → business logic
    │
    ▼
Firestore / GitHub API / AI Engine
    │
    ▼
JSON Response → React UI update
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI component framework |
| TypeScript | 5.x | Type-safe JavaScript |
| Vite | 8.x | Build tool and dev server with proxy |
| React Router DOM | 6.x | Client-side routing |
| Axios | 1.x | HTTP client with interceptors |
| Firebase SDK | 11.x | Authentication and Firestore client |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.13 | Runtime |
| FastAPI | 0.115.5 | Async REST API framework |
| Uvicorn | 0.32.1 | ASGI server |
| Firebase Admin SDK | 6.5.0 | Server-side token verification and Firestore |
| httpx | 0.27.0 | Async HTTP client for GitHub API |
| scikit-learn | 1.5.2 | TF-IDF vectorization and cosine similarity |
| numpy | 2.1.3 | Numerical computation |
| slowapi | 0.1.9 | Rate limiting middleware |
| Pydantic | 2.10.3 | Request/response validation |
| python-dotenv | 1.0.1 | Environment variable management |

### Infrastructure
| Service | Purpose |
|---|---|
| Firebase Authentication | Identity management, JWT token issuance |
| Cloud Firestore (Native Mode) | NoSQL document database |
| GitHub REST API v3 | Repository and activity data source |

---

## Core Modules

### 1. Authentication Module (`app/middleware/auth.py`)

Implements a Starlette `BaseHTTPMiddleware` that intercepts every HTTP request. Public paths (`/`, `/docs`, `/health`) bypass authentication. All other routes require a valid Firebase ID token in the `Authorization: Bearer <token>` header.

The middleware calls `firebase_admin.auth.verify_id_token()` which:
- Validates the JWT signature using Google's public keys
- Checks token expiry
- Extracts the user's UID and claims

The verified user object is attached to `request.state.user` for downstream handlers.

**Key design decision:** The middleware returns `JSONResponse` directly instead of raising `HTTPException` — this is required because `BaseHTTPMiddleware` does not propagate exceptions through FastAPI's exception handler pipeline.

### 2. GitHub Verification Engine (`app/services/github_service.py`)

Makes two async HTTP calls to the GitHub REST API v3:
1. `GET /users/{username}` — fetches user metadata (repos, followers, bio)
2. `GET /users/{username}/repos?sort=pushed&per_page=100` — fetches repository list

**Analysis logic:**
- Skips forked repositories (quality signal — only original work counts)
- Counts language frequency across original repos
- Calculates `recent_pushes` — repos with commits in the last 180 days (recency weighting)
- Computes a composite `activity_score`:

```
activity_score = min(10.0,
    recent_pushes × 0.5
  + total_stars   × 0.03
  + total_forks   × 0.05
  + repo_count    × 0.1
  + followers     × 0.05
)
```

Results are persisted to the `github_profiles` Firestore collection.

### 3. Trust Scoring Engine (`app/services/trust_score.py`)

Produces a 0–10 trust score from two components:

**Activity Component (0–5):**
```
raw = recent_pushes × 0.4 + total_stars × 0.02
    + total_forks × 0.03 + repo_count × 0.05
activity = min(5.0, raw)
```

**Completeness Component (0–5):**
- Base: (filled profile fields / 4) × 4.0
- +0.5 bonus if languages detected
- +0.5 bonus if GitHub bio present
- Capped at 5.0

**Trust Labels:**
| Score | Label |
|---|---|
| ≥ 7.0 | High |
| ≥ 4.0 | Medium |
| < 4.0 | Low |

### 4. AI Matching Engine (`app/services/ai_matching.py`)

The core intelligence of SkillForge. Computes pairwise compatibility between two developer profiles using a weighted multi-factor model.

---

## AI Matching Engine

### TF-IDF Skill Vectorization

Languages are converted to a weighted text corpus. Each language token is repeated proportional to its frequency in the developer's repositories:

```python
# Python appears 8 times, JavaScript 3 times
tokens = ["Python"] * 8 + ["JavaScript"] * 3
text = "Python Python Python Python Python Python Python Python JavaScript JavaScript JavaScript"
```

This ensures that a developer's primary language has higher TF-IDF weight than secondary languages, producing more accurate cosine similarity scores.

### Compatibility Formula

```
Compatibility = 0.40 × Skill Similarity
              + 0.25 × Activity Similarity
              + 0.20 × Trust Score Similarity
              + 0.15 × Experience Level Similarity
```

**Skill Similarity** — TF-IDF cosine similarity between language vectors:
```
cos(θ) = (A · B) / (||A|| × ||B||)
```
Range: [0, 1] where 1 = identical skill profile

**Activity Similarity** — Normalized absolute difference:
```
activity_sim = 1 - |act_a/10 - act_b/10|
```
Rewards similar activity levels (complementary work ethic)

**Trust Similarity** — Same formula applied to trust scores:
```
trust_sim = 1 - |trust_a/10 - trust_b/10|
```

**Experience Similarity** — Ordinal encoding (beginner=1, intermediate=2, advanced=3):
```
exp_sim = 1 - |exp_a - exp_b| / 2
```

### Explanation Generation

The engine generates a natural language explanation for each match:
```
"Excellent match with Alice — strong Python, JavaScript overlap,
 very active on GitHub, high trust score, same intermediate level."
```

---

## GitHub Skill Verification

### Data Pipeline

```
GitHub Username (from profile)
        │
        ▼
GitHub API: GET /users/{username}
        │
        ▼
GitHub API: GET /users/{username}/repos
        │
        ▼
Filter: exclude forks
        │
        ▼
Aggregate: languages, stars, forks, recent_pushes
        │
        ▼
Compute: activity_score
        │
        ▼
Persist: Firestore github_profiles/{uid}
        │
        ▼
Compute: trust_score
        │
        ▼
Persist: Firestore trust_scores/{uid}
```

### Rate Limiting

The `/github/analyze` endpoint is rate-limited to **10 requests per minute per IP** using slowapi to prevent GitHub API quota exhaustion. The GitHub token provides 5,000 requests/hour vs 60/hour unauthenticated.

---

## Trust Scoring System

The trust score serves as a credibility signal that prevents low-quality or inactive profiles from appearing in recommendations. It is:

- **Objective** — derived entirely from verifiable GitHub data
- **Composite** — combines activity quality with profile completeness
- **Bounded** — always in [0, 10] range
- **Labeled** — High/Medium/Low for human readability

The trust score influences matching through the `trust_similarity` component, which rewards pairing developers with similar trust levels — ensuring high-trust developers are matched with other high-trust developers.

---

## Security Architecture

### Authentication Flow

```
1. User submits email/password to Firebase Auth
2. Firebase validates credentials, issues signed JWT (ID Token)
3. Frontend stores token in memory (not localStorage)
4. Axios interceptor calls user.getIdToken() before each request
   (auto-refreshes if expired)
5. Token sent as Authorization: Bearer <token>
6. FastAPI middleware calls firebase_admin.auth.verify_id_token()
7. Google's public keys validate JWT signature
8. UID extracted and attached to request.state.user
9. Route handler uses UID for Firestore operations
```

### RBAC (Role-Based Access Control)

Admin routes verify the user's role from Firestore — never from the JWT claims or frontend:

```python
def _require_admin(request: Request) -> str:
    uid = request.state.user["uid"]
    doc = db.collection("users").document(uid).get()
    if doc.to_dict().get("role") != "admin":
        raise HTTPException(status_code=403)
```

This prevents privilege escalation even if a user modifies their local token.

### Security Measures

| Layer | Measure |
|---|---|
| Transport | HTTPS in production, Vite proxy in development |
| Authentication | Firebase JWT with RS256 signature |
| Authorization | Server-side RBAC from Firestore |
| Input Validation | Pydantic models with regex validators |
| Rate Limiting | slowapi per-IP limits on sensitive endpoints |
| Secret Management | Environment variables only, never in source code |
| GitHub API | Server-side only, token never exposed to frontend |
| Error Handling | Generic error messages in production (no stack traces) |

---

## Database Design

### Firestore Collections

**`users` collection**
```
{
  id: string,              // Firebase UID (document ID)
  name: string,
  email: string,
  github_username: string,
  experience_level: "beginner" | "intermediate" | "advanced",
  role: "user" | "admin",
  flagged: boolean         // admin moderation flag
}
```

**`github_profiles` collection**
```
{
  user_id: string,
  username: string,
  repo_count: number,
  followers: number,
  languages: string[],     // top 5 languages
  language_counts: object, // { "Python": 8, "JS": 3 }
  total_stars: number,
  total_forks: number,
  recent_pushes: number,   // repos pushed in last 180 days
  activity_score: number,  // 0-10
  avatar_url: string,
  bio: string
}
```

**`trust_scores` collection**
```
{
  user_id: string,
  score: number,           // 0-10
  label: "High" | "Medium" | "Low",
  activity_component: number,
  completeness_component: number
}
```

### Design Rationale

Firestore was chosen over a relational database for:
- **Schemaless flexibility** — profile fields can evolve without migrations
- **Firebase Admin SDK integration** — same service account for Auth + Firestore
- **Real-time capability** — future live matching features
- **Horizontal scalability** — automatic sharding

---

## API Reference

All endpoints except `/`, `/health`, `/docs` require `Authorization: Bearer <firebase_id_token>`.

### User Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/users/profile` | Create or update user profile | Required |
| `GET` | `/users/profile` | Get current user's profile | Required |

### GitHub Endpoints

| Method | Path | Description | Rate Limit |
|---|---|---|---|
| `POST` | `/github/analyze` | Analyze GitHub profile + compute trust score | 10/min |
| `GET` | `/github/profile/{user_id}` | Get stored GitHub analysis | None |

### Matching Endpoints

| Method | Path | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/matching/recommendations` | Get AI teammate recommendations | 20/min |

### Admin Endpoints (role: admin required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/users` | List all users with trust scores |
| `DELETE` | `/admin/users/{id}` | Remove user and all associated data |
| `PATCH` | `/admin/users/{id}/flag` | Toggle flag status on a user |
| `GET` | `/admin/stats` | Platform statistics |

### Response Format

All responses follow consistent JSON structure:

```json
// Success
{ "data": { ... } }

// Error
{ "detail": "Human-readable error message" }

// Validation Error (422)
{ "detail": [{ "loc": ["body", "field"], "msg": "error", "type": "value_error" }] }
```

---

## Project Structure

```
SkillForge/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── firebase.py        # Firebase Admin SDK init + Firestore client
│   │   │   └── limiter.py         # Shared slowapi rate limiter instance
│   │   ├── middleware/
│   │   │   └── auth.py            # Firebase token verification middleware
│   │   ├── models/
│   │   │   └── schemas.py         # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── users.py           # Profile CRUD endpoints
│   │   │   ├── github.py          # GitHub analysis endpoints
│   │   │   ├── matching.py        # AI recommendation endpoints
│   │   │   └── admin.py           # Admin panel endpoints
│   │   ├── services/
│   │   │   ├── github_service.py  # GitHub API integration
│   │   │   ├── trust_score.py     # Trust scoring algorithm
│   │   │   └── ai_matching.py     # TF-IDF cosine similarity engine
│   │   └── main.py                # FastAPI app, middleware, router registration
│   ├── serviceAccountKey.json     # Firebase service account (NOT committed)
│   ├── .env                       # Environment variables (NOT committed)
│   ├── .env.example               # Template for environment variables
│   └── requirements.txt           # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GlassCard.tsx      # Glassmorphism card container
│   │   │   ├── GlowButton.tsx     # Animated button with glow effect
│   │   │   ├── CompatibilityRing.tsx  # SVG animated score ring
│   │   │   ├── TrustBadge.tsx     # Color-coded trust label
│   │   │   ├── SkeletonCard.tsx   # Loading skeleton UI
│   │   │   ├── Navbar.tsx         # Navigation with auth state
│   │   │   └── ProtectedRoute.tsx # Auth guard for private routes
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Firebase auth state provider
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx    # Public landing with hero + features
│   │   │   ├── LoginPage.tsx      # Firebase email/password login
│   │   │   ├── SignupPage.tsx     # Firebase account creation
│   │   │   ├── ProfilePage.tsx    # Profile setup form
│   │   │   ├── DashboardPage.tsx  # GitHub analysis + stats
│   │   │   ├── TeammatesPage.tsx  # AI recommendations with filters
│   │   │   └── AdminPage.tsx      # Admin panel with user management
│   │   ├── services/
│   │   │   ├── api.ts             # Axios instance with token interceptor
│   │   │   ├── authService.ts     # Firebase auth wrappers
│   │   │   └── skillforgeApi.ts   # Typed API call functions
│   │   ├── firebase.ts            # Firebase app initialization
│   │   ├── App.tsx                # Router configuration
│   │   ├── main.tsx               # React entry point
│   │   └── index.css              # Global dark glassmorphism theme
│   ├── .env                       # Frontend env vars (NOT committed)
│   ├── .env.example               # Template for frontend env vars
│   ├── vite.config.ts             # Vite config with dev proxy
│   └── package.json
│
├── .gitignore                     # Excludes .env, serviceAccountKey.json
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Firebase project with Firestore (Native mode) and Email/Password Auth enabled
- GitHub Personal Access Token (classic, `public_repo` scope)

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your values

# Start server
uvicorn app.main:app --reload --port 8080
```

API documentation available at: http://localhost:8080/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# Edit .env with your Firebase config

# Start development server
npm run dev
```

Application runs at: http://localhost:3000

---

## Environment Configuration

### Backend (`backend/.env.example`)

```env
# GitHub Personal Access Token (classic)
# Scopes required: public_repo
# Generate at: https://github.com/settings/tokens
GITHUB_TOKEN=<your_github_pat>

# Path to Firebase service account JSON
# Download from: Firebase Console → Project Settings → Service Accounts
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json

# Comma-separated allowed CORS origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (`frontend/.env.example`)

```env
# Firebase Web App Configuration
# Found at: Firebase Console → Project Settings → Your Apps → Web App
VITE_FIREBASE_API_KEY=<firebase_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<project_id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project_id>

# Backend API URL (Vite proxy handles routing in development)
VITE_API_BASE_URL=http://localhost:3000
```

> **Security Note:** Never commit `.env` files or `serviceAccountKey.json` to version control. Both are listed in `.gitignore`.

---

## Deployment

### Backend — Render / Railway

```bash
# Procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set environment variables in the platform dashboard:
- `GITHUB_TOKEN`
- `FIREBASE_SERVICE_ACCOUNT_PATH` (or inline JSON as `FIREBASE_SERVICE_ACCOUNT_JSON`)
- `ALLOWED_ORIGINS` (set to your Vercel frontend URL)

### Frontend — Vercel

```bash
# Build command
npm run build

# Output directory
dist
```

Set environment variables in Vercel dashboard:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_API_BASE_URL` (set to your Render/Railway backend URL)

Update `vite.config.ts` for production — remove the dev proxy and rely on CORS headers from the backend.

---

## Future Enhancements

| Feature | Technical Approach |
|---|---|
| Real-time notifications | Firestore `onSnapshot` listeners |
| Team formation (3+ members) | Graph-based multi-party matching |
| Skill endorsements | Peer verification with weighted trust delta |
| GitHub commit analysis | GitHub GraphQL API for contribution calendar |
| ML model upgrade | Sentence-BERT embeddings for README semantic similarity |
| OAuth login | Firebase Google/GitHub provider |
| Email notifications | Firebase Cloud Functions + SendGrid |
| Mobile app | React Native with shared Firebase config |

---

## Academic References

1. Salton, G., & Buckley, C. (1988). *Term-weighting approaches in automatic text retrieval*. Information Processing & Management, 24(5), 513–523. — Foundation of TF-IDF
2. Manning, C. D., Raghavan, P., & Schütze, H. (2008). *Introduction to Information Retrieval*. Cambridge University Press. — Cosine similarity in vector space models
3. Google Firebase Documentation. *Firebase Authentication — Verify ID Tokens*. https://firebase.google.com/docs/auth/admin/verify-id-tokens
4. GitHub REST API Documentation. *Repositories*. https://docs.github.com/en/rest/repos/repos

---

## License

MIT License — see `LICENSE` file for details.

---

*Built with ⚡ for hackathons, by developers, for developers.*
