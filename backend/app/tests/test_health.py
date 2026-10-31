"""
tests/test_health.py — Health Endpoint Tests
=============================================
Responsibility:
    Verify that the FastAPI application starts correctly and that the
    GET /health endpoint responds with status 200 and the expected payload.
    This is the minimum test that must pass for the CI check_all script.

TODO:
    - Add tests for all API route stubs (expect 200 or 422, not 500).
    - Add integration tests for the full pipeline once modules are implemented.
    - Add tests for Pydantic schema validation (invalid input → 422).
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_200():
    """GET /health must return HTTP 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_payload_structure():
    """GET /health must return the expected JSON keys."""
    response = client.get("/health")
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


def test_health_service_name():
    """GET /health must identify the service correctly."""
    response = client.get("/health")
    assert response.json()["service"] == "iot-shieldai-api"
