"""Shared dependency injection container."""

from functools import lru_cache

from natural_gate.core.config import Settings, settings


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return settings
