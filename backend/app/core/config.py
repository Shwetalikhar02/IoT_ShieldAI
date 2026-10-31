"""
core/config.py — Application Configuration
============================================
Responsibility:
    Load and validate ALL application settings from environment variables
    (or a .env file) using Pydantic v2 BaseSettings. Provides a single
    `settings` singleton imported by every other module.

Security:
    LLM_API_KEY is a SecretStr — never appears in repr, logs, or traces.
"""

from __future__ import annotations

from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# Project root = parent of this file's parent's parent's parent
# backend/app/core/config.py → parents[3] = project root
_PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Central settings object. All values can be overridden via environment
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
    llm_provider: str = Field(
        default="mock",
        description="mock | anthropic | openai | gemini | deepseek",
    )
    llm_mock: bool = Field(
        default=True,
        description="When true, use deterministic canned responses (offline/demo mode)",
    )
    llm_api_key: SecretStr = Field(default=SecretStr(""), description="LLM API key — NEVER logged")
    llm_base_url: str = Field(default="https://api.anthropic.com")
    llm_api_base_url: str = Field(default="")  # legacy alias
    # Model tiers
    llm_model: str = Field(default="claude-haiku-5-5")          # fast / small jobs
    llm_model_fast: str = Field(default="claude-haiku-5-5")     # classification, explanation
    llm_model_strong: str = Field(default="claude-sonnet-5-5")  # patch generation (Tier 2)
    llm_model_escalation: str = Field(default="claude-opus-5-5")  # Tier 3 third attempt
    llm_max_tokens: int = Field(default=2048)
    llm_temperature: float = Field(default=0.2)
    llm_timeout_seconds: int = Field(default=60)
    llm_max_retries: int = Field(default=3)
    send_code_to_external_llm: bool = Field(
        default=True,
        description="false = template-only mode; nothing leaves the machine",
    )

    # ── Classifier ──────────────────────────────────────────────────────────
    classifier_confidence_threshold: float = Field(
        default=0.75,
        description="Minimum confidence for auto template routing",
    )

    # ── Repair loop ─────────────────────────────────────────────────────────
    max_repair_attempts: int = Field(default=3, description="Max automated repair cycles")
    max_user_refinements: int = Field(default=5, description="Max chat refinement turns")

    # ── No-cheating thresholds ───────────────────────────────────────────────
    nocheat_min_statement_retention: float = Field(
        default=0.70,
        description="Min fraction of original statements that must survive in patch",
    )
    nocheat_max_lines_outside_span: int = Field(
        default=3,
        description="Max lines the patch may touch outside the vulnerable span",
    )

    # ── Sandbox / Compiler ───────────────────────────────────────────────────
    sandbox_docker_image: str = Field(default="iot-shieldai-sandbox:latest")
    sandbox_timeout_seconds: int = Field(default=30)
    sandbox_memory_limit: str = Field(default="256m")
    sandbox_network_disabled: bool = Field(default=True)
    compiler: str = Field(default="gcc", description="gcc | clang")
    asan_options: str = Field(default="halt_on_error=0:detect_leaks=1")

    # ── File Upload ──────────────────────────────────────────────────────────
    upload_max_size_mb: int = Field(default=10)
    upload_allowed_extensions: str = Field(default="c,cpp,h,hpp")
    upload_dir: str = Field(default=str(_PROJECT_ROOT / "backend" / "uploads"))
    reports_dir: str = Field(default=str(_PROJECT_ROOT / "backend" / "reports"))

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000"
    )

    # ── Database ─────────────────────────────────────────────────────────────
    database_url: str = Field(default="sqlite:///./shieldai.db")

    # ── Derived helpers ──────────────────────────────────────────────────────
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS_ORIGINS into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def upload_allowed_ext_list(self) -> list[str]:
        """Parse comma-separated extensions into a list."""
        return [e.strip().lstrip(".") for e in self.upload_allowed_extensions.split(",")]

    @property
    def llm_api_key_value(self) -> str:
        """Return the raw API key string (use only when actually calling the API)."""
        return self.llm_api_key.get_secret_value()


# Single shared instance — import this everywhere
settings = Settings()
