"""
core/config.py — Application Configuration
============================================
Responsibility:
    Load and validate all application settings from environment variables
    (or a .env file) using Pydantic v2 BaseSettings. Provides a single
    `settings` singleton imported by every other module.

Inputs:
    Environment variables / .env file (see .env.example for full list).

Outputs:
    `settings` — a validated Settings instance accessible application-wide.

TODO:
    - Add field validators for LLM_API_BASE_URL (must be a valid URL).
    - Add a field for optional SQLite/PostgreSQL DATABASE_URL when persistence
      is added in a later sprint.
    - Consider splitting into sub-settings classes (LLMSettings, SandboxSettings)
      once the number of fields grows beyond ~30.
"""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object.  All values can be overridden via environment
    variables or a .env file placed at the project root.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    app_env: str = Field(default="development", description="development | production")
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)
    log_level: str = Field(default="INFO")

    # ── LLM Provider ────────────────────────────────────────────────────────
    llm_provider: str = Field(default="mock", description="mock | openai | anthropic | deepseek")
    llm_api_base_url: str = Field(default="")
    llm_base_url: str = Field(default="")
    llm_api_key: str = Field(default="", repr=False)  # repr=False hides key in logs/repr
    llm_model: str = Field(default="gpt-4o-mini")
    llm_max_tokens: int = Field(default=2048)
    llm_temperature: float = Field(default=0.2)
    llm_timeout_seconds: int = Field(default=60)
    llm_max_retries: int = Field(default=3)
    llm_mock: bool = Field(default=True, description="When true, use deterministic canned responses for offline testing")
    classifier_confidence_threshold: float = Field(default=0.75, description="Confidence threshold for automatic template routing")

    # ── Sandbox / Compiler ───────────────────────────────────────────────────
    sandbox_docker_image: str = Field(default="iot-shieldai-sandbox:latest")
    sandbox_timeout_seconds: int = Field(default=30)
    compiler: str = Field(default="gcc")
    asan_options: str = Field(default="halt_on_error=0:detect_leaks=1")

    # ── File Upload ──────────────────────────────────────────────────────────
    upload_max_size_mb: int = Field(default=10)
    upload_allowed_extensions: str = Field(default="c,cpp,h,hpp")

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS_ORIGINS into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def upload_allowed_ext_list(self) -> list[str]:
        """Parse comma-separated extensions into a list."""
        return [e.strip().lstrip(".") for e in self.upload_allowed_extensions.split(",")]


# Single shared instance — import this everywhere
settings = Settings()
