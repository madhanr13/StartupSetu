"""
KPI Service — Deterministic numerical comparison logic and transparent Pilot Health evaluation.
"""

from typing import Any, Dict, List, Optional
from app.models.pilot import (
    KPIStatus,
    MilestoneStatus,
    Pilot,
    PilotKPI,
    RiskSeverity,
    RiskStatus,
    TargetOperator,
)


class KPICalculationService:
    """Pure, deterministic mathematical calculation service for KPIs and Pilot Health."""

    @staticmethod
    def evaluate_kpi_status(
        actual_value: float,
        target_value: float,
        operator: TargetOperator | str,
    ) -> KPIStatus:
        """
        Determines whether a numerical measurement achieves its target condition.
        Strictly deterministic — no LLM calls.
        """
        op = operator.value if isinstance(operator, TargetOperator) else str(operator)
        
        achieved = False
        if op == ">=":
            achieved = actual_value >= target_value
        elif op == "<=":
            achieved = actual_value <= target_value
        elif op == "=":
            achieved = abs(actual_value - target_value) < 1e-6
        elif op == ">":
            achieved = actual_value > target_value
        elif op == "<":
            achieved = actual_value < target_value
        else:
            achieved = actual_value >= target_value

        return KPIStatus.ACHIEVED if achieved else KPIStatus.BELOW_TARGET

    @classmethod
    def calculate_pilot_health(cls, pilot: Pilot) -> Dict[str, Any]:
        """
        Calculates operational pilot health score and label using transparent deterministic rules.
        Returns:
            {
                "health_label": "ON_TRACK" | "NEEDS_ATTENTION" | "AT_RISK",
                "kpis_total": int,
                "kpis_achieved": int,
                "kpis_below_target": int,
                "kpis_pending": int,
                "milestones_total": int,
                "milestones_completed": int,
                "milestones_blocked": int,
                "risks_critical_open": int,
                "risks_high_open": int,
                "issues_unresolved": int,
                "rules_applied": List[str]
            }
        """
        kpis = pilot.kpis or []
        milestones = pilot.milestones or []
        risks = pilot.risks or []
        issues = pilot.issues or []

        # 1. KPI Counts
        kpis_total = len(kpis)
        kpis_achieved = sum(1 for k in kpis if k.status == KPIStatus.ACHIEVED)
        kpis_below = sum(1 for k in kpis if k.status == KPIStatus.BELOW_TARGET)
        kpis_pending = sum(1 for k in kpis if k.status == KPIStatus.PENDING_MEASUREMENT)

        measured_kpis = kpis_achieved + kpis_below
        kpi_achieved_ratio = (kpis_achieved / measured_kpis) if measured_kpis > 0 else 1.0

        # 2. Milestones Counts
        milestones_total = len(milestones)
        milestones_completed = sum(1 for m in milestones if m.status == MilestoneStatus.COMPLETED)
        milestones_blocked = sum(1 for m in milestones if m.status == MilestoneStatus.BLOCKED)

        # 3. Risks & Issues Counts
        open_critical_risks = sum(
            1 for r in risks if r.status == RiskStatus.OPEN and r.severity == RiskSeverity.CRITICAL
        )
        open_high_risks = sum(
            1 for r in risks if r.status == RiskStatus.OPEN and r.severity == RiskSeverity.HIGH
        )
        unresolved_issues = sum(1 for i in issues if i.status in ["OPEN", "IN_PROGRESS"])

        # 4. Transparent Rule Evaluation
        rules_triggered = []
        health_label = "ON_TRACK"

        if open_critical_risks > 0:
            health_label = "AT_RISK"
            rules_triggered.append(f"Contains {open_critical_risks} open Critical risk(s).")
        elif measured_kpis > 0 and kpi_achieved_ratio < 0.5:
            health_label = "AT_RISK"
            rules_triggered.append(f"Less than 50% measured KPIs achieved ({kpis_achieved}/{measured_kpis}).")
        elif milestones_blocked >= 2:
            health_label = "AT_RISK"
            rules_triggered.append(f"Multiple milestones blocked ({milestones_blocked}).")

        if health_label != "AT_RISK":
            if open_high_risks > 0:
                health_label = "NEEDS_ATTENTION"
                rules_triggered.append(f"Contains {open_high_risks} open High risk(s).")
            elif measured_kpis > 0 and kpi_achieved_ratio < 0.75:
                health_label = "NEEDS_ATTENTION"
                rules_triggered.append(f"KPI achievement ratio below 75% ({kpis_achieved}/{measured_kpis}).")
            elif milestones_blocked == 1:
                health_label = "NEEDS_ATTENTION"
                rules_triggered.append("1 milestone is currently blocked.")
            elif unresolved_issues > 2:
                health_label = "NEEDS_ATTENTION"
                rules_triggered.append(f"Multiple open operational issues ({unresolved_issues}).")

        if not rules_triggered:
            rules_triggered.append("All measured KPIs on target, no critical risks, milestones proceeding on schedule.")

        return {
            "health_label": health_label,
            "kpis_total": kpis_total,
            "kpis_achieved": kpis_achieved,
            "kpis_below_target": kpis_below,
            "kpis_pending": kpis_pending,
            "milestones_total": milestones_total,
            "milestones_completed": milestones_completed,
            "milestones_blocked": milestones_blocked,
            "risks_critical_open": open_critical_risks,
            "risks_high_open": open_high_risks,
            "issues_unresolved": unresolved_issues,
            "rules_applied": rules_triggered,
        }
