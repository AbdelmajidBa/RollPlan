# RollPlan

Family trip planner — plan trips, build step-by-step itineraries, visualize routes on a map, capture notes and photos, and share with family via invite link.

**One-liner:** _Plan the trip. Live the trip. Remember the trip._

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21+ (standalone), Tailwind CSS |
| Backend | .NET 9 Web API, Entity Framework Core |
| Database | PostgreSQL |
| Photo Storage | Azure Blob Storage (prod) / Local Disk (dev) |
| Maps | Leaflet.js |
| Location Search | Google Places Autocomplete |

---

## Project Structure

```
RollPlan/
  rollplan-client/   ← Angular SPA
  rollplan-api/      ← .NET Web API
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- Angular CLI (`npm install -g @angular/cli`)
- .NET 9 SDK
- PostgreSQL (local instance or Docker)

### Frontend

```bash
cd rollplan-client
npm install
ng serve
# → http://localhost:4200
```

### Backend

```bash
cd rollplan-api
# Copy appsettings template and fill in values
cp appsettings.Development.json.example appsettings.Development.json
# Edit appsettings.Development.json with your PostgreSQL connection string
dotnet run
# → http://localhost:5000 | Swagger: http://localhost:5000/swagger
```

### Database

```bash
cd rollplan-api
dotnet ef database update
```

---

## Environment Variables

**Angular** — set in `rollplan-client/src/environments/environment.ts` (not committed):
- `apiUrl` — .NET API base URL
- `mapsApiKey` — Google Maps API key

**Backend** — set in `rollplan-api/appsettings.Development.json` (git-ignored):
- `ConnectionStrings:DefaultConnection` — PostgreSQL connection string
- `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` — JWT configuration
- `AzureBlob:ConnectionString`, `AzureBlob:ContainerName` — photo storage

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `client-ci.yml` — Angular build + test on push
- `api-ci.yml` — .NET build + test on push

Deploy targets: Railway (API + PostgreSQL), Netlify/Vercel (Angular).
