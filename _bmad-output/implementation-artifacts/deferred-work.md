# Deferred Work

## Deferred from: code review of 1-1-initialize-monorepo-and-project-scaffolding (2026-04-05)

- `appsettings.json` retains .NET built-in `Logging` section — silently ignored by Serilog. Clean up when adding full Serilog config in Story 1.2.
- CORS `AllowAngularDev` policy hardcoded to `localhost:4200` — production frontend domain will be CORS-blocked. Must add configurable prod origin (from appsettings) before deploying to production. Address in deployment/infrastructure story.
