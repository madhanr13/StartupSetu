# StartupSetu

> **A digital innovation procurement platform designed to help government departments identify, evaluate, pilot, procure, and scale innovative startup solutions.**

---

## Overview

Traditional public procurement systems are designed around standardized specifications and established vendors, making it difficult for public sector organizations to source cutting-edge innovations from dynamic startups.

**StartupSetu** bridges this gap by providing an end-to-end, transparent, and structured procurement lifecycle tailored for high-potential technology solutions. The platform enables government entities to frame requirement challenges, semantically discover capable startups, conduct multi-criteria evaluations, manage milestone-driven pilot projects with live KPI telemetry, and make evidence-backed procurement decisions with an immutable audit trail.

All AI-assisted capabilities operate under a strict **Human-in-the-Loop** model: automated intelligence aids in structuring, matching, and synthesis, while definitive procurement determinations and financial commitments remain exclusively with authorized human officials.

---

## Core Workflow

StartupSetu structures innovation procurement into ten sequential, transparent phases:

```mermaid
flowchart TD
    A[1. Government Challenge] --> B[2. AI-Assisted Structuring]
    B --> C[3. Startup Discovery & Matching]
    C --> D[4. Proposal Submission]
    D --> E[5. Proposal Evaluation]
    E --> F[6. Pilot & KPI Tracking]
    F --> G[7. Assessment]
    G --> H[8. Procurement Decision]
    H --> I[9. Scale-Up]
    I --> J[10. Innovation Memory]
```

1. **Government Challenge**: Department officials define operational problem statements, operational boundaries, budgetary parameters, and desired outcomes.
2. **AI-Assisted Structuring**: The system assists in decomposing challenges into functional requirements, target technical domains, measurable Key Performance Indicators (KPIs), and weighted evaluation rubrics.
3. **Startup Discovery & Matching**: Semantic vector search and domain capability scoring identify and rank verified startups aligned with the challenge's technical domain and readiness requirements.
4. **Proposal Submission**: Startups submit targeted technical proposals, cost models, milestone schedules, and supporting documentation through a guided interface.
5. **Proposal Evaluation**: Independent technical and operational evaluators score submissions using standardized rubrics, complemented by automated compliance and fact-extraction cross-checks.
6. **Pilot & KPI Tracking**: Shortlisted startups execute controlled, sandbox pilot deployments with defined milestone gates, deliverables, and continuous KPI telemetry.
7. **Assessment**: Pilot performance data, milestone deliverables, evaluator reviews, and operational feedback are synthesized into comprehensive outcome dossiers.
8. **Procurement Decision**: Department leadership reviews evidence-backed dossiers to render transparent, audited procurement verdicts: full scale-up, scoped contract extension, or structured closure.
9. **Scale-Up**: Validated solutions transition into wider departmental or inter-departmental production rollouts.
10. **Innovation Memory**: Performance metrics, operational lessons learned, and failure analyses are permanently archived to enrich organizational institutional knowledge for future procurements.

---

## Key Features

### Government Challenge Management
- Structured challenge creation wizard covering operational contexts, objectives, constraints, and eligibility criteria.
- Dynamic definition of evaluation criteria, scoring weights, and mandatory technical milestones.
- Role-gated challenge lifecycle management (Draft, Published, Under Review, Pilot Active, Completed, Archived).

### AI-Assisted Structuring
- Automatic extraction of functional requirements, domain tags, and candidate KPIs from unstructured challenge briefs.
- Consistency checks to ensure criteria alignment with departmental objectives and public procurement guidelines.

### Startup Profiles & Capability Discovery
- Comprehensive startup profiles detailing technical capabilities, core domains, team credentials, certifications, and previous deployment records.
- Verification and readiness scoring based on technical maturity, team capability, and operational history.

### Semantic Startup Matching & Explainable Scoring
- Vector embeddings and domain capability modeling to score match alignment between challenges and startup competencies.
- Fully transparent, explainable scoring breakdown showing domain affinity, technical depth, operational maturity, and reasoning factors.

### Proposal Management & Analysis
- Standardized submission workspace with support for technical narratives, cost breakdowns, and PDF attachment uploads.
- Automated document parsing and compliance checks to verify proposed deliverables against challenge specifications.

### Human Evaluation Workspace
- Dedicated multi-evaluator scoring interface with blinded or assigned review workflows.
- Qualitative commentary, rubric-based numeric assessments, score normalization, and evaluator consensus tracking.

