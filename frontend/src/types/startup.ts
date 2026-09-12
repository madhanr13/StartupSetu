/**
 * Startup domain types matching backend FastAPI schemas.
 */

export interface StartupTechnology {
  id?: string;
  technology: string;
  proficiency?: string;
  description?: string;
}

export interface StartupDomain {
  id?: string;
  domain: string;
}

export interface StartupProject {
  id?: string;
  name: string;
  description: string;
  domain?: string;
  technologies?: string[];
  outcome?: string;
  deployment_scale?: string;
  client_type?: string;
  year?: number;
}

export interface StartupCertification {
  id?: string;
  name: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
}

export interface StartupTeamCapability {
  id?: string;
  capability: string;
  experience_years?: number;
  description?: string;
}

export interface StartupDeployment {
  id?: string;
  project_id?: string;
  deployment_type: string;
  deployment_scale?: string;
  region?: string;
  status?: string;
}

export interface StartupReadinessScore {
  technical_capability: number;
  team_strength: number;
  deployment_readiness: number;
  security_readiness: number;
  scalability: number;
  financial_readiness: number;
  domain_experience: number;
  government_readiness: number;
  overall_score: number;
  calculated_at?: string;
}

export interface StartupSummary {
  id: string;
  company_name: string;
  slug: string;
  short_description?: string;
  founded_year?: number;
  location?: string;
  website?: string;
  logo_url?: string;
  employee_count?: number;
  dpiit_recognized: boolean;
  readiness_score?: StartupReadinessScore;
  technologies: string[];
  domains: string[];
}

export interface Startup {
  id: string;
  company_name: string;
  slug: string;
  short_description?: string;
  description?: string;
  founded_year?: number;
  location?: string;
  website?: string;
  contact_email?: string;
  logo_url?: string;
  employee_count?: number;
  dpiit_recognized: boolean;
  dpiit_number?: string;
  created_at: string;
  updated_at: string;

  technologies: StartupTechnology[];
  domains: StartupDomain[];
  projects: StartupProject[];
  certifications: StartupCertification[];
  team_capabilities: StartupTeamCapability[];
  deployments: StartupDeployment[];
  readiness_score?: StartupReadinessScore;
}

export interface MatchBreakdown {
  technology_fit: number;
  domain_fit: number;
  relevant_projects: number;
  team_capability: number;
  deployment_experience: number;
  scalability: number;
  security_readiness: number;
  budget_compatibility: number;
  explanation: string;
}

export interface EligibilityResult {
  is_eligible: boolean;
  status: "ELIGIBLE" | "CONDITIONALLY_ELIGIBLE" | "INELIGIBLE";
  checks: Record<string, boolean>;
  reasons: string[];
  warnings: string[];
}

export interface StartupMatchRecommendation {
  rank: number;
  startup: StartupSummary;
  match_score: number; // e.g. 94.1
  readiness_overall: number; // e.g. 87.0
  eligibility: EligibilityResult;
  match_breakdown: MatchBreakdown;
  why_recommended: string[];
  potential_concerns: string[];
}

export interface StartupComparisonResponse {
  challenge_id: string;
  challenge_title: string;
  recommendations: StartupMatchRecommendation[];
}
