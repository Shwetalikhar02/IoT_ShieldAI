"""
modules/m1_analysis/dl_classifier.py — Deep Learning & LLM Vulnerability Classifier
===================================================================================
Responsibility:
    Classify vulnerability types and map to candidate CWE IDs and fix templates.
    Implements a VulnClassifier interface with:
      1. LLM-backed classification (using the unified llm_client)
      2. Documented hook for local transformer models (CodeBERT / GraphCodeBERT)

Inputs:
    code_snippet: str      — Target source code segment
    context: str | None    — Minimal localized context

Outputs:
    ClassificationResult   — { cwe_id, vuln_type, confidence, candidate_template_ids }
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logger import get_logger
from app.modules.m2_repair.llm_client import get_llm_client

log = get_logger(__name__)


class ClassificationResult(BaseModel):
    """Normalized classification outcome from DL or LLM models."""

    cwe_id: str = Field(..., description="Predicted CWE identifier (e.g. CWE-121).")
    vuln_type: str = Field(..., description="Human-readable vulnerability classification.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model prediction confidence score.")
    candidate_template_ids: list[str] = Field(
        default_factory=list, description="IDs of matching fix templates in fix_templates/."
    )


class VulnClassifier(ABC):
    """Abstract interface for vulnerability classification backends."""

    @abstractmethod
    async def classify(
        self,
        code_snippet: str,
        context: str | None = None,
    ) -> ClassificationResult:
        """Analyze code segment and predict vulnerability category."""
        ...


class LLMVulnClassifier(VulnClassifier):
    """LLM-backed classifier leveraging prompt engineering for zero-shot CWE classification."""

    async def classify(
        self,
        code_snippet: str,
        context: str | None = None,
    ) -> ClassificationResult:
        prompt = (
            f"Analyze the following C/C++ IoT firmware code snippet and classify its vulnerability.\n\n"
            f"Code:\n```c\n{code_snippet}\n```\n"
        )
        if context:
            prompt += f"\nContext:\n```c\n{context}\n```\n"

        llm = get_llm_client()
        result = await llm.generate_structured(
            prompt=prompt,
            response_model=ClassificationResult,
            system_prompt=(
                "You are an automated IoT firmware security auditor. Classify vulnerabilities into "
                "standard CWE categories (CWE-121, CWE-476, CWE-134, CWE-416, CWE-190). "
                "Provide confidence between 0.0 and 1.0."
            ),
        )
        return result


class CodeBERTClassifier(VulnClassifier):
    """Hook for local fine-tuned transformer model (e.g. Microsoft CodeBERT / UniXcoder).
    
    Architecture Note:
        In production environments with dedicated GPU acceleration, this class loads
        weights via HuggingFace transformers (`AutoModelForSequenceClassification`)
        for low-latency on-premise classification without external API calls.
    """

    def __init__(self, model_path: str = "models/codebert-iot-vuln") -> None:
        self.model_path = model_path
        self._is_loaded = False

    async def classify(
        self,
        code_snippet: str,
        context: str | None = None,
    ) -> ClassificationResult:
        log.info("CodeBERTClassifier invoked (hook stub; delegating to LLMClassifier)")
        fallback = LLMVulnClassifier()
        return await fallback.classify(code_snippet, context)


def get_classifier() -> VulnClassifier:
    """Factory returning the active vulnerability classifier."""
    return LLMVulnClassifier()
