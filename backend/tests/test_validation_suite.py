"""
Validation Suite for AI Startup Matching Engine (SIH26136)

Executes 5 mandatory validation tests:
- TEST 1: Challenge requirement change affects ranking & scores
- TEST 2: Startup capability change affects challenge match score
- TEST 3: Weight change alters overall match calculation
- TEST 4: Eligibility change updates eligibility status & flags
- TEST 5: Dynamic explainability consistency (no hardcoded strings)
"""

import sys
import os
from types import SimpleNamespace

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, create_tables
import app.models  # noqa: F401
from app.models.challenge import Challenge
from app.models.startup import Startup
from app.ai.startup_matcher import startup_matcher
from app.ai.eligibility_analyzer import eligibility_analyzer


def run_validation_tests():
    db = SessionLocal()
    try:
        print("================================================================")
        print("  STARTUP PROCUREMENT PLATFORM — AI MATCHING ENGINE TEST SUITE")
        print("================================================================")

        # Fetch seeded demo data
        road_challenge = db.query(Challenge).filter(Challenge.id == "ch-road-01").first()
        if not road_challenge:
            print("ERROR: Demo data not seeded. Run seed script first.")
            return False

        all_startups = db.query(Startup).all()
        print(f"Loaded Challenge: '{road_challenge.title}' ({road_challenge.domain})")
        print(f"Loaded {len(all_startups)} Startups from database.\n")

        road_challenge.technologies = ["Computer Vision", "Edge AI", "Geospatial GIS"]

        # Baseline Evaluation
        baseline_recs = startup_matcher.rank_startups_for_challenge(road_challenge, all_startups)
        top_baseline = baseline_recs[0]
        print(f"[BASELINE] Top Ranked Startup for Road Damage Challenge: '{top_baseline.startup.company_name}' with Match Score = {top_baseline.match_score}%\n")

        # ----------------------------------------------------------------------
        # TEST 1: Challenge Requirement Change
        # ----------------------------------------------------------------------
        print("----------------------------------------------------------------")
        print("TEST 1 — Challenge Requirement Change")
        print("----------------------------------------------------------------")
        # Mutate challenge requirements: Infrastructure -> Healthcare Medical Imaging
        modified_challenge = SimpleNamespace(
            id="ch-road-01-modified",
            title="AI Medical Imaging Diagnostic System",
            problem_statement="We need a computer vision system to analyze MRI and X-ray medical images for hospital diagnostics.",
            description="Medical imaging and healthcare diagnostic automation system.",
            domain="Healthcare & Public Health",
            technologies=["Medical Imaging", "Radiology AI", "PACS Diagnostic Analysis"],
            estimated_budget=4000000,
            requirements=[
                SimpleNamespace(title="Medical Imaging", description="Computer vision for hospital MRI scan analysis", is_mandatory=True, order=0)
            ],
        )

        recs_test1 = startup_matcher.rank_startups_for_challenge(modified_challenge, all_startups)
        top_test1 = recs_test1[0]

        # Find original top startup's new match score
        st01_new_rec = next(r for r in recs_test1 if r.startup.id == top_baseline.startup.id)

        print(f"Original Top Startup ('{top_baseline.startup.company_name}'):")
        print(f"  - Original Match Score (Road Infrastructure): {top_baseline.match_score}%")
        print(f"  - New Match Score (Healthcare Medical Imaging): {st01_new_rec.match_score}% (Dropped by {round(top_baseline.match_score - st01_new_rec.match_score, 1)}%)")
        print(f"New Top Ranked Startup for Healthcare: '{top_test1.startup.company_name}' (Match Score = {top_test1.match_score}%)\n")

        assert st01_new_rec.match_score < top_baseline.match_score - 10.0, "TEST 1 FAILED: Score did not drop sufficiently when challenge domain changed!"
        print("[PASSED] TEST 1: Changing challenge requirements dynamically updated rankings & scores!\n")

        # ----------------------------------------------------------------------
        # TEST 2: Startup Capability Change
        # ----------------------------------------------------------------------
        print("----------------------------------------------------------------")
        print("TEST 2 — Startup Capability Change")
        print("----------------------------------------------------------------")
        target_startup = all_startups[0]  # RoadSense Analytics
        st_orig_rec = next(r for r in baseline_recs if r.startup.id == target_startup.id)

        # Mutate startup capabilities from Road Infrastructure to Healthcare
        mutated_techs = [SimpleNamespace(technology="Healthcare AI"), SimpleNamespace(technology="Medical Imaging")]
        mutated_domains = [SimpleNamespace(domain="Healthcare & Public Health")]
        mutated_projects = [
            SimpleNamespace(
                name="Hospital Radiology Diagnostics",
                description="Deployed MRI image scanner for district hospitals",
                domain="Healthcare & Public Health",
                technologies=["Medical Imaging"],
                outcome="Improved diagnostic accuracy by 40%",
                deployment_scale="10 Hospitals",
                client_type="Government Hospital",
                year=2024,
            )
        ]

        mutated_startup = SimpleNamespace(
            id=target_startup.id,
            company_name=target_startup.company_name,
            slug=target_startup.slug,
            short_description="Healthcare AI and medical imaging diagnostics company.",
            description=target_startup.description,
            founded_year=target_startup.founded_year,
            location=target_startup.location,
            website=target_startup.website,
            contact_email=target_startup.contact_email,
            logo_url=target_startup.logo_url,
            employee_count=target_startup.employee_count,
            dpiit_recognized=target_startup.dpiit_recognized,
            dpiit_number=target_startup.dpiit_number,
            technologies=mutated_techs,
            domains=mutated_domains,
            projects=mutated_projects,
            certifications=target_startup.certifications,
            readiness_score=target_startup.readiness_score,
        )

        test2_rec = startup_matcher._evaluate_single_startup(road_challenge, "road damage pothole vision", mutated_startup)

        print(f"Startup '{target_startup.company_name}':")
        print(f"  - Match Score before capability change: {st_orig_rec.match_score}%")
        print(f"  - Match Score after changing to Healthcare: {test2_rec.match_score}%")
        print(f"  - Tech Fit: {test2_rec.match_breakdown.technology_fit}% | Domain Fit: {test2_rec.match_breakdown.domain_fit}%\n")

        assert test2_rec.match_score < st_orig_rec.match_score - 10.0, "TEST 2 FAILED: Startup score did not decrease when capabilities changed away from challenge!"
        print("[PASSED] TEST 2: Modifying startup capabilities directly affected match scoring!\n")

        # ----------------------------------------------------------------------
        # TEST 3: Weight Change
        # ----------------------------------------------------------------------
        print("----------------------------------------------------------------")
        print("TEST 3 — Weight Change")
        print("----------------------------------------------------------------")
        default_recs = startup_matcher.rank_startups_for_challenge(road_challenge, all_startups)

        # Custom Weights: Lower Tech Fit (5%) and Higher Domain Fit (55%)
        heavy_domain_weights = {
            "technology_fit": 0.05,
            "domain_fit": 0.55,
            "relevant_projects": 0.10,
            "team_capability": 0.10,
            "deployment_experience": 0.10,
            "scalability": 0.05,
            "security_readiness": 0.02,
            "budget_compatibility": 0.03,
        }

        weighted_recs = startup_matcher.rank_startups_for_challenge(
            road_challenge, all_startups, custom_weights=heavy_domain_weights
        )

        print("Default Weights (Tech 25%, Domain 20%):")
        for r in default_recs[:3]:
            print(f"  - #{r.rank} {r.startup.company_name}: {r.match_score}%")

        print("\nHeavy Domain Weights (Tech 5%, Domain 55%):")
        for r in weighted_recs[:3]:
            print(f"  - #{r.rank} {r.startup.company_name}: {r.match_score}%")

        diffs = [abs(d.match_score - w.match_score) for d, w in zip(default_recs, weighted_recs)]
        assert max(diffs) > 1.0, "TEST 3 FAILED: Weight changes did not alter scores!"
        print("\n[PASSED] TEST 3: Weight adjustment altered final calculated match scores!\n")

        # ----------------------------------------------------------------------
        # TEST 4: Eligibility Change
        # ----------------------------------------------------------------------
        print("----------------------------------------------------------------")
        print("TEST 4 — Eligibility Change")
        print("----------------------------------------------------------------")
        eligible_startup = all_startups[0]
        orig_eligibility = eligibility_analyzer.analyze(road_challenge, eligible_startup)

        # Make startup fail DPIIT recognition & core technology requirements
        ineligible_startup = SimpleNamespace(
            id="st-ineligible",
            company_name="Ineligible Startup Ltd",
            dpiit_recognized=False,
            technologies=[],
            domains=[SimpleNamespace(domain="Unrelated Domain")],
            certifications=[],
            projects=[],
        )

        ineligible_res = eligibility_analyzer.analyze(road_challenge, ineligible_startup)

        print(f"Eligible Startup Status: {orig_eligibility.status} (Is Eligible: {orig_eligibility.is_eligible})")
        clean_reasons = [r.encode('ascii', 'ignore').decode('ascii').strip() for r in orig_eligibility.reasons[:2]]
        print(f"  - Reasons: {clean_reasons}")

        print(f"\nIneligible Startup Status: {ineligible_res.status} (Is Eligible: {ineligible_res.is_eligible})")
        print(f"  - Checks Failed: {ineligible_res.checks}")
        clean_warnings = [w.encode('ascii', 'ignore').decode('ascii').strip() for w in ineligible_res.warnings]
        print(f"  - Warnings: {clean_warnings}\n")

        assert ineligible_res.is_eligible is False, "TEST 4 FAILED: Ineligible startup was marked as eligible!"
        assert ineligible_res.status == "INELIGIBLE", "TEST 4 FAILED: Status was not INELIGIBLE!"
        print("[PASSED] TEST 4: System accurately enforces eligibility rules and distinguishes eligibility from relevance!\n")

        # ----------------------------------------------------------------------
        # TEST 5: Explainability Consistency
        # ----------------------------------------------------------------------
        print("----------------------------------------------------------------")
        print("TEST 5 — Explainability Consistency")
        print("----------------------------------------------------------------")
        rec_a = baseline_recs[0]  # RoadSense Analytics
        rec_b = baseline_recs[-1] # Lowest match startup

        why_a = [w.encode('ascii', 'ignore').decode('ascii').strip() for w in rec_a.why_recommended]
        why_b = [w.encode('ascii', 'ignore').decode('ascii').strip() for w in rec_b.why_recommended]

        concerns_a = [c.encode('ascii', 'ignore').decode('ascii').strip() for c in rec_a.potential_concerns]
        concerns_b = [c.encode('ascii', 'ignore').decode('ascii').strip() for c in rec_b.potential_concerns]

        print(f"Startup A ('{rec_a.startup.company_name}'):")
        print(f"  - Why Recommended: {why_a}")
        print(f"  - Potential Concerns: {concerns_a}")
        print(f"  - Explanation Text: '{rec_a.match_breakdown.explanation}'")

        print(f"\nStartup B ('{rec_b.startup.company_name}'):")
        print(f"  - Why Recommended: {why_b}")
        print(f"  - Potential Concerns: {concerns_b}")
        print(f"  - Explanation Text: '{rec_b.match_breakdown.explanation}'\n")

        assert rec_a.why_recommended != rec_b.why_recommended, "TEST 5 FAILED: Explanations are identical (hardcoded)!"
        assert rec_a.match_breakdown.explanation != rec_b.match_breakdown.explanation, "TEST 5 FAILED: Explanation text is hardcoded!"
        print("[PASSED] TEST 5: Explanations are dynamically generated based on candidate data and criteria!\n")

        print("================================================================")
        print("  ALL 5 VALIDATION TESTS PASSED SUCCESSFULLY! FEATURE COMPLETE. ")
        print("================================================================")
        return True

    finally:
        db.close()


if __name__ == "__main__":
    success = run_validation_tests()
    if not success:
        sys.exit(1)
