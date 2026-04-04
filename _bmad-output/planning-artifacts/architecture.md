---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation, step-08-complete]
status: 'complete'
completedAt: '2026-04-04'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md']
workflowType: 'architecture'
project_name: 'RollPlan'
user_name: 'Abdel'
date: '2026-04-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
31 FRs across 7 capability areas — User Management (4), Trip Management (5), Itinerary & Step Management (6), Map & Visualization (4), Moment Cards (6), Trip Sharing (4), Mobile Experience (2).

Architecturally this is a CRUD-heavy application with three distinct complexity zones:
1. **Standard CRUD** — trips, steps, user profile (straightforward)
2. **External integrations** — Google Maps rendering, Google Places autocomplete, photo storage (require careful API boundary design)
3. **Share model** — token-based read access without authentication (requires a clean public/protected route split)

**Non-Functional Requirements:**
- JWT auth on all endpoints except registration, login, and share-link trip view → requires route guard strategy both on Angular and .NET sides
- HTTPS, CORS, server-side photo validation → standard .NET middleware
- Stateless API (no in-memory session) → straightforward with JWT
- Graceful degradation on Maps/Places failure → fallback to text input and list view

**Scale & Complexity:**
- Primary domain: Full-stack web (SPA + REST API)
- Complexity level: Low-Medium — no real-time, no multi-tenancy, no compliance, single user per account
- Solo developer, personal project — simplicity and consistency over over-engineering

### Technical Constraints & Dependencies

- Angular 17+ SPA (client-side routing, standalone components)
- .NET 8 Web API + Entity Framework Core
- Google Maps JavaScript API + Google Places Autocomplete (API key required, free tier)
- Azure Blob Storage for photo uploads in prod; local disk in dev
- SQL Server or PostgreSQL (decision needed)
- JWT 7-day tokens, no refresh token v1
- Mobile-responsive at 375px+ (CSS only, not native)

### Cross-Cutting Concerns Identified

| Concern | Affects |
|---|---|
| JWT authentication | All API endpoints + Angular route guards |
| Share token (unauthenticated read) | Trip + Step + Moment Card read endpoints |
| Mobile responsiveness | All Angular components |
| Photo upload/storage | Moment Card, Step detail |
| Error handling & validation | All forms + API responses |
| Environment config (dev/prod) | Maps API key, storage backend, API base URL |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application: Angular 17+ SPA (frontend) + .NET 8 Web API (backend). Two separate project roots, monorepo structure.

### Repository Structure

```
/RollPlan
  /rollplan-client    ← Angular SPA
  /rollplan-api       ← .NET Web API
  /README.md
```

Single repo, independent deployments. Recommended for solo development.

### Frontend — Angular SPA

**Initialization Command:**
```bash
ng new rollplan-client --standalone --routing --style=scss
cd rollplan-client
ng add @angular/material
```

**Architectural Decisions Established:**
- **Components:** Standalone (no NgModule boilerplate)
- **Routing:** Angular Router pre-configured
- **Styling:** SCSS with Angular Material design system
- **Build:** Angular CLI + Webpack (production optimized)
- **TypeScript:** Strict mode
- **Testing:** Jasmine + Karma (unit), Playwright for e2e

### Backend — .NET 8 Web API

**Initialization Command:**
```bash
dotnet new webapi -n RollPlan.Api --use-controllers
cd RollPlan.Api
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Azure.Storage.Blobs
```

**Architectural Decisions Established:**
- **Pattern:** Controller-based REST API
- **ORM:** Entity Framework Core with Code-First migrations
- **Auth:** .NET Identity + JWT Bearer middleware
- **Storage:** Azure.Storage.Blobs SDK
- **API Docs:** Swagger/OpenAPI (included by default)

### Development Experience
- Angular dev server: `ng serve` (localhost:4200)
- .NET dev server: `dotnet run` (localhost:5000/5001)
- CORS: .NET configured to allow Angular dev origin
- Environment: `environment.ts` (Angular) + `appsettings.Development.json` (.NET)

