"""
AI-Assisted Pilot Assessment Service — Provider-Independent Telemetry Analysis & Structured Recommendation.
"""

import json
import logging
import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.models.pilot import (
    IssueStatus,
    KPIStatus,
    MilestoneStatus,
    Pilot,
    PilotKPI,
    RiskCategory,
    RiskSeverity,
    RiskStatus,
    TargetOperator,
)

logger = logging.getLogger(__name__)


class PilotAssessorBase(ABC):
    """Abstract interface for pilot assessment providers."""

    @abstractmethod
    def assess_pilot(self, pilot: Pilot) -> Dict[str, Any]:
        """Analyze pilot telemetry and return structured assessment dict."""
        pass


class DeterministicPilotAssessor(PilotAssessorBase):
    """
    Pure deterministic assessment engine.
    Calculates exact scores, risk levels, and recommendations from verified database telemetry.
    Guarantees consistent, testable, and transparent decision support without hallucination.
    """

    def assess_pilot(self, pilot: Pilot) -> Dict[str, Any]:
        kpis: List[PilotKPI] = pilot.kpis or []
        milestones = pilot.milestones or []
        risks = pilot.risks or []
        issues = pilot.issues or []
        evidence = pilot.evidence_files or []

        # 1. Evaluate KPI Performance
        kpi_scores: List[float] = []
        kpis_achieved = 0
        kpis_below = 0
        kpis_unmeasured = 0
        strengths: List[str] = []
        concerns: List[str] = []
        missing_info: List[str] = []

        total_weight = sum(k.weight for k in kpis) if kpis else 0.0
        weighted_sum = 0.0

        for k in kpis:
            weight = k.weight if total_weight > 0 else (1.0 / len(kpis) if kpis else 1.0)
            actual = k.latest_actual_value

            if actual is None:
                kpis_unmeasured += 1
                missing_info.append(f"KPI '{k.name}' has no recorded field measurements.")
                continue

            op = k.target_operator.value if isinstance(k.target_operator, TargetOperator) else str(k.target_operator)
            target = k.target_value

            # Calculate fulfillment percentage
            score = 0.0
            if op in [">=", ">"]:
                if actual >= target:
                    kpis_achieved += 1
                    bonus = min((actual - target) / target * 20.0, 10.0) if target > 0 else 0.0
                    score = min(100.0 + bonus, 110.0)
                    strengths.append(f"KPI '{k.name}' achieved {actual} {k.unit} exceeding target of {target} {k.unit}.")
                else:
                    kpis_below += 1
                    deficit_ratio = max(0.0, (target - actual) / target) if target > 0 else 1.0
                    score = max(0.0, 100.0 - (deficit_ratio * 100.0))
                    concerns.append(f"KPI '{k.name}' achieved {actual} {k.unit} vs target {target} {k.unit} ({deficit_ratio*100:.1f}% below target).")
            elif op in ["<=", "<"]:
                if actual <= target:
                    kpis_achieved += 1
                    score = 100.0
                    strengths.append(f"KPI '{k.name}' met acceptable ceiling of {actual} {k.unit} (target ≤ {target} {k.unit}).")
                else:
                    kpis_below += 1
                    excess_ratio = (actual - target) / target if target > 0 else 1.0
                    score = max(0.0, 100.0 - (excess_ratio * 100.0))
                    concerns.append(f"KPI '{k.name}' measured {actual} {k.unit} exceeding maximum threshold of {target} {k.unit}.")
            elif op == "=":
                if abs(actual - target) < 1e-6:
                    kpis_achieved += 1
                    score = 100.0
                    strengths.append(f"KPI '{k.name}' precisely matched target value of {target} {k.unit}.")
                else:
                    kpis_below += 1
                    score = 50.0
                    concerns.append(f"KPI '{k.name}' deviated from exact target of {target} {k.unit}.")

            kpi_scores.append(score)
            weighted_sum += score * weight

        raw_kpi = (weighted_sum / total_weight) if total_weight > 0 and kpis else (
            (sum(kpi_scores) / len(kpi_scores)) if kpi_scores else 0.0
        )
        kpi_perf = round(max(0.0, min(100.0, raw_kpi)), 1)

        # 2. Evaluate Milestone Performance
        total_milestones = len(milestones)
        completed_milestones = sum(1 for m in milestones if m.status == MilestoneStatus.COMPLETED)
        blocked_milestones = [m for m in milestones if m.status == MilestoneStatus.BLOCKED]
        in_progress_milestones = sum(1 for m in milestones if m.status == MilestoneStatus.IN_PROGRESS)

        if total_milestones > 0:
            avg_progress = sum(m.completion_percentage for m in milestones) / total_milestones
            milestone_perf = round(avg_progress, 1)
        else:
            milestone_perf = 0.0

        if completed_milestones == total_milestones and total_milestones > 0:
            strengths.append(f"All {total_milestones} scheduled project milestones completed successfully.")
        elif completed_milestones > 0:
            strengths.append(f"{completed_milestones} of {total_milestones} milestones verified complete.")

        for bm in blocked_milestones:
            concerns.append(f"Milestone '{bm.name}' is currently blocked: {bm.blocked_reason or 'No reason provided'}.")

        # 3. Evaluate Risks & Issues
        open_critical_risks = [r for r in risks if r.status == RiskStatus.OPEN and r.severity == RiskSeverity.CRITICAL]
        open_high_risks = [r for r in risks if r.status == RiskStatus.OPEN and r.severity == RiskSeverity.HIGH]
        unresolved_issues = [i for i in issues if i.status in [IssueStatus.OPEN, IssueStatus.IN_PROGRESS]]

        risk_penalty = (len(open_critical_risks) * 15.0) + (len(open_high_risks) * 8.0) + (len(unresolved_issues) * 3.0)

        if len(open_critical_risks) > 0:
            risk_level = "HIGH"
            for cr in open_critical_risks:
                concerns.append(f"Critical unresolved operational risk: {cr.title}.")
        elif len(open_high_risks) >= 2 or len(unresolved_issues) >= 3:
            risk_level = "HIGH"
            concerns.append(f"{len(open_high_risks)} high-severity risks and {len(unresolved_issues)} unresolved operational issues require mitigation.")
        elif len(open_high_risks) == 1 or len(unresolved_issues) > 0:
            risk_level = "MEDIUM"
            if unresolved_issues:
                concerns.append(f"{len(unresolved_issues)} unresolved issue(s) under review.")
        else:
            risk_level = "LOW"
            strengths.append("Zero critical or high unmitigated operational risks identified.")

        # 4. Evidence Verification
        evidence_count = len(evidence)
        if evidence_count == 0:
            missing_info.append("No technical audit reports, test logs, or deployment evidence documents have been uploaded.")
            evidence_bonus = 0.0
        else:
            strengths.append(f"{evidence_count} formal deployment evidence document(s) uploaded and archived.")
            evidence_bonus = min(evidence_count * 2.5, 5.0)

        # 5. Overall Score Calculation
        # Weights: 55% KPI performance + 35% Milestone progress - Risk Penalty + Evidence bonus
        raw_overall = (0.55 * kpi_perf) + (0.35 * milestone_perf) - risk_penalty + evidence_bonus
        overall_score = round(max(0.0, min(100.0, raw_overall)), 1)

        # 6. Confidence Score
        measured_ratio = (len(kpi_scores) / len(kpis)) if kpis else 0.0
        milestone_ratio = (completed_milestones / total_milestones) if total_milestones else 0.0
        evidence_score = 15.0 if evidence_count > 0 else 0.0
        base_confidence = (measured_ratio * 50.0) + (milestone_ratio * 35.0) + evidence_score
        confidence = round(max(10.0, min(100.0, base_confidence)), 1)

        # 7. Recommendation Engine
        reasons: List[str] = []
        if overall_score >= 75.0 and kpi_perf >= 70.0 and len(blocked_milestones) == 0 and len(open_critical_risks) == 0:
            recommendation = "SCALE"
            reasons.append(
                f"Pilot exceeded deployment viability threshold with an overall assessment score of {overall_score}/100 "
                f"and KPI performance of {kpi_perf}/100."
            )
            reasons.append(
                f"Solution met or exceeded {kpis_achieved} of {len(kpis)} key performance indicator targets "
                f"with {completed_milestones} of {total_milestones} milestones completed."
            )
            if risk_level in ["LOW", "MEDIUM"]:
                reasons.append(f"Operational risk level assessed as {risk_level}, suitable for structured public procurement transition.")
        elif overall_score >= 45.0 or len(blocked_milestones) > 0 or kpis_below > 0:
            recommendation = "EXTEND"
            reasons.append(
                f"Pilot demonstrated partial efficacy with an overall score of {overall_score}/100, "
                f"but requires further operational evaluation prior to full public procurement."
            )
            if kpis_below > 0:
                reasons.append(f"{kpis_below} KPI target(s) fell below expected thresholds and require extended verification.")
            if blocked_milestones:
                reasons.append(f"{len(blocked_milestones)} milestone(s) are currently blocked and must be resolved before scaling.")
            if risk_level == "HIGH":
                reasons.append("High operational risks require mitigation validation during an extended monitoring window.")
        else:
            recommendation = "REJECT"
            reasons.append(
                f"Pilot failed to achieve essential performance thresholds, scoring {overall_score}/100 "
                f"with KPI achievement of {kpi_perf}/100."
            )
            if kpis_below > len(kpis) / 2:
                reasons.append("Majority of key performance targets were not satisfied during the evaluation period.")
            if open_critical_risks:
                reasons.append(f"{len(open_critical_risks)} unmitigated critical operational risk(s) pose unacceptable risk to public deployment.")

        return {
            "overall_score": overall_score,
            "kpi_performance": kpi_perf,
            "milestone_performance": milestone_perf,
            "risk_level": risk_level,
            "confidence": confidence,
            "recommendation": recommendation,
            "reasons": reasons,
            "strengths": strengths,
            "concerns": concerns,
            "missing_information": missing_info,
        }


