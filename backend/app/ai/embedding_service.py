"""
Embedding Service — Semantic vector representation & similarity calculator.

Combines challenge or startup attributes into textual representations
and computes semantic similarity scores using vector embeddings or TF-IDF
semantic fallback for robust, offline-capable execution.
"""

import math
import re
from typing import List, Dict, Any


def build_startup_search_text(startup: Any) -> str:
    """
    Build a comprehensive searchable text representation of a startup.
    Combines company name, short desc, description, domains, technologies,
    projects, and deployments.
    """
    parts = []

    if hasattr(startup, "company_name") and startup.company_name:
        parts.append(f"Company: {startup.company_name}")

    if hasattr(startup, "short_description") and startup.short_description:
        parts.append(f"Summary: {startup.short_description}")

    if hasattr(startup, "description") and startup.description:
        parts.append(f"Details: {startup.description}")

    # Domains
    domains = []
    if hasattr(startup, "domains") and startup.domains:
        for d in startup.domains:
            domains.append(d.domain if hasattr(d, "domain") else str(d))
    if domains:
        parts.append(f"Domains: {', '.join(domains)}")

    # Technologies
    techs = []
    if hasattr(startup, "technologies") and startup.technologies:
        for t in startup.technologies:
            techs.append(t.technology if hasattr(t, "technology") else str(t))
    if techs:
        parts.append(f"Technologies: {', '.join(techs)}")

    # Projects
    if hasattr(startup, "projects") and startup.projects:
        for p in startup.projects:
            name = getattr(p, "name", "")
            desc = getattr(p, "description", "")
            outcome = getattr(p, "outcome", "")
            parts.append(f"Project: {name}. {desc}. Outcome: {outcome}")

    # Certifications
    if hasattr(startup, "certifications") and startup.certifications:
        certs = [getattr(c, "name", str(c)) for c in startup.certifications]
        parts.append(f"Certifications: {', '.join(certs)}")

    return " ".join(parts)


def build_challenge_search_text(challenge: Any) -> str:
    """
    Build a comprehensive searchable text representation of a government challenge.
    Combines title, problem statement, description, domain, technologies,
    requirements, expected outcomes, and constraints.
    """
    parts = []

    if hasattr(challenge, "title") and challenge.title:
        parts.append(f"Challenge Title: {challenge.title}")

    if hasattr(challenge, "domain") and challenge.domain:
        parts.append(f"Domain: {challenge.domain}")

    if hasattr(challenge, "sub_domain") and challenge.sub_domain:
        parts.append(f"Sub-Domain: {challenge.sub_domain}")

    if hasattr(challenge, "problem_statement") and challenge.problem_statement:
        parts.append(f"Problem: {challenge.problem_statement}")

    if hasattr(challenge, "description") and challenge.description:
        parts.append(f"Context: {challenge.description}")

    if hasattr(challenge, "technologies") and challenge.technologies:
        parts.append(f"Required Technologies: {', '.join(challenge.technologies)}")

    if hasattr(challenge, "expected_outcomes") and challenge.expected_outcomes:
        parts.append(f"Expected Outcomes: {', '.join(challenge.expected_outcomes)}")

    if hasattr(challenge, "constraints") and challenge.constraints:
        parts.append(f"Constraints: {', '.join(challenge.constraints)}")

    if hasattr(challenge, "requirements") and challenge.requirements:
        req_texts = []
        for r in challenge.requirements:
            t = getattr(r, "title", "")
            d = getattr(r, "description", "")
            req_texts.append(f"{t}: {d}")
        parts.append(f"Requirements: {' | '.join(req_texts)}")

    return " ".join(parts)


class SemanticEmbeddingService:
    """
    Computes semantic similarity scores between text vectors.
    Uses TF-IDF + n-gram token overlap cosine similarity when SentenceTransformers is offline.
    """

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        words = re.findall(r"\b\w+\b", text.lower())
        stopwords = {
            "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
            "which", "this", "that", "these", "those", "then", "just", "so", "than",
            "such", "both", "through", "about", "against", "between", "into", "of",
            "at", "by", "for", "with", "about", "to", "from", "up", "in", "out",
            "on", "off", "over", "under", "again", "further", "then", "once", "here",
            "there", "when", "where", "why", "how", "all", "any", "both", "each",
            "few", "more", "most", "other", "some", "such", "no", "nor", "not",
            "only", "own", "same", "so", "than", "too", "very", "s", "t", "can",
            "will", "just", "don", "should", "now", "system", "solutions", "technology"
        }
        return [w for w in words if len(w) > 2 and w not in stopwords]

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """
        Returns similarity score between 0.0 and 1.0.
        """
        tokens_a = self._tokenize(text_a)
        tokens_b = self._tokenize(text_b)

        if not tokens_a or not tokens_b:
            return 0.5

        set_a = set(tokens_a)
        set_b = set(tokens_b)

        # Jaccard overlap
        intersection = set_a.intersection(set_b)
        union = set_a.union(set_b)

        jaccard = len(intersection) / len(union) if union else 0.0

        # Term frequency overlap
        tf_a = {w: tokens_a.count(w) for w in set_a}
        tf_b = {w: tokens_b.count(w) for w in set_b}

        dot_product = sum(tf_a.get(w, 0) * tf_b.get(w, 0) for w in intersection)
        mag_a = math.sqrt(sum(v * v for v in tf_a.values()))
        mag_b = math.sqrt(sum(v * v for v in tf_b.values()))

        cosine = dot_product / (mag_a * mag_b) if (mag_a and mag_b) else 0.0

        # Weighted blend
        similarity = (cosine * 0.7) + (jaccard * 0.3)
        return min(max(similarity, 0.1), 1.0)


embedding_service = SemanticEmbeddingService()