**Note:** Project initialization is the first implementation story (Epic 1, Story 1).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- PostgreSQL as database
- Entity Framework Core Code-First migrations
- JWT auth with localStorage storage on Angular
- Policy-based authorization + `[AllowAnonymous]` for share endpoints
- Feature-folder structure in Angular

**Important Decisions (Shape Architecture):**
- Angular Signals + Services for state (no NgRx)
- Leaflet for map tiles + Google Places API for autocomplete only
- RFC 7807 ProblemDetails for API error responses
- Serilog for backend logging
- Railway (API + DB) + Netlify/Vercel (Angular) for deployment

**Deferred Decisions (Post-MVP):**
- JWT refresh tokens
- API versioning
- Monitoring/APM
- Real-time (SignalR)

### Data Architecture

- **Database:** PostgreSQL
- **ORM:** Entity Framework Core 8 — Code-First, migrations via `dotnet ef migrations add`
- **Connection:** Npgsql EF Core provider (`Npgsql.EntityFrameworkCore.PostgreSQL`)
- **Caching:** None for v1
- **Validation:** FluentValidation on API request DTOs; Angular Reactive Forms on client

### Authentication & Security

- **Auth provider:** ASP.NET Core Identity + JWT Bearer
- **Token:** 7-day access token, no refresh token in v1
- **Angular storage:** `localStorage`
- **Angular guards:** `CanActivate` guard checks token presence/expiry before protected routes
- **Authorization:** Policy-based `[Authorize]` on controllers; `[AllowAnonymous]` on auth + share endpoints
- **Share link:** `GET /api/v1/trips/share/{token}` — token validated in service layer, no JWT required
- **Password policy:** .NET Identity defaults (min 6 chars)
- **CORS:** Strict whitelist — `localhost:4200` (dev), prod domain (prod)

### API & Communication Patterns

- **Style:** RESTful, resource-based, controller-per-entity
- **Route prefix:** `/api/v1/`
- **Error format:** RFC 7807 ProblemDetails (built into .NET 8)
- **File upload:** `multipart/form-data` on dedicated photo upload endpoints
- **API docs:** Swagger/OpenAPI auto-generated, available at `/swagger` in dev
- **Versioning:** None for v1 — route prefix `/api/v1/` allows future versioning

### Frontend Architecture

- **State:** Angular Signals + injectable Services per feature domain (no NgRx)
- **HTTP:** `HttpClient` with interceptors for JWT attachment and global error handling
- **Styling:** Tailwind CSS — utility-first, no component library lock-in
- **Feature structure:**
  ```
  src/app/
    auth/         ← login, register, guard
    trips/        ← trip list, trip detail, trip form
    steps/        ← step list, step form, moment card
    map/          ← map component, pin rendering
    shared/       ← shared components, pipes, models
    core/         ← interceptors, services, config
  ```
- **Map:** Leaflet + `ngx-leaflet` for map tiles; Google Places JS API for autocomplete only
- **Forms:** Angular Reactive Forms throughout
- **Route guards:** Auth guard on all `/trips/**` routes; public route for `/share/:token`

### Infrastructure & Deployment

- **API hosting:** Railway (hobby tier)
- **Angular hosting:** Netlify or Vercel (free tier)
- **Database:** Railway PostgreSQL (managed)
- **Photo storage:** Azure Blob Storage (prod); local disk (dev)
- **CI/CD:** GitHub Actions — build + test on push, deploy on merge to `main`
- **Logging:** Serilog — console sink (dev), file sink (prod)
- **Secrets:** `appsettings.Development.json` (local, git-ignored) + GitHub Secrets (CI/CD)

### Decision Impact Analysis

**Implementation Sequence:**
1. PostgreSQL + EF Core setup → migrations
2. .NET Identity + JWT → auth endpoints
3. Angular project init → feature structure + interceptors + Tailwind
4. Trip/Step CRUD (API + Angular)
5. Leaflet map + Google Places
6. Moment Card (photo upload + notes)
7. Share link (public endpoint + Angular public route)