### Pilot Management & Real-Time KPI Telemetry
- Stage-gated pilot execution with clear milestones, deliverables, and submission deadlines.
- Real-time KPI telemetry comparing target vs. actual values with time-series trend visualizations.
- Formal target modification audit trails requiring documented justifications before baseline changes are approved.
- Risk and issue registers categorized by severity (Low, Medium, High, Critical) with mitigation tracking.
- Secure evidence attachment gallery verifying milestone completion and performance claims.

### Procurement Decision Intelligence
- Automated generation of pilot outcome summaries and decision matrices.
- Formal decision recording with auditable officer rationales for scale-up, extension, or termination.

### Analytics & Operational Dashboards
- Executive dashboards aggregating challenge progress, active pilot health, pipeline velocity, and budgetary allocations.
- Real-time drilldowns into KPI progress, evaluator bottlenecks, and category-level procurement metrics.

### Comprehensive Audit Trail
- Immutable activity log capturing all user actions, state transitions, evaluation scores, target modifications, and procurement decisions.
- Role-tagged audit records with timestamps and actor metadata for governance and public accountability.

### Innovation Memory
- Institutional knowledge repository cataloging completed challenges, outcomes, and retrospective insights.
- Cross-challenge search to prevent duplicative efforts and benchmark realistic KPI baselines across departments.

### Configurable Administration & Settings
- Role-based permission management across administrative, departmental, evaluative, and startup stakeholders.
- System-wide configuration toggles for evaluation thresholds, matching weights, and notification parameters.

---

## Technology Stack

StartupSetu is built using modern, open, and robust technologies across all tiers:

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8 | High-performance, type-safe user interface |
| **Styling & Components** | Tailwind CSS v4, Lucide React | Clean, responsive design system and accessible icons |
| **Data Visualization** | Recharts | Interactive time-series, KPI telemetry, and analytics charts |
| **State & Forms** | TanStack Query, React Hook Form, Zod | Asynchronous data caching and schema-validated forms |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2 | High-concurrency asynchronous RESTful API service |
| **Database ORM** | SQLAlchemy 2.x, Alembic | Type-safe ORM and structured schema migrations |
| **Primary Database** | PostgreSQL + pgvector (Production)<br>SQLite (Local / Demo fallback) | Relational data persistence and vector similarity indexing |
| **AI / Machine Learning** | Sentence-Transformers, scikit-learn, NumPy | Semantic text embeddings, vector matching, and scoring models |
| **Document Processing** | PyMuPDF (fitz) | Extraction and analysis of proposal PDF documents |
| **Object Storage** | MinIO / S3-compatible storage | Secure storage for proposal attachments and pilot evidence |
| **Background Processing** | Redis, Celery | Asynchronous background tasks and telemetry ingestion |
| **Security & Auth** | Argon2 (`argon2-cffi`), JWT (`python-jose`), Passlib | Secure password hashing, token generation, and RBAC |
| **Containerization** | Docker, Docker Compose | Multi-container local orchestration and deployment |

---

## System Architecture

The application adopts a **modular monolith** design pattern—combining clean domain separation, high developer velocity, and operational simplicity without the network overhead of distributed microservices.

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│         (React 19 + TypeScript + Vite + Tailwind)       │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON / Multipart)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│                                                         │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ API Layer│  │  Services │  │      AI Engine       │  │
│  │ (Routes) │→ │ (Business │→ │ - Embeddings         │  │
│  │          │  │   Logic)  │  │ - Semantic Matcher   │  │
│  └──────────┘  └───────────┘  │ - Analysis Models    │  │
│       │              │        └──────────────────────┘  │
│       │              ▼                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Repositories (Data Access Layer)          │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ PostgreSQL │  │   MinIO    │  │   Redis    │
   │ + pgvector │  │ (Doc Store)│  │  (Queue)   │
   └────────────┘  └────────────┘  └────────────┘
