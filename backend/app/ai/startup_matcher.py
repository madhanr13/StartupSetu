"""
Startup Matcher — Core discovery engine & explainable scoring pipeline.

Calculates challenge-specific match scores using semantic vector similarity
retrieval + deterministic weighted capability breakdown + eligibility assessment.
Produces evidence-backed human-readable explanations ("Why recommended?").
"""

from typing import List, Any, Dict
from app.ai.embedding_service import (
    embedding_service,
    build_challenge_search_text,
    build_startup_search_text,
)
from app.ai.eligibility_analyzer import eligibility_analyzer
from app.schemas.startup import (
    StartupMatchRecommendation,
    MatchBreakdown,
    StartupSummary,
    StartupReadinessScoreSchema,
)


class StartupMatcher:
    """
    Ranks startups for a specific government challenge.
    """

    def rank_startups_for_challenge(
        self,
        challenge: Any,
        startups: List[Any],
        custom_weights: Dict[str, float] | None = None,
    ) -> List[StartupMatchRecommendation]:
        challenge_text = build_challenge_search_text(challenge)
        recommendations: List[StartupMatchRecommendation] = []

        weights = {
            "technology_fit": 0.25,
            "domain_fit": 0.20,
            "relevant_projects": 0.15,
            "team_capability": 0.10,
            "deployment_experience": 0.10,
            "scalability": 0.10,
            "security_readiness": 0.05,
            "budget_compatibility": 0.05,
        }
        if custom_weights:
            weights.update(custom_weights)

        for startup in startups:
            rec = self._evaluate_single_startup(
                challenge, challenge_text, startup, weights=weights
            )
            recommendations.append(rec)

        # Sort by match_score descending
        recommendations.sort(key=lambda r: r.match_score, reverse=True)

        # Update rank indices
        for idx, rec in enumerate(recommendations, start=1):
            rec.rank = idx

        return recommendations

    def _evaluate_single_startup(
        self,
        challenge: Any,
        challenge_text: str,
        startup: Any,
        weights: Dict[str, float] | None = None,
    ) -> StartupMatchRecommendation:
        weights = weights or {
            "technology_fit": 0.25,
            "domain_fit": 0.20,
            "relevant_projects": 0.15,
            "team_capability": 0.10,
            "deployment_experience": 0.10,
            "scalability": 0.10,
            "security_readiness": 0.05,
            "budget_compatibility": 0.05,
        }

        startup_text = build_startup_search_text(startup)

        # 1. Semantic Similarity Base Score
        semantic_sim = embedding_service.compute_similarity(
            challenge_text, startup_text
        )

        # 2. Technology Fit
        tech_fit = self._calc_tech_fit(challenge, startup, semantic_sim)

        # 3. Domain Fit
        domain_fit = self._calc_domain_fit(challenge, startup, semantic_sim)

        # 4. Relevant Previous Projects
        project_fit = self._calc_project_fit(challenge, startup)

        # 5. Team Capability
        readiness = getattr(startup, "readiness_score", None)
        team_score = (
            getattr(readiness, "team_strength", 80.0) if readiness else 80.0
        )

        # 6. Deployment Experience
        deploy_score = (
            getattr(readiness, "deployment_readiness", 80.0) if readiness else 80.0
        )

        # 7. Scalability
        scale_score = (
            getattr(readiness, "scalability", 80.0) if readiness else 80.0
        )

        # 8. Security Readiness
        sec_score = (
            getattr(readiness, "security_readiness", 80.0) if readiness else 80.0
        )

        # 9. Budget Compatibility
        budget_score = self._calc_budget_fit(challenge, startup)

        # Weighted Match Formula using configurable weights
        w_tech = weights.get("technology_fit", 0.25)
        w_domain = weights.get("domain_fit", 0.20)
        w_proj = weights.get("relevant_projects", 0.15)
        w_team = weights.get("team_capability", 0.10)
        w_deploy = weights.get("deployment_experience", 0.10)
        w_scale = weights.get("scalability", 0.10)
        w_sec = weights.get("security_readiness", 0.05)
        w_budget = weights.get("budget_compatibility", 0.05)

        overall_match = (
            (tech_fit * w_tech)
            + (domain_fit * w_domain)
            + (project_fit * w_proj)
            + (team_score * w_team)
            + (deploy_score * w_deploy)
            + (scale_score * w_scale)
            + (sec_score * w_sec)
            + (budget_score * w_budget)
        )
        overall_match = min(max(round(overall_match, 1), 50.0), 99.5)

        # Explanation text
        explanation = (
            f"Demonstrates strong technological alignment ({tech_fit:.0f}%) and "
            f"domain relevance ({domain_fit:.0f}%) with {len(getattr(startup, 'projects', []) or [])} verified projects."
        )

        breakdown = MatchBreakdown(
            technology_fit=round(tech_fit, 1),
            domain_fit=round(domain_fit, 1),
            relevant_projects=round(project_fit, 1),
            team_capability=round(team_score, 1),
            deployment_experience=round(deploy_score, 1),
            scalability=round(scale_score, 1),
            security_readiness=round(sec_score, 1),
            budget_compatibility=round(budget_score, 1),
            explanation=explanation,
        )

        # Eligibility Analysis
        eligibility = eligibility_analyzer.analyze(challenge, startup)

        # Evidence-Backed Reasons & Concerns
        why_recommended, potential_concerns = self._build_explanations(
            challenge, startup, breakdown, eligibility
        )

        # Build Startup Summary for response
        tech_list = [
            t.technology if hasattr(t, "technology") else str(t)
            for t in (getattr(startup, "technologies", []) or [])
        ]
        dom_list = [
            d.domain if hasattr(d, "domain") else str(d)
            for d in (getattr(startup, "domains", []) or [])
        ]

        readiness_schema = None
        if readiness:
            readiness_schema = StartupReadinessScoreSchema(
                technical_capability=getattr(readiness, "technical_capability", 80.0),
                team_strength=getattr(readiness, "team_strength", 80.0),
                deployment_readiness=getattr(readiness, "deployment_readiness", 80.0),
                security_readiness=getattr(readiness, "security_readiness", 80.0),
                scalability=getattr(readiness, "scalability", 80.0),
                financial_readiness=getattr(readiness, "financial_readiness", 80.0),
                domain_experience=getattr(readiness, "domain_experience", 80.0),
                government_readiness=getattr(readiness, "government_readiness", 80.0),
                overall_score=getattr(readiness, "overall_score", 80.0),
            )

        summary = StartupSummary(
            id=startup.id,
            company_name=startup.company_name,
            slug=startup.slug,
            short_description=startup.short_description,
            founded_year=startup.founded_year,
            location=startup.location,
            website=startup.website,
            logo_url=startup.logo_url,
            employee_count=startup.employee_count,
            dpiit_recognized=startup.dpiit_recognized,
            readiness_score=readiness_schema,
            technologies=tech_list,
            domains=dom_list,
        )

        overall_readiness_val = (
            readiness.overall_score if readiness else 80.0
        )

        return StartupMatchRecommendation(
            rank=1,
            startup=summary,
            match_score=overall_match,
            readiness_overall=round(overall_readiness_val, 1),
            eligibility=eligibility,
            match_breakdown=breakdown,
            why_recommended=why_recommended,
            potential_concerns=potential_concerns,
        )

    def _extract_challenge_techs(self, challenge: Any) -> set[str]:
        raw_techs = getattr(challenge, "technologies", None)
        if raw_techs:
            return {t.lower() if isinstance(t, str) else str(t).lower() for t in raw_techs}

        extracted = set()
        reqs = getattr(challenge, "requirements", []) or []
        for r in reqs:
            desc = (getattr(r, "description", "") or getattr(r, "title", "") or str(r)).lower()
            if "computer vision" in desc or "vision" in desc:
                extracted.add("computer vision")
            if "gis" in desc:
                extracted.add("geospatial gis")
            if "iot" in desc:
                extracted.add("iot sensors")
            if "ai" in desc or "learning" in desc:
                extracted.add("artificial intelligence")
            if "medical" in desc or "radiology" in desc:
                extracted.add("medical imaging")

        text = f"{getattr(challenge, 'title', '')} {getattr(challenge, 'problem_statement', '')}".lower()
        if "pothole" in text or "road" in text:
            extracted.add("computer vision")
        if "water" in text or "sensor" in text:
            extracted.add("iot sensors")

        return extracted

    def _calc_tech_fit(self, challenge: Any, startup: Any, semantic_sim: float) -> float:
        c_techs = self._extract_challenge_techs(challenge)
        s_tech_objs = getattr(startup, "technologies", []) or []
        s_techs = {
            t.technology.lower() if hasattr(t, "technology") else str(t).lower()
            for t in s_tech_objs
        }

        if not c_techs:
            return min(85.0 + (semantic_sim * 15.0), 98.0)

        match_count = sum(
            1 for ct in c_techs if any(ct in st or st in ct for st in s_techs)
        )
        overlap_ratio = match_count / len(c_techs)
        score = (overlap_ratio * 70.0) + (semantic_sim * 30.0)
        base_min = 20.0 + (semantic_sim * 20.0)
        return min(max(score, base_min), 98.0)

    def _calc_domain_fit(self, challenge: Any, startup: Any, semantic_sim: float) -> float:
        c_domain = (getattr(challenge, "domain", "") or "").lower()
        s_dom_objs = getattr(startup, "domains", []) or []
        s_domains = [
            d.domain.lower() if hasattr(d, "domain") else str(d).lower()
            for d in s_dom_objs
        ]

        direct_match = any(c_domain in sd or sd in c_domain for sd in s_domains)
        if direct_match:
            return min(88.0 + (semantic_sim * 10.0), 98.0)
        return min(25.0 + (semantic_sim * 25.0), 65.0)

    def _calc_project_fit(self, challenge: Any, startup: Any) -> float:
        projects = getattr(startup, "projects", []) or []
        if not projects:
            return 60.0
        count_bonus = min(len(projects) * 10.0, 30.0)
        return min(65.0 + count_bonus, 96.0)

    def _calc_budget_fit(self, challenge: Any, startup: Any) -> float:
        # Budget compatibility estimation
        c_budget = getattr(challenge, "estimated_budget", 5000000) or 5000000
        # Larger startups handle larger budgets well; small startups handle pilots
        emp_count = getattr(startup, "employee_count", 20) or 20
        if c_budget <= 10000000:  # <= 1 Cr pilot
            return 92.0
        elif emp_count >= 15:
            return 90.0
        return 80.0

    def _build_explanations(
        self,
        challenge: Any,
        startup: Any,
        breakdown: MatchBreakdown,
        eligibility: Any,
    ) -> tuple[List[str], List[str]]:
        why: List[str] = []
        concerns: List[str] = []

        if breakdown.technology_fit >= 85:
            why.append(f"✓ Strong technology fit ({breakdown.technology_fit:.0f}%) with required stack")
        if breakdown.domain_fit >= 85:
            why.append(f"✓ Direct domain experience in {getattr(challenge, 'domain', 'specified area')}")

        projects = getattr(startup, "projects", []) or []
        if projects:
            why.append(f"✓ {len(projects)} verified previous case study projects")

        if breakdown.deployment_experience >= 85:
            why.append("✓ High field deployment readiness score")

        if breakdown.scalability >= 88:
            why.append("✓ Excellent architectural scalability rating")

        # Warnings / Concerns
        if eligibility.warnings:
            concerns.extend(eligibility.warnings)

        if breakdown.security_readiness < 80:
            concerns.append("⚠ Lower relative security readiness score")

        if not why:
            why.append("✓ General technological capability matches challenge domain")

        return why, concerns


startup_matcher = StartupMatcher()
