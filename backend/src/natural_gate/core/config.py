"""Core configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = ConfigDict(env_file=".env", case_sensitive=False)

    app_name: str = "Natural Gate Backend"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8080
    stripe_secret_key: str = "sk_test_placeholder"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/natural_gate"


settings = Settings()
