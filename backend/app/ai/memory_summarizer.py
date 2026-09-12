"""
AI-Assisted Innovation Memory Summarizer — Provider-Independent.

Generates structured lessons learned, success/failure factors, and recommendations
from actual pilot telemetry, KPI data, and procurement decisions.

Architecture:
    MemorySummarizerBase (ABC)
    ├── RuleBasedMemorySummarizer — deterministic fallback
    └── LLMMemorySummarizer — optional LLM enhancement (falls back to rule-based)
    └── MemorySummarizerFactory — provider selection
"""

import json
import logging
import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class MemorySummarizerBase(ABC):
    """Abstract interface for memory summarization providers."""

    @abstractmethod
    def summarize_pilot_outcome(
        self,
        challenge_title: str,
        challenge_domain: str,
        startup_name: str,
        pilot_kpis: List[Dict[str, Any]],
        pilot_milestones: List[Dict[str, Any]],
        pilot_risks: List[Dict[str, Any]],
        decision_type: str,
        decision_justification: str,
        decision_score: float,
    ) -> Dict[str, Any]:
        """Generate structured memory summary from pilot outcome data."""
        ...


class RuleBasedMemorySummarizer(MemorySummarizerBase):
    """Deterministic summarizer that extracts insights from actual platform data."""

    def summarize_pilot_outcome(
        self,
        challenge_title: str,
        challenge_domain: str,
        startup_name: str,
        pilot_kpis: List[Dict[str, Any]],
        pilot_milestones: List[Dict[str, Any]],
        pilot_risks: List[Dict[str, Any]],
        decision_type: str,
        decision_justification: str,
        decision_score: float,
    ) -> Dict[str, Any]:

        # Build summary
        total_kpis = len(pilot_kpis)
        met_kpis = sum(1 for k in pilot_kpis if k.get("met", False))
        total_milestones = len(pilot_milestones)
        completed_milestones = sum(1 for m in pilot_milestones if m.get("status") == "COMPLETED")

        summary = (
            f"Pilot for '{challenge_title}' executed by {startup_name} in the {challenge_domain} domain. "
            f"Achieved {met_kpis}/{total_kpis} KPI targets and completed {completed_milestones}/{total_milestones} milestones. "
            f"AI assessment score: {decision_score:.1f}/100. Final decision: {decision_type}."
        )

        # Key metrics
        key_metrics = {
            "overall_score": decision_score,
            "kpis_met": met_kpis,
            "kpis_total": total_kpis,
            "kpi_achievement_rate": round((met_kpis / total_kpis * 100) if total_kpis > 0 else 0, 1),
            "milestones_completed": completed_milestones,
            "milestones_total": total_milestones,
            "milestone_completion_rate": round((completed_milestones / total_milestones * 100) if total_milestones > 0 else 0, 1),
            "open_risks": sum(1 for r in pilot_risks if r.get("status") == "OPEN"),
        }

        # Lessons learned
        lessons: List[str] = []
        success_factors: List[str] = []
        failure_factors: List[str] = []
        recommendations: List[str] = []

        if decision_type == "SCALE":
            if met_kpis == total_kpis and total_kpis > 0:
                lessons.append("All KPI targets were met, demonstrating strong solution-problem fit.")
                success_factors.append("Complete KPI target achievement across all measured dimensions.")
            elif met_kpis > 0:
                lessons.append(f"{met_kpis} of {total_kpis} KPI targets achieved — solution demonstrated partial but sufficient viability.")
                success_factors.append(f"Strong performance on {met_kpis} key metrics.")

            if completed_milestones == total_milestones and total_milestones > 0:
                success_factors.append("All project milestones completed on schedule.")

            # Identify top-performing KPIs
            for kpi in pilot_kpis:
                if kpi.get("met") and kpi.get("actual") is not None and kpi.get("target") is not None:
                    if kpi["actual"] > kpi["target"] * 1.1:
                        success_factors.append(f"KPI '{kpi['name']}' exceeded target by significant margin ({kpi['actual']} vs {kpi['target']}).")

            recommendations.append("Consider this startup and solution approach for similar future challenges in the same domain.")
            recommendations.append("Document the implementation methodology for knowledge transfer to other departments.")

        elif decision_type == "EXTEND":
            lessons.append("Pilot showed potential but required additional evaluation time.")
            if met_kpis < total_kpis:
                underperforming = [k["name"] for k in pilot_kpis if not k.get("met")]
                if underperforming:
                    failure_factors.append(f"KPIs below target: {', '.join(underperforming[:3])}.")
                    lessons.append("Extended monitoring was needed to verify whether underperforming KPIs could improve with more time.")

            open_risks = [r for r in pilot_risks if r.get("status") == "OPEN"]
            if open_risks:
                failure_factors.append(f"{len(open_risks)} unresolved risk(s) required continued monitoring.")

            recommendations.append("Set clear extension milestones with defined success criteria before the next review.")
            recommendations.append("Focus extended monitoring on the specific underperforming KPIs identified.")

        elif decision_type == "REJECT":
            lessons.append("Pilot did not meet minimum procurement viability thresholds.")
            if met_kpis == 0 and total_kpis > 0:
                failure_factors.append("No KPI targets were achieved during the pilot period.")
            elif met_kpis < total_kpis:
                unmet = [k["name"] for k in pilot_kpis if not k.get("met")]
                failure_factors.append(f"Critical KPI failures: {', '.join(unmet[:3])}.")

            critical_risks = [r for r in pilot_risks if r.get("severity") == "CRITICAL" and r.get("status") == "OPEN"]
            if critical_risks:
                failure_factors.append(f"{len(critical_risks)} unresolved critical risk(s) made deployment unacceptable.")

            recommendations.append("Future challenges in this domain should refine requirements based on these failure patterns.")
            recommendations.append("Consider whether the problem statement needs restructuring before re-issuing.")

        # Add decision justification as a lesson
        if decision_justification:
            lessons.append(f"Decision rationale: {decision_justification[:300]}")

        return {
            "summary": summary,
            "key_metrics": key_metrics,
            "lessons_learned": lessons,
            "success_factors": success_factors,
            "failure_factors": failure_factors,
            "recommendations": recommendations,
        }