**Cross-Component Dependencies:**
- JWT interceptor must be in place before any authenticated API calls
- EF Core migrations must run before any data operations
- Google Places API key must be configured before step creation works
- Azure Blob connection string must be configured before photo upload works

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming (PostgreSQL + EF Core):**
- Tables: `PascalCase` via EF Core conventions (e.g., `Trips`, `Steps`, `Photos`)
- Columns: `snake_case` in PostgreSQL via `UseSnakeCaseNamingConvention()` (`EFCore.NamingConventions` package)
- Primary keys: `Id` — **Guid** on all entities (prevents enumeration, aligns with share token pattern)
- Foreign keys: `{Entity}Id` (e.g., `TripId`, `StepId`)

**API Naming Conventions:**
- Endpoints: plural nouns, kebab-case → `/api/v1/trips`, `/api/v1/trips/{id}/steps`
- Route parameters: `{id}` (Guid)
- Query parameters: `camelCase` → `?tripId=`, `?shareToken=`
- HTTP verbs: `GET` (read), `POST` (create), `PUT` (full update), `PATCH` (partial), `DELETE`

**Code Naming Conventions:**

| Context | Convention | Example |
|---|---|---|
| C# classes | PascalCase | `TripService`, `StepController` |
| C# methods | PascalCase + Async suffix | `GetTripByIdAsync` |
| C# properties | PascalCase | `CreatedAt`, `ShareToken` |
| Angular components | PascalCase class / kebab selector | `TripListComponent` / `app-trip-list` |
| Angular files | kebab-case | `trip-list.component.ts` |
| Angular services | PascalCase | `TripService` |
| TypeScript interfaces | PascalCase | `Trip`, `Step`, `MomentCard` |
| Angular signals | camelCase | `trips = signal<Trip[]>([])` |

### Structure Patterns

**Backend (.NET):**
```
RollPlan.Api/
  Controllers/
    AuthController.cs
    TripsController.cs
    StepsController.cs
    PhotosController.cs
    ShareController.cs
  Services/
    TripService.cs
    StepService.cs
    PhotoService.cs
    AuthService.cs
  Models/
    Entities/
    DTOs/
  Data/
    AppDbContext.cs
    Migrations/
  Middleware/
    ErrorHandlingMiddleware.cs
```

**Frontend (Angular):**
```
src/app/
  auth/
    login/
    register/
    guards/
    services/
  trips/
    trip-list/
    trip-detail/
    trip-form/
    services/
    models/
  steps/
    step-list/
    step-form/
    moment-card/
    services/
    models/
  map/
    trip-map/
    services/
  share/
  shared/
    components/
    pipes/
    models/
  core/
    interceptors/
    services/
    config/
```

**Tests:** Co-located — `trip.service.spec.ts` next to `trip.service.ts`

### Format Patterns

**API Response — Success (direct, no wrapper):**
```json
{
  "id": "guid",
  "name": "Normandy 2026",
  "status": "Planning",
  "createdAt": "2026-04-04T20:00:00Z"
}
```