```

### Architectural Highlights
- **Layered Decoupling**: API routers validate inputs via Pydantic schemas, delegate workflows to service classes, and interact with the database exclusively via repository layers.
- **Human-in-the-Loop AI Boundary**: The AI engine provides advisory suggestions, similarity scores, and automated text summaries; all state transitions and binding verdicts require authenticated human authorization.
- **Dual Database Mode**: Seamlessly switches between a production-ready PostgreSQL + pgvector instance and a lightweight SQLite database for zero-dependency local evaluations.

---

## Project Structure

```
StartupSetu/
├── backend/
│   ├── app/
│   │   ├── ai/              # AI engines (matching, analysis, structuring, memory)
│   │   ├── api/             # FastAPI route controllers grouped by domain
│   │   ├── core/            # Configuration, database setup, security, seed logic
│   │   ├── models/          # SQLAlchemy relational database models
│   │   ├── repositories/    # Database query abstractions
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Core business logic and workflow orchestration
│   │   ├── utils/           # Shared helper functions
│   │   └── main.py          # FastAPI application entry point and lifespan hooks
│   ├── Dockerfile           # Backend container build configuration
│   └── requirements.txt     # Python backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components, layouts, navigation, modals
│   │   ├── context/         # React Context providers (AuthContext, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # View pages grouped by feature and stakeholder role
│   │   │   ├── admin/       # Administrative management
│   │   │   ├── analytics/   # Analytical and intelligence dashboards
│   │   │   ├── audit/       # Governance and audit logs
│   │   │   ├── challenges/  # Challenge creation and exploration
│   │   │   ├── evaluator/   # Evaluation workspace
│   │   │   ├── gov/         # Departmental officer views
│   │   │   ├── memory/      # Innovation memory catalog
│   │   │   ├── pilots/      # Pilot workspace and KPI telemetry
│   │   │   ├── procurement/ # Procurement decisions and scale-up records
│   │   │   ├── proposals/   # Proposal submission, review, and detail views
│   │   │   ├── settings/    # Application settings and configurations
│   │   │   ├── startup/     # Startup portal views
│   │   │   ├── startups/    # Startup directory and discovery
│   │   │   └── LoginPage.tsx# Clean, role-aware authentication page
│   │   ├── services/        # Frontend API client modules
│   │   ├── types/           # TypeScript interface and type declarations
│   │   └── utils/           # Formatting, style merging, and utility functions
│   ├── Dockerfile           # Frontend container build configuration
│   ├── package.json         # Frontend package specifications and scripts
│   └── vite.config.ts       # Vite build and plugin configurations
│
├── data/
│   ├── sample-proposals/    # Synthetic sample documents for testing
│   └── seed/                # Seed fixtures and reference data
│
├── docs/
│   └── architecture.md      # Detailed system architecture notes
│
├── .env.example             # Template environment variable configuration
├── docker-compose.yml       # Multi-container orchestration specification
└── README.md                # Platform documentation
```

---

## AI & Decision Support

StartupSetu incorporates artificial intelligence strictly as an advisory and analytical layer, maintaining complete institutional transparency and human accountability:

| Capability | Implementation | Safeguard / Human Control |
|---|---|---|
| **Challenge Structuring** | Analyzes text briefs to generate candidate requirements, domains, and KPIs. | Department officers review, edit, or reject all generated requirements before publication. |
| **Semantic Matching** | Sentence-transformers compute similarity scores between challenge requirements and startup capability vectors. | Match scores include full breakdown explanations; officers decide which startups to invite or shortlist. |
| **Proposal Analysis** | Extracts key claims, budget figures, and schedules from technical proposals and checks document compliance. | Evaluators conduct independent manual reviews; AI extractions serve only as reference checks. |
| **Pilot Risk Assessment** | Identifies milestone variances, anomalous KPI drops, and reported issues to compute a pilot health indicator. | Department leadership and evaluators assess operational context before making any decisions. |
| **Innovation Memory** | Clusters retrospective outcomes and summarizes actionable recommendations for future challenges. | Stored as reference benchmarks; does not restrict new procurement criteria. |

---

## Security

StartupSetu incorporates defense-in-depth security best practices across all modules:

- **Authentication**: Stateless JSON Web Tokens (JWT) signed via HMAC-SHA256 with configurable expiry limits.
- **Credential Storage**: Cryptographically robust password hashing utilizing **Argon2** (`argon2-cffi`), preventing credential leakage.
- **Role-Based Access Control (RBAC)**: Strict authorization guards enforcing access boundaries across five distinct user roles:
  - `GOVERNMENT_OFFICER`: Challenge drafting, pilot supervision, procurement decision-making.
  - `STARTUP`: Profile maintenance, proposal submission, milestone/telemetry reporting.
  - `EVALUATOR`: Blinded proposal review, multi-criteria scoring, outcome validation.
  - `ADMIN`: System configuration, user account provisioning, departmental settings.
  - `AUDITOR`: Read-only oversight of system actions, timeline logs, and scoring decisions.
- **Input Validation & Sanitization**: Strict request schema enforcement via Pydantic on the backend and Zod on the frontend to protect against injection and malformed payloads.
- **Cross-Origin Resource Sharing (CORS)**: Configurable origin allowlisting restricting API access to designated domains.
- **Immutable Audit Logging**: Automatic, non-repudiable audit recording of all critical actions, scoring entries, target modifications, and procurement decisions.

---

## Getting Started

### Prerequisites

Ensure the following tools are installed on your workstation:
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher
- **Git**
- *(Optional)* **Docker & Docker Compose**: For containerized multi-service deployment

---

### Option A: Local Development Setup (Quickstart)

StartupSetu includes a built-in demo mode that automatically initializes an embedded SQLite database and populates comprehensive synthetic test fixtures, enabling full platform execution without external database dependencies.

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd StartupSetu
```

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (Command Prompt / PowerShell):
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the development server (auto-creates tables and seeds demo data on initial launch)
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*The interactive API documentation will be available at [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs).*

