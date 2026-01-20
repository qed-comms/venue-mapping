# Venue Mapping AI

Event venue sourcing and proposal generation platform for QED Event Management.

## Quick Start

### Prerequisites
- Python 3.11+
- Docker and Docker Compose (for PostgreSQL)
- Node.js 20+ (for frontend, Phase 2)

### Backend Setup

1. **Start PostgreSQL database:**
```bash
docker-compose up -d
```

2. **Set up Python environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

4. **Run database migrations:**
```bash
alembic upgrade head
```

5. **Start the backend server:**
```bash
uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Project Structure

```
venue-mapping-ai/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── api/             # API routes
│   │   ├── services/        # Business logic
│   │   ├── templates/       # PDF templates
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database setup
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   ├── tests/               # Tests
│   └── requirements.txt     # Python dependencies
├── frontend/                # React frontend (Phase 2)
├── docs/                    # Documentation
└── docker-compose.yml       # PostgreSQL setup
```

## Development

### Database Migrations

```bash
# Generate a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### Running Tests

```bash
cd backend
pytest
```

## Documentation

- [Project Status](docs/PROJECT.md)
- [Architecture Decisions](docs/DECISIONS.md)
- [Task Log](docs/TASK-LOG.md)

## Tech Stack

**MVP (Phase 1):**
- **Backend**: FastAPI, SQLAlchemy 2.0, PostgreSQL
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **PDF Generation**: WeasyPrint
- **Authentication**: JWT tokens with bcrypt password hashing

**Future Phases:**
- **Phase 2**: AI content generation (Anthropic Claude API)
- **Phase 3**: Analytics, Activity logging, S3 storage for photos

## License

Proprietary - QED Event Management
