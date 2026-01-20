"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, clients, projects, venues
from app.config import settings

# Create FastAPI application
app = FastAPI(
    title="Venue Mapping AI",
    description="Event venue sourcing and proposal generation platform for QED Event Management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for photo uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(venues.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify the API is running."""
    return {
        "status": "healthy",
        "service": "venue-mapping-ai",
        "version": "1.0.0"
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Venue Mapping AI API",
        "docs": "/docs",
        "health": "/health"
    }

from fastapi import Request
@app.get("/debug-path")
@app.get("/api/v1/debug-path")
async def debug_path(request: Request):
    return {
        "path": request.url.path,
        "root_path": request.scope.get("root_path"),
        "headers": dict(request.headers)
    }