#### 3. Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The web application will launch at [http://localhost:5173](http://localhost:5173).*

---

### Option B: Containerized Setup (Docker Compose)

To launch the entire platform stack including PostgreSQL with pgvector, Redis, MinIO, and live service containers:

```bash
# Copy and review environment variables
cp .env.example .env

# Build and start all services
docker compose up --build
```

Services will be accessible at:
- **Web Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Interactive API Docs**: `http://localhost:8000/api/docs`
- **MinIO Console**: `http://localhost:9001`

---

## Environment Variables

Configure application settings by copying `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `APP_NAME` | Name identifier for the platform instance | `StartupSetu` |
| `APP_ENV` | Environment stage (`development`, `production`) | `development` |
| `DEBUG` | Enable verbose error reporting | `true` |
| `DEMO_MODE` | Enable automatic SQLite fallback and demo data seeding | `true` |
| `BACKEND_HOST` | Host address for FastAPI server | `0.0.0.0` |
| `BACKEND_PORT` | Port number for FastAPI server | `8000` |
| `BACKEND_CORS_ORIGINS` | Comma-delimited list of permitted frontend origins | `http://localhost:5173,http://localhost:3000` |
| `JWT_SECRET_KEY` | Secret key used to sign JSON Web Tokens | `generate-a-secure-random-key` |
| `JWT_ALGORITHM` | Cryptographic algorithm for JWT | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime before expiration | `60` |
| `DATABASE_URL` | PostgreSQL connection string (when `DEMO_MODE=false`) | `postgresql://user:password@localhost:5432/startupsetu_db` |
| `REDIS_URL` | Redis connection URL for background jobs and caching | `redis://localhost:6379/0` |
| `MINIO_ENDPOINT` | MinIO or S3-compatible storage endpoint | `localhost:9000` |
| `MINIO_ACCESS_KEY` | Storage service access key | `minioadmin` |
| `MINIO_SECRET_KEY` | Storage service secret key | `minioadmin` |
| `MINIO_BUCKET` | Target bucket for proposal and evidence attachments | `startupsetu-documents` |
| `MINIO_USE_SSL` | Enable SSL for object storage | `false` |
| `LLM_API_KEY` | Optional API key for extended LLM analysis | `your-api-key` |
| `LLM_MODEL` | Target language model for text synthesis | `gemini-pro` |
| `EMBEDDING_MODEL` | HuggingFace embedding model for vector matching | `all-MiniLM-L6-v2` |
| `VITE_API_BASE_URL` | Base API URL consumed by the React client | `http://localhost:8000/api` |

> *Note: Never commit `.env` files containing production secrets or credentials to version control.*

---

## Development

### Frontend Validation & Code Quality
```bash
cd frontend

# Run type check and production bundle compilation
npm run build

# Run linter
npm run lint
```

### Backend Code & Testing
```bash
cd backend

# Execute test suite
pytest
```

---

## Demo / Sample Data

For evaluation and demonstration purposes, StartupSetu provides pre-seeded synthetic data. This data is entirely fictional and explicitly generated for workflow validation:

- **Pre-Configured Demo Accounts** (Password for all demo accounts: `demo1234`):
  - Available via the one-click **"Quick Fill: Select Evaluation Account"** selector on the login screen for each role:
    - **Government Officer**: `gov@demo.local` — Manages municipal and infrastructure challenges.
    - **Startup Founder**: `startup@demo.local` — Represents a registered technology startup submitting proposals.
    - **Technical Evaluator**: `evaluator@demo.local` — Reviews proposals and scores technical criteria.
    - **Platform Admin**: `admin@demo.local` — Platform-wide settings and user administration.
    - **Public Auditor**: `auditor@demo.local` — Full access to review audit logs and decision trails.
- **Synthetic Challenges**: Sample procurement statements covering smart waste management, urban mobility, and digital public infrastructure.
- **Synthetic Startups & Pilots**: Pre-populated pilot telemetry, milestones, and KPI measurements demonstrating live tracking workflows.

*All synthetic demonstration data is isolated and does not reflect real-world departmental entities or proprietary startup intellectual property.*

---

## License

This project is licensed under the terms specified by the project maintainers. All rights reserved.
