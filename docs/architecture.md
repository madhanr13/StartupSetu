# Architecture Documentation

## System Architecture

The platform follows a **modular monolith** architecture — a single deployable backend service with clear internal module boundaries, rather than distributed microservices.

### Why Modular Monolith?

1. **Simplicity** — One codebase, one deployment, one database
2. **Performance** — No inter-service network calls for internal operations
3. **Beginner-friendly** — Easy to understand, debug, and extend
4. **Sufficient scale** — Government procurement doesn't require microservice-level horizontal scaling

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Vite + TypeScript + Tailwind + shadcn/ui + Recharts)  │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                         │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ API Layer│  │  Services  │  │   AI Engine          │  │
│  │ (Routes) │→ │ (Business  │→ │ - Embeddings         │  │
│  │          │  │   Logic)   │  │ - LLM Integration    │  │
│  └──────────┘  └───────────┘  │ - Scoring Logic      │  │
│       │              │        └──────────────────────┘  │
│       │              ▼                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Repositories (Database Access)             │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ PostgreSQL │  │   MinIO    │  │   Redis    │
   │ + pgvector │  │ (Objects)  │  │ (Celery)   │
   └────────────┘  └────────────┘  └────────────┘
```

### Request Flow

```
Client Request
  → FastAPI Route (api/)
    → Validate with Pydantic Schema (schemas/)
      → Service Layer processes business logic (services/)
        → Repository Layer queries database (repositories/)
        → AI Engine if needed (ai/)
      → Return Pydantic Response Schema
    → JSON Response to Client
```

### AI Architecture: Human-in-the-Loop

```
Government Officer Input
  → AI Analyzes (embeddings, LLM)
    → AI Generates Evidence & Scores
      → AI Produces Recommendation with Explanation
        → Government Officer Reviews
          → Government Officer Makes Final Decision
            → Decision is Logged in Audit Trail
```

**Key principle:** AI supports decision-making. Humans make decisions.

### Data Flow: Innovation Procurement Lifecycle

```
1. PROBLEM    → Government identifies a problem
2. UNDERSTAND → AI structures requirements, domains, KPIs
3. MATCH      → AI semantically matches startups to problem
4. EVALUATE   → Startups submit proposals; AI + humans evaluate
5. PILOT      → Selected startup runs controlled pilot
6. MEASURE    → KPIs tracked against targets
7. VALIDATE   → Independent evaluators validate outcomes
8. SCALE      → AI recommends; government decides to scale/extend/reject
```

### Security Architecture

- **Authentication**: JWT tokens with Argon2 password hashing
- **Authorization**: Role-Based Access Control (RBAC) enforced at backend
- **Roles**: GOVERNMENT_OFFICER, STARTUP, EVALUATOR, ADMIN, AUDITOR
- **Audit Trail**: Every significant action logged with timestamp, actor, and details
- **Data Privacy**: Proposal documents stored in object storage, not in database
- **API Security**: CORS, rate limiting, input validation via Pydantic