**API Response — Error (RFC 7807 ProblemDetails):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Trip with id 'xxx' not found."
}
```

- **Date/Time:** ISO 8601 strings (`2026-04-04T20:00:00Z`)
- **JSON fields:** `camelCase` (ASP.NET Core default)
- **Booleans:** `true`/`false` (never `1`/`0`)

### Process Patterns

**Error Handling:**
- .NET: Global `ErrorHandlingMiddleware` → ProblemDetails on all unhandled exceptions
- Angular: HTTP interceptor → 401 redirects to login; 4xx/5xx shows toast notification
- Never swallow exceptions silently

**Loading States (Angular):**
- Per-feature signal: `isLoading = signal<boolean>(false)`
- Wrap all service calls: set `true` before, `false` in `finally`

**Validation:**
- Client-side: Angular Reactive Forms validators (immediate feedback)
- Server-side: FluentValidation on all DTOs (source of truth)

**Authentication Flow:**
- App init: check `localStorage` JWT → validate expiry → redirect to login if expired
- 401 response: clear token → redirect to login
- Login success: store token in `localStorage` → navigate to `/trips`

### Enforcement Guidelines

**All implementations MUST:**
- Use Guid as primary key on all entities
- Return ProblemDetails on all API errors
- Use `snake_case` column names in PostgreSQL via `UseSnakeCaseNamingConvention()`
- Suffix async C# methods with `Async`
- Use Angular Signals (not BehaviorSubject) for state
- Validate all inputs server-side with FluentValidation
- Never expose internal exception details in API responses

## Project Structure & Boundaries

### Complete Project Directory Structure

```
RollPlan/                              ← monorepo root
├── README.md
├── .gitignore
├── .github/
│   └── workflows/
│       ├── api-ci.yml
│       └── client-ci.yml
│
├── rollplan-api/                      ← .NET 8 Web API
│   ├── RollPlan.Api.csproj
│   ├── appsettings.json
│   ├── appsettings.Development.json   ← git-ignored
│   ├── appsettings.Production.json
│   ├── Program.cs
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── TripsController.cs
│   │   ├── StepsController.cs
│   │   ├── PhotosController.cs
│   │   └── ShareController.cs
│   ├── Services/
│   │   ├── AuthService.cs
│   │   ├── TripService.cs
│   │   ├── StepService.cs
│   │   ├── PhotoService.cs
│   │   └── ShareService.cs
│   ├── Models/
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Trip.cs
│   │   │   ├── Step.cs
│   │   │   ├── Photo.cs
│   │   │   └── Note.cs
│   │   └── DTOs/
│   │       ├── Auth/
│   │       ├── Trips/
│   │       ├── Steps/
│   │       └── Photos/
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Migrations/
│   ├── Middleware/
│   │   └── ErrorHandlingMiddleware.cs
│   ├── Storage/
│   │   ├── IStorageService.cs
│   │   ├── AzureBlobStorageService.cs
│   │   └── LocalStorageService.cs
│   └── Tests/
│       ├── Controllers/
│       └── Services/
│
└── rollplan-client/                   ← Angular 17+ SPA
    ├── package.json
    ├── angular.json
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── main.ts
        ├── styles.scss
        ├── environments/
        │   ├── environment.ts
        │   └── environment.prod.ts
        └── app/
            ├── app.config.ts
            ├── app.routes.ts
            ├── auth/
            │   ├── login/
            │   ├── register/
            │   ├── guards/
            │   │   └── auth.guard.ts
            │   └── services/
            │       └── auth.service.ts
            ├── trips/
            │   ├── trip-list/
            │   ├── trip-detail/
            │   ├── trip-form/
            │   ├── models/
            │   │   └── trip.model.ts
            │   └── services/
            │       └── trip.service.ts
            ├── steps/
            │   ├── step-list/
            │   ├── step-form/
            │   ├── moment-card/
            │   ├── models/
            │   │   └── step.model.ts
            │   └── services/
            │       └── step.service.ts
            ├── map/
            │   ├── trip-map/
            │   └── services/
            │       └── map.service.ts
            ├── share/
            │   └── share-view/
            ├── shared/
            │   ├── components/
            │   │   ├── confirm-dialog/
            │   │   ├── photo-upload/
            │   │   └── loading-spinner/
            │   ├── pipes/
            │   └── models/
            └── core/
                ├── interceptors/
                │   ├── auth.interceptor.ts
                │   └── error.interceptor.ts
                ├── services/
                │   └── notification.service.ts
                └── config/
                    └── api.config.ts
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Auth Required | Notes |
|---|---|---|
| `/api/v1/auth/**` | No | Login, register |
| `/api/v1/trips/**` | Yes (JWT) | Full CRUD |
| `/api/v1/trips/{id}/steps/**` | Yes (JWT) | Nested resource |
| `/api/v1/photos/**` | Yes (JWT) | Upload/delete |
| `/api/v1/share/{token}` | No | Read-only public |

