"""
Settings Service — Manages configurable platform parameters.

Supports category-grouped settings, matching weights configuration,
eligibility rules configuration, and audit-logged mutations.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.audit import AuditAction
from app.models.system_setting import SettingCategory, SettingValueType, SystemSetting
from app.models.user import User
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

DEFAULT_MATCHING_WEIGHTS: Dict[str, float] = {
    "technology_fit": 0.25,
    "domain_fit": 0.20,
    "relevant_projects": 0.15,
    "team_capability": 0.10,
    "deployment_experience": 0.10,
    "scalability": 0.10,
    "security_readiness": 0.05,
    "budget_compatibility": 0.05,
}


class SettingsService:
    """Service for system configuration and parameter tuning."""

    @staticmethod
    def get_all_settings(db: Session) -> List[SystemSetting]:
        """Fetch all system settings ordered by category and key."""
        return db.query(SystemSetting).order_by(SystemSetting.category, SystemSetting.key).all()

    @staticmethod
    def get_settings_by_category(db: Session, category: str) -> List[SystemSetting]:
        """Fetch settings belonging to a specific category."""
        return (
            db.query(SystemSetting)
            .filter(SystemSetting.category == category.upper())
            .order_by(SystemSetting.key)
            .all()
        )

    @staticmethod
    def get_setting(db: Session, key: str) -> Optional[SystemSetting]:
        """Fetch a single setting by key."""
        return db.query(SystemSetting).filter(SystemSetting.key == key).first()

    @staticmethod
    def update_setting(
        db: Session, key: str, value: Any, actor: Optional[User] = None
    ) -> SystemSetting:
        """
        Update setting value and log an audit event with before/after state.
        """
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not setting:
            raise ValueError(f"System setting '{key}' not found.")

        old_value = setting.value
        setting.value = value
        setting.updated_by = actor.id if actor else None
        setting.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(setting)

        # Audit log the configuration change
        AuditService.log_event(
            db=db,
            action=AuditAction.SETTING_CHANGED,
            entity_type="system_setting",
            entity_id=setting.id,
            actor=actor,
            summary=f"Setting '{setting.label}' ({setting.key}) modified by {actor.name if actor else 'System'}.",
            details={
                "key": setting.key,
                "category": setting.category,
                "old_value": old_value,
                "new_value": value,
            },
        )

        return setting

    @staticmethod
    def get_matching_weights(db: Session) -> Dict[str, float]:
        """
        Retrieve active matching weights.
        Falls back to DEFAULT_MATCHING_WEIGHTS if not configured.
        """
        setting = db.query(SystemSetting).filter(SystemSetting.key == "matching.weights").first()
        if setting and isinstance(setting.value, dict):
            # Merge with defaults so any missing key has a safe default
            result = dict(DEFAULT_MATCHING_WEIGHTS)
            for k, v in setting.value.items():
                try:
                    result[k] = float(v)
                except (ValueError, TypeError):
                    pass
            return result
        return dict(DEFAULT_MATCHING_WEIGHTS)

    @staticmethod
    def update_matching_weights(
        db: Session, weights: Dict[str, float], actor: Optional[User] = None
    ) -> Dict[str, float]:
        """
        Update matching weights and validate normalization / positive floats.
        """
        # Validate weights are non-negative
        for k, v in weights.items():
            if v < 0:
                raise ValueError(f"Weight '{k}' must be non-negative, got {v}")

        setting = db.query(SystemSetting).filter(SystemSetting.key == "matching.weights").first()
        if not setting:
            setting = SystemSetting(
                key="matching.weights",
                value=weights,
                value_type=SettingValueType.JSON.value,
                category=SettingCategory.MATCHING.value,
                label="AI Matching Dimension Weights",
                description="Relative weights used by the multi-criteria startup ranking engine.",
                updated_by=actor.id if actor else None,
            )
            db.add(setting)
        else:
            old_value = setting.value
            setting.value = weights
            setting.updated_by = actor.id if actor else None
            setting.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(setting)

        AuditService.log_event(
            db=db,
            action=AuditAction.SCORING_CONFIG_CHANGED,
            entity_type="system_setting",
            entity_id=setting.id,
            actor=actor,
            summary=f"Startup matching weights updated by {actor.name if actor else 'System'}.",
            details={"weights": weights},
        )

        return setting.value

    @staticmethod
    def get_eligibility_config(db: Session) -> Dict[str, Any]:
        """Retrieve active eligibility criteria configuration."""
        setting = db.query(SystemSetting).filter(SystemSetting.key == "eligibility.criteria").first()
        if setting and isinstance(setting.value, dict):
            return setting.value
        return {
            "dpiit_required": True,
            "max_age_years": 10,
            "max_turnover_cr": 100,
            "min_incorporation_status": "ACTIVE",
        }


settings_service = SettingsService()
