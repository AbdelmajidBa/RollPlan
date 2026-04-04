# Story 1.1: Initialize Monorepo and Project Scaffolding

Status: ready-for-dev

## Story

As a **developer**,
I want both the Angular and .NET projects initialized with all dependencies configured,
so that the team has a working foundation to build features on.

## Acceptance Criteria

1. `rollplan-client/` contains an Angular 17+ standalone app with Tailwind CSS configured and `ng serve` runs without errors
2. `rollplan-api/` contains a .NET 8 Web API and `dotnet run` runs without errors
3. Both projects live in a single monorepo with a root `.gitignore` and `README.md`
4. GitHub Actions CI workflows exist for both projects (build + test on push to any branch)
5. `appsettings.Development.json` is git-ignored

## Tasks / Subtasks

- [ ] Task 1: Create monorepo root (AC: #3)
  - [ ] Create root `README.md` with project description and local setup instructions
  - [ ] Create root `.gitignore` (covers Node, .NET, IDE, env files)

- [ ] Task 2: Initialize Angular project (AC: #1)
  - [ ] Run `ng new rollplan-client --standalone --routing --style=scss` from monorepo root
  - [ ] Confirm `ng serve` starts on `localhost:4200` without errors
  - [ ] Enable TypeScript strict mode in `tsconfig.json` (set `"strict": true`)

- [ ] Task 3: Configure Tailwind CSS in Angular (AC: #1)
  - [ ] Install: `npm install -D tailwindcss postcss autoprefixer`
  - [ ] Run: `npx tailwindcss init` (generates `tailwind.config.js`)
  - [ ] Configure `tailwind.config.js` with Angular content paths (see Dev Notes)
  - [ ] Add Tailwind directives to `src/styles.scss`
  - [ ] Confirm a Tailwind utility class renders correctly (e.g., add `class="text-red-500"` to `app.component.html`, verify in browser)
  - [ ] Remove Tailwind test class after confirming

- [ ] Task 4: Create Angular feature-folder skeleton (AC: #1)
  - [ ] Create empty directories with `.gitkeep`: `src/app/auth/`, `src/app/trips/`, `src/app/steps/`, `src/app/map/`, `src/app/share/`, `src/app/shared/`, `src/app/core/`
  - [ ] Create `src/environments/environment.ts` and `src/environments/environment.prod.ts` with `apiUrl` and `mapsApiKey` placeholders
  - [ ] Create `src/app/core/config/api.config.ts` exporting `API_BASE_URL` from environment

- [ ] Task 5: Initialize .NET Web API project (AC: #2)
  - [ ] Run `dotnet new webapi -n RollPlan.Api --use-controllers` from monorepo root (creates `rollplan-api/`)
  - [ ] Install all NuGet packages (see Dev Notes for exact package list)
  - [ ] Add minimal CORS policy in `Program.cs` allowing `http://localhost:4200` (dev) — leave placeholder for prod origin
  - [ ] Configure Serilog in `Program.cs` (console sink only for now — file sink added in Story 1.2)
  - [ ] Create `appsettings.Development.json` with empty placeholder sections for `ConnectionStrings`, `Jwt`, `AzureBlob`
  - [ ] Confirm `dotnet run` starts without errors and Swagger UI is accessible at `/swagger`

- [ ] Task 6: Configure .gitignore entries (AC: #5)
  - [ ] Add `rollplan-api/appsettings.Development.json` to root `.gitignore`
  - [ ] Confirm file is not tracked by git: run `git check-ignore -v rollplan-api/appsettings.Development.json`

- [ ] Task 7: GitHub Actions CI — Angular (AC: #4)
  - [ ] Create `.github/workflows/client-ci.yml`
  - [ ] Workflow: trigger on push/pull_request to any branch, use Node 20, run `npm ci`, `ng build`, `ng test --watch=false --browsers=ChromeHeadless`

- [ ] Task 8: GitHub Actions CI — .NET (AC: #4)
  - [ ] Create `.github/workflows/api-ci.yml`
  - [ ] Workflow: trigger on push/pull_request to any branch, use .NET 8, run `dotnet restore`, `dotnet build --no-restore`, `dotnet test --no-build`

## Dev Notes

### Angular Initialization

```bash
# Run from monorepo root (D:\Projects\RollPlan\)
ng new rollplan-client --standalone --routing --style=scss
```

**What `--standalone` gives you:**
- No `app.module.ts` — entry point is `app.config.ts` + `bootstrapApplication()` in `main.ts`
- Components declared with `standalone: true` (default in Angular 17+)
- `app.routes.ts` for routing (no `RouterModule` import needed in modules)

**Tailwind config** (`rollplan-client/tailwind.config.js`):
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Tailwind directives** (`rollplan-client/src/styles.scss`):
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**DO NOT use `ng add @angular/material`** — the architecture uses Tailwind CSS only. The architecture document's starter template section mentions Angular Material but this was explicitly overridden. Use Tailwind only.

### Environment Files

`src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',
  mapsApiKey: ''  // populate locally, never commit
};
```

`src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api.railway.app/api/v1',  // placeholder
  mapsApiKey: ''  // set via build env var
};
```

`src/app/core/config/api.config.ts`:
```typescript
import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiUrl;
```

### .NET Initialization

```bash
# Run from monorepo root
dotnet new webapi -n RollPlan.Api --use-controllers
cd rollplan-api
```

**NuGet packages to install** (all needed by subsequent stories — install now to avoid repeated context switches):
```bash
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package EFCore.NamingConventions
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Azure.Storage.Blobs
dotnet add package Serilog.AspNetCore
dotnet add package FluentValidation.AspNetCore
```

**`Program.cs` minimal setup for this story** (more configuration added in 1.2, 1.3):
```csharp
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS — allow Angular dev origin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngularDev");
app.UseAuthorization();
app.MapControllers();

app.Run();
```

**`appsettings.Development.json`** (git-ignored — developer creates locally):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "Jwt": {
    "Key": "",
    "Issuer": "",
    "Audience": ""
  },
  "AzureBlob": {
    "ConnectionString": "",
    "ContainerName": ""
  },
  "Serilog": {
    "MinimumLevel": "Debug"
  }
}
```

### Root .gitignore

The root `.gitignore` must cover both projects. Key entries:
```gitignore
# .NET
rollplan-api/bin/
rollplan-api/obj/
rollplan-api/appsettings.Development.json   ← CRITICAL: AC#5

# Angular
rollplan-client/node_modules/
rollplan-client/dist/
rollplan-client/.angular/

# IDE
.vs/
.vscode/
*.user
.idea/

# Environment
*.env
*.env.local
```

### GitHub Actions Workflows

`.github/workflows/client-ci.yml`:
```yaml
name: Angular CI
on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: rollplan-client
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: rollplan-client/package-lock.json
      - run: npm ci
      - run: npx ng build
      - run: npx ng test --watch=false --browsers=ChromeHeadless
```

`.github/workflows/api-ci.yml`:
```yaml
name: .NET CI
on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: rollplan-api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore
      - run: dotnet build --no-restore
      - run: dotnet test --no-build --verbosity normal
```

### Project Structure Notes

- Monorepo root: `D:\Projects\RollPlan\` (already exists)
- Angular project root: `rollplan-client/` (created by `ng new`)
- .NET project root: `rollplan-api/` (created by `dotnet new webapi`)
- Story 1.1 creates the **skeleton only** — no entities, no auth, no DB migration
- Story 1.2 adds: EF Core AppDbContext, PostgreSQL connection, `IStorageService`, `ErrorHandlingMiddleware`
- Do NOT configure EF Core or JWT in this story — leave them for 1.2 and 1.3 respectively
- Feature folder directories (`auth/`, `trips/`, etc.) created as empty skeletons with `.gitkeep` — components are added in their respective stories

### Architecture Compliance Checklist

- [ ] Angular uses `--standalone` flag (no NgModule)
- [ ] Angular uses `--style=scss`
- [ ] Tailwind CSS installed (NOT Angular Material)
- [ ] `tailwind.config.js` content paths include `./src/**/*.{html,ts}`
- [ ] .NET uses `--use-controllers` (not minimal API)
- [ ] `appsettings.Development.json` is git-ignored
- [ ] CORS allows `http://localhost:4200`
- [ ] TypeScript strict mode enabled

### References

- Angular init command: [Source: architecture.md#Starter-Template-Evaluation]
- Tailwind CSS decision: [Source: architecture.md#Frontend-Architecture] — explicitly overrides Angular Material mention in starter template section
- .NET init command and packages: [Source: architecture.md#Backend-.NET-8-Web-API]
- Feature-folder structure: [Source: architecture.md#Structure-Patterns]
- .gitignore requirement: [Source: epics.md#Story-1.1 AC#5]
- GitHub Actions CI: [Source: epics.md#Story-1.1 AC#4]
- CORS policy (dev origin): [Source: architecture.md#Authentication-Security]
- Serilog: [Source: architecture.md#Infrastructure-Deployment]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