**Data Flow:**
```
Angular Component
  → TripService (Angular)
    → HttpClient + Auth Interceptor
      → .NET TripsController
        → TripService (.NET)
          → AppDbContext (EF Core)
            → PostgreSQL
```

**External Integrations:**

| Service | Used By | Location |
|---|---|---|
| Google Places API | Step form location input | `step-form` component |
| Leaflet tiles | Map rendering | `trip-map` component |
| Azure Blob Storage | Photo upload/serve | `PhotoService.cs` / `AzureBlobStorageService.cs` |

### Requirements to Structure Mapping

| FR Category | Backend | Frontend |
|---|---|---|
| User Management (FR1–4) | `AuthController`, `AuthService` | `auth/` |
| Trip Management (FR5–9) | `TripsController`, `TripService` | `trips/` |
| Step Management (FR10–15) | `StepsController`, `StepService` | `steps/` |
| Map & Visualization (FR16–19) | (data via Steps API) | `map/` |
| Moment Cards (FR20–25) | `PhotosController`, `StepService` | `moment-card/`, `photo-upload/` |
| Trip Sharing (FR26–29) | `ShareController`, `ShareService` | `share/` |
| Mobile Experience (FR30–31) | N/A | All components (Tailwind responsive) |

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are compatible — Angular 17 + Tailwind, .NET 8 + EF Core + Npgsql, JWT Bearer, Azure Blob. No version conflicts. Leaflet + Google Places (non-billing map tiles, paid autocomplete only) is a clean split.

Guid PKs, `snake_case` DB columns, `camelCase` JSON, ProblemDetails errors, Signals state — all consistent and non-contradictory.

Feature-folder Angular structure aligns with controller-per-entity .NET structure. `share/` module correctly isolated as public-only. `core/interceptors` handles cross-cutting auth + error concerns.

### Requirements Coverage Validation ✅

All 31 FRs architecturally covered across `AuthController`, `TripsController`, `StepsController`, `PhotosController`, `ShareController` on the backend, and `auth/`, `trips/`, `steps/`, `map/`, `moment-card/`, `share/` on the frontend.

All NFRs covered: JWT + HTTPS + CORS + GUID tokens (security), stateless API (scalability), Tailwind responsive (mobile), graceful degradation on Maps/Places (integration).

### Gap Analysis — Resolved

**Note storage:** `Note` is a nullable string column on the `Step` entity (not a separate table). One note per step, no join required.

**Photo serving:** Photos served via direct Azure Blob Storage URL (public container or SAS token). Angular renders `<img [src]="photo.url">` directly — no API proxy.

### Architecture Completeness Checklist

- [x] Project context analyzed and complexity assessed
- [x] Starter templates defined with exact initialization commands
- [x] All critical architectural decisions documented
- [x] Implementation patterns and naming conventions established
- [x] Complete project directory structure defined
- [x] All 31 FRs mapped to architectural components
- [x] All NFRs addressed
- [x] Integration points (Maps, Places, Blob) defined
- [x] Public vs authenticated API boundaries established
- [x] Data model gaps resolved (Note as column, photo URL strategy)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Simple, well-understood stack with no exotic dependencies
- Clear separation between public (share) and authenticated routes
- Storage abstraction (`IStorageService`) enables dev/prod switching
- Feature-folder structure scales cleanly as features are added

**First Implementation Priority:**
```bash
# 1. Initialize repos
ng new rollplan-client --standalone --routing --style=scss
dotnet new webapi -n RollPlan.Api --use-controllers

# 2. Install dependencies (as documented in Starter Template section)
# 3. Configure EF Core + PostgreSQL + run initial migration
# 4. Implement JWT auth (Epic 1)
```
