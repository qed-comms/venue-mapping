"""Application configuration using Pydantic Settings."""
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/venue_mapping",
        description="PostgreSQL connection URL with asyncpg driver"
    )
    
    # JWT Authentication
    SECRET_KEY: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key for JWT token signing"
    )
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60,
        description="JWT token expiration time in minutes"
    )
    
    # Application
    DEBUG: bool = Field(default=True, description="Debug mode")
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated list of allowed CORS origins"
    )
    
    # S3 Storage (optional)
    S3_BUCKET: str = Field(default="venue-photos", description="S3 bucket name")
    S3_ENDPOINT: str = Field(
        default="https://s3.amazonaws.com",
        description="S3 endpoint URL"
    )
    S3_ACCESS_KEY: str = Field(default="", description="S3 access key")
    S3_SECRET_KEY: str = Field(default="", description="S3 secret key")
    
    # AI Integration (Phase 2)
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key")
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