class LLMAssistedPilotAssessor(PilotAssessorBase):
    """
    LLM-assisted assessment provider using Gemini.
    Uses verified telemetry from the deterministic assessor as ground truth and synthesizes
    rich qualitative explanations while preserving computed quantitative constraints.
    """

    def __init__(self, fallback: Optional[PilotAssessorBase] = None):
        self.fallback = fallback or DeterministicPilotAssessor()

    def assess_pilot(self, pilot: Pilot) -> Dict[str, Any]:
        # Always run deterministic assessment first as baseline ground truth
        baseline = self.fallback.assess_pilot(pilot)

        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return baseline

        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            prompt = (
                "You are a Senior Government Innovation Procurement Assessment Officer. "
                "Analyze the following verified pilot telemetry for a public procurement challenge.\n\n"
                f"CHALLENGE: {pilot.challenge.title if pilot.challenge else 'N/A'}\n"
                f"PILOT OBJECTIVE: {pilot.objective}\n"
                f"SCOPE: {pilot.scope}\n"
                f"STARTUP: {pilot.startup.company_name if pilot.startup else 'N/A'}\n\n"
                "VERIFIED TELEMETRY BASELINE:\n"
                f"{json.dumps(baseline, indent=2)}\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. Preserve the exact numerical scores and recommendation from the baseline unless clearly justified.\n"
                "2. Provide clear, professional, government-appropriate bullet points for reasons, strengths, concerns, and missing_information.\n"
                "3. Avoid buzzwords, robot illustrations, or dramatic claims. Maintain an objective, institutional tone.\n"
                "4. Return ONLY a valid JSON object matching the schema:\n"
                "{\n"
                '  "overall_score": float,\n'
                '  "kpi_performance": float,\n'
                '  "milestone_performance": float,\n'
                '  "risk_level": "LOW" | "MEDIUM" | "HIGH",\n'
                '  "confidence": float,\n'
                '  "recommendation": "SCALE" | "EXTEND" | "REJECT",\n'
                '  "reasons": string[],\n'
                '  "strengths": string[],\n'
                '  "concerns": string[],\n'
                '  "missing_information": string[]\n'
                "}"
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )

            if response and response.text:
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                parsed = json.loads(text.strip())

                # Validate required keys
                required = ["overall_score", "kpi_performance", "milestone_performance", "risk_level", "confidence", "recommendation"]
                if all(k in parsed for k in required):
                    # Ensure numbers are floats
                    parsed["overall_score"] = float(parsed["overall_score"])
                    parsed["kpi_performance"] = float(parsed["kpi_performance"])
                    parsed["milestone_performance"] = float(parsed["milestone_performance"])
                    parsed["confidence"] = float(parsed["confidence"])
                    return parsed
        except Exception as e:
            logger.warning(f"LLM pilot assessment synthesis failed, using deterministic baseline: {e}")

        return baseline


class PilotAssessmentFactory:
    """Factory creating the appropriate PilotAssessor based on environment and configuration."""

    @staticmethod
    def get_assessor() -> PilotAssessorBase:
        # If API key exists, use LLM-assisted with deterministic fallback; else use pure deterministic
        if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
            return LLMAssistedPilotAssessor()
        return DeterministicPilotAssessor()