class LLMMemorySummarizer(MemorySummarizerBase):
    """
    LLM-enhanced memory summarizer. Falls back to rule-based if LLM is unavailable.
    AI must NOT fabricate data — only interpret the provided platform data.
    """

    def __init__(self):
        self.fallback = RuleBasedMemorySummarizer()

    def summarize_pilot_outcome(
        self,
        challenge_title: str,
        challenge_domain: str,
        startup_name: str,
        pilot_kpis: List[Dict[str, Any]],
        pilot_milestones: List[Dict[str, Any]],
        pilot_risks: List[Dict[str, Any]],
        decision_type: str,
        decision_justification: str,
        decision_score: float,
    ) -> Dict[str, Any]:
        # Start from rule-based baseline
        baseline = self.fallback.summarize_pilot_outcome(
            challenge_title, challenge_domain, startup_name,
            pilot_kpis, pilot_milestones, pilot_risks,
            decision_type, decision_justification, decision_score,
        )

        api_key = os.environ.get("LLM_API_KEY", "")
        if not api_key:
            logger.info("No LLM API key — using rule-based memory summarization.")
            return baseline

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(os.environ.get("LLM_MODEL", "gemini-pro"))

            prompt = f"""You are an institutional memory analyst for a government innovation procurement platform.
Analyze the following pilot outcome data and produce ONLY factual insights.
Do NOT invent any data, statistics, or outcomes not present in the input.

PILOT DATA:
- Challenge: {challenge_title}
- Domain: {challenge_domain}
- Startup: {startup_name}
- Decision: {decision_type} (Score: {decision_score}/100)
- Justification: {decision_justification}
- KPIs: {json.dumps(pilot_kpis[:10])}
- Milestones: {json.dumps(pilot_milestones[:10])}
- Risks: {json.dumps(pilot_risks[:5])}

RULE-BASED ANALYSIS:
{json.dumps(baseline, indent=2)}

Improve the summary and insights while keeping them grounded in the actual data above.
Return ONLY valid JSON with keys: summary, lessons_learned, success_factors, failure_factors, recommendations.
Each value should be a string (summary) or list of strings."""

            response = model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

            enhanced = json.loads(text)
            # Merge: keep rule-based key_metrics, use LLM text where available
            baseline["summary"] = enhanced.get("summary", baseline["summary"])
            baseline["lessons_learned"] = enhanced.get("lessons_learned", baseline["lessons_learned"])
            baseline["success_factors"] = enhanced.get("success_factors", baseline["success_factors"])
            baseline["failure_factors"] = enhanced.get("failure_factors", baseline["failure_factors"])
            baseline["recommendations"] = enhanced.get("recommendations", baseline["recommendations"])
            return baseline

        except Exception as e:
            logger.warning(f"LLM memory summarization failed, using rule-based fallback: {e}")
            return baseline


class MemorySummarizerFactory:
    """Provider selection for memory summarization."""

    @staticmethod
    def get_summarizer() -> MemorySummarizerBase:
        if os.environ.get("LLM_API_KEY"):
            return LLMMemorySummarizer()
        return RuleBasedMemorySummarizer()
