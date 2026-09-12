"""
Eligibility Analyzer — Assesses government procurement eligibility rules.

Evaluates startup capabilities, DPIIT registration, security certifications,
domain alignment, and technical prerequisites against a specific challenge.
Returns explicit status: ELIGIBLE, CONDITIONALLY_ELIGIBLE, or INELIGIBLE.
"""

from typing import Any, List, Dict
from app.schemas.startup import EligibilityResult


class EligibilityAnalyzer:
    """
    Evaluates startup eligibility for government challenges.
    """

    def analyze(self, challenge: Any, startup: Any) -> EligibilityResult:
        checks: Dict[str, bool] = {}
        reasons: List[str] = []
        warnings: List[str] = []

        # 1. DPIIT Recognition Check
        dpiit_ok = getattr(startup, "dpiit_recognized", True)
        checks["dpiit_registration"] = dpiit_ok
        if dpiit_ok:
            reasons.append("✓ Official DPIIT recognized startup")
        else:
            warnings.append("⚠ Startup lacks official DPIIT recognition number")

        # 2. Technology Prerequisites Check
        raw_techs = getattr(challenge, "technologies", None)
        if raw_techs:
            challenge_techs = {t.lower() if isinstance(t, str) else str(t).lower() for t in raw_techs}
        else:
            challenge_techs = set()
            reqs = getattr(challenge, "requirements", []) or []
            for r in reqs:
                desc = (getattr(r, "description", "") or getattr(r, "title", "") or str(r)).lower()
                if "vision" in desc or "cv" in desc:
                    challenge_techs.add("computer vision")
                if "gis" in desc:
                    challenge_techs.add("geospatial gis")
                if "iot" in desc:
                    challenge_techs.add("iot sensors")
                if "medical" in desc or "radiology" in desc:
                    challenge_techs.add("medical imaging")

        startup_tech_objects = getattr(startup, "technologies", []) or []
        startup_techs = {
            t.technology.lower() if hasattr(t, "technology") else str(t).lower()
            for t in startup_tech_objects
        }

        matched_techs = []
        for ct in challenge_techs:
            if any(ct in st or st in ct for st in startup_techs):
                matched_techs.append(ct)

        tech_ok = len(matched_techs) > 0 or len(challenge_techs) == 0
        checks["required_technology"] = tech_ok
        if tech_ok and matched_techs:
            reasons.append(f"✓ Demonstrates required tech: {', '.join(matched_techs)}")
        elif not tech_ok:
            warnings.append("⚠ Missing exact core technology stack requirements")

        # 3. Security Certification Check
        cert_objects = getattr(startup, "certifications", []) or []
        cert_names = [
            c.name if hasattr(c, "name") else str(c) for c in cert_objects
        ]
        has_security_cert = any(
            "iso" in c.lower() or "soc" in c.lower() or "cert" in c.lower()
            for c in cert_names
        )
        checks["security_certification"] = has_security_cert
        if has_security_cert:
            reasons.append(f"✓ Security certified ({', '.join(cert_names)})")
        else:
            warnings.append("⚠ Lacks formal ISO 27001 / CERT-In security certification")

        # 4. Domain Alignment Check
        challenge_domain = (getattr(challenge, "domain", "") or "").lower()
        startup_domain_objects = getattr(startup, "domains", []) or []
        startup_domains = [
            d.domain.lower() if hasattr(d, "domain") else str(d).lower()
            for d in startup_domain_objects
        ]

        domain_ok = any(
            challenge_domain in sd or sd in challenge_domain
            for sd in startup_domains
        )
        checks["domain_requirement"] = domain_ok
        if domain_ok:
            reasons.append(f"✓ Direct experience in {getattr(challenge, 'domain', '')}")
        else:
            warnings.append(f"⚠ Adjacent domain experience outside {getattr(challenge, 'domain', '')}")

        # 5. Government Deployment Experience Check
        projects = getattr(startup, "projects", []) or []
        has_gov_project = any(
            "municipal" in (getattr(p, "client_type", "") or "").lower()
            or "govt" in (getattr(p, "client_type", "") or "").lower()
            or "public" in (getattr(p, "client_type", "") or "").lower()
            for p in projects
        )
        checks["government_experience"] = has_gov_project
        if has_gov_project:
            reasons.append("✓ Proven government / public sector deployment track record")
        else:
            warnings.append("⚠ Limited prior public sector deployment experience")

        # Determine Status
        failed_critical = not dpiit_ok and not tech_ok
        if failed_critical:
            status = "INELIGIBLE"
            is_eligible = False
        elif warnings:
            status = "CONDITIONALLY_ELIGIBLE"
            is_eligible = True
        else:
            status = "ELIGIBLE"
            is_eligible = True

        return EligibilityResult(
            is_eligible=is_eligible,
            status=status,
            checks=checks,
            reasons=reasons,
            warnings=warnings,
        )


eligibility_analyzer = EligibilityAnalyzer()
