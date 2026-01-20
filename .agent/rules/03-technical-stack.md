# Technical Stack

## Languages

| Layer | Language | Version |
|-------|----------|---------|
| **Backend** | Python | 3.11+ |
| **Frontend** | TypeScript | 5.0+ |
| **Database** | SQL (PostgreSQL) | 15+ |

## Frameworks & Libraries

### Backend

| Category | Choice | Version | Notes |
|----------|--------|---------|-------|
| Web Framework | FastAPI | 0.100+ | Async, automatic OpenAPI docs |
| ORM | SQLAlchemy | 2.0+ | Async support with `asyncpg` |
| Database Driver | asyncpg | 0.28+ | Async PostgreSQL driver |
| Migrations | Alembic | 1.12+ | Database schema migrations |
| Validation | Pydantic | 2.0+ | Request/response validation |
| Auth | python-jose | 3.3+ | JWT token handling |
| Password Hashing | passlib[bcrypt] | 1.7+ | Secure password storage |
| PDF Generation | WeasyPrint | 60+ | HTML/CSS to PDF |
| AI Integration | anthropic | latest | Claude API for content generation |
| File Upload | python-multipart | 0.0.6+ | File upload handling |
| Cloud Storage | boto3 | 1.28+ | S3-compatible storage |

### Frontend

| Category | Choice | Version | Notes |
|----------|--------|---------|-------|
| Framework | React | 18+ | Component-based UI |
| Build Tool | Vite | 5+ | Fast development server |
| Styling | Tailwind CSS | 3.4+ | Utility-first CSS |
| HTTP Client | Axios | 1.6+ | API requests |
| State Management | React Query | 5+ | Server state caching |
| Forms | React Hook Form | 7+ | Form handling |
| Routing | React Router | 6+ | Client-side routing |
| Icons | Lucide React | 0.300+ | Consistent icon set |
| Date Handling | date-fns | 2.30+ | Date formatting |
| Notifications | react-hot-toast | 2.4+ | Toast notifications |

## Infrastructure

| Component | Choice | Notes |
|-----------|--------|-------|
| **Database** | PostgreSQL 15+ | Managed instance (e.g., Supabase, Railway, or self-hosted) |
| **File Storage** | S3-compatible | AWS S3, MinIO, or Cloudflare R2 for venue photos |
| **Hosting** | Cloud VM or PaaS | Railway, Render, or VPS with Docker |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Secrets** | Environment variables | `.env` files locally, platform secrets in production |

## Architecture Pattern

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   FastAPI       │────▶│   PostgreSQL    │
│   (Vite)        │◀────│   Backend       │◀────│   Database      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                     ┌───────────┼───────────┐
                     ▼           ▼           ▼
               ┌─────────┐ ┌─────────┐ ┌─────────┐
               │ Claude  │ │   S3    │ │WeasyPrint│
               │  API    │ │ Storage │ │  (PDF)  │
               └─────────┘ └─────────┘ └─────────┘
```

### API Design
- RESTful API with JSON payloads
- JWT-based authentication
- OpenAPI/Swagger documentation auto-generated
- Async endpoints for database operations

## Project Structure

```
venue-mapping-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Settings and env vars
│   │   ├── database.py             # Database connection
│   │   ├── models/                 # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── user.py
│   │   │   ├── venue.py
│   │   │   ├── project.py
│   │   │   └── ...
│   │   ├── schemas/                # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── venue.py
│   │   │   └── ...
│   │   ├── api/                    # API routes
│   │   │   ├── __init__.py
│   │   │   ├── deps.py             # Dependencies (auth, db)
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── venues.py
│   │   │   ├── projects.py
│   │   │   └── ...
│   │   ├── services/               # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── pdf_generator.py
│   │   │   ├── ai_content.py
│   │   │   └── storage.py
│   │   └── templates/              # PDF HTML templates
│   │       └── proposal/
│   ├── alembic/                    # Database migrations
│   ├── tests/
│   ├── requirements.txt
│   └── pyproject.toml
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                    # API client functions
│   │   ├── components/             # Reusable components
│   │   │   ├── ui/                 # Base UI components
│   │   │   ├── venues/
│   │   │   ├── projects/
│   │   │   └── ...
│   │   ├── pages/                  # Page components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── types/                  # TypeScript types
│   │   ├── utils/                  # Utility functions
│   │   └── styles/                 # Global styles
│   ├── public/
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── .agent/                         # Antigravity config
├── docs/
├── docker-compose.yml
└── README.md
```

## Development Environment Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (local or Docker)
- pnpm (preferred) or npm

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env      # Configure environment variables
alembic upgrade head      # Run migrations
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
pnpm install
cp .env.example .env      # Configure API URL
pnpm dev
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/venue_mapping
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
S3_BUCKET=venue-photos
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
ANTHROPIC_API_KEY=...
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| FastAPI over Django/Flask | Async support, automatic docs, modern Python |
| SQLAlchemy 2.0 | Native async, better typing, industry standard |
| WeasyPrint over Puppeteer | Pure Python, no browser dependency, CSS support |
| React Query over Redux | Server state focus, automatic caching, simpler |
| Tailwind over CSS modules | Rapid development, consistent design system |
| JWT over sessions | Stateless API, easier horizontal scaling |

## External Integrations

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| Claude API | AI content generation | API Key (header) |
| S3-compatible storage | Photo uploads | Access Key + Secret |
| SMTP (future) | Email sending | Credentials |
