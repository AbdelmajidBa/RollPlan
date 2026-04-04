# Story 1.2: Configure Backend Data Layer

Status: in-progress

## Story

As a **developer**,
I want EF Core connected to PostgreSQL with the base AppDbContext configured,
so that subsequent stories can define and migrate entity schemas.

## Acceptance Criteria

1. When `dotnet ef migrations add Initial` is run, a migration is created successfully and applies to a local PostgreSQL instance
2. `UseSnakeCaseNamingConvention()` is active on the DbContext
3. `IStorageService` abstraction exists with `LocalStorageService` (dev) and `AzureBlobStorageService` (prod) implementations
4. `ErrorHandlingMiddleware` returns RFC 7807 ProblemDetails for unhandled exceptions

## Tasks / Subtasks

- [x] Task 1: Install EF Core tooling (AC: #1)
  - [x] Add `Microsoft.EntityFrameworkCore.Design` package to `rollplan-api` (required by `dotnet ef` CLI)
  - [x] Install `dotnet-ef` global tool v9: `dotnet tool install --global dotnet-ef --version "9.*"` (skip if already installed)
  - [x] Confirm: `dotnet ef --version` prints a 9.x version (9.0.14 installed)

- [x] Task 2: Create `ApplicationUser` entity (AC: #1, #2)
  - [x] Create `rollplan-api/Models/Entities/ApplicationUser.cs`
  - [x] Inherits `IdentityUser<Guid>` — gives Guid PK on all Identity tables automatically
  - [x] Add `DisplayName` string property (used in Story 1.5 profile edit)
  - [x] No other custom properties yet

- [x] Task 3: Create `AppDbContext` (AC: #1, #2)
  - [x] Create `rollplan-api/Data/AppDbContext.cs`
  - [x] Inherits `IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>`
  - [x] Constructor takes `DbContextOptions<AppDbContext>`
  - [x] Override `OnModelCreating` — call `base.OnModelCreating(builder)` (required by Identity)
  - [x] No custom `DbSet` properties yet — Trip, Step, Photo entities added in Epics 2–5

- [x] Task 4: Register EF Core + Identity in `Program.cs` (AC: #1, #2)
  - [x] Add `builder.Services.AddDbContext<AppDbContext>` with Npgsql provider + `UseSnakeCaseNamingConvention()`
  - [x] Connection string from `builder.Configuration.GetConnectionString("DefaultConnection")`
  - [x] Add `builder.Services.AddIdentityCore<ApplicationUser>` (NOT `AddIdentity` — avoids adding cookie auth)
  - [x] Chain: `.AddRoles<IdentityRole<Guid>>().AddEntityFrameworkStores<AppDbContext>().AddDefaultTokenProviders()`
  - [x] Set password policy: `RequiredLength = 6`, `RequireDigit = false`, `RequireNonAlphanumeric = false`, `RequireUppercase = false`
  - [x] Set user policy: `RequireUniqueEmail = true`

- [x] Task 5: Create `IStorageService` abstraction (AC: #3)
  - [x] Create `rollplan-api/Storage/IStorageService.cs`
  - [x] Interface with two methods: `UploadFileAsync(Stream, string fileName, string contentType)` → `Task<string>` (returns public URL); `DeleteFileAsync(string fileUrl)` → `Task`

- [x] Task 6: Create `LocalStorageService` (dev) (AC: #3)
  - [x] Create `rollplan-api/Storage/LocalStorageService.cs`
  - [x] Constructor injects `IWebHostEnvironment` and `IHttpContextAccessor`
  - [x] `UploadFileAsync`: generates a unique filename (`{Guid}.{ext}`), saves to `{WebRootPath}/uploads/`, returns URL `/uploads/{filename}`
  - [x] `DeleteFileAsync`: resolves file path from URL, deletes from disk if exists
  - [x] Creates `wwwroot/uploads/` directory if it does not exist on first upload
  - [x] Register `IHttpContextAccessor` in DI (`builder.Services.AddHttpContextAccessor()`)

- [x] Task 7: Create `AzureBlobStorageService` (prod) (AC: #3)
  - [x] Create `rollplan-api/Storage/AzureBlobStorageService.cs`
  - [x] Constructor injects `IConfiguration`
  - [x] Reads `AzureBlob:ConnectionString` and `AzureBlob:ContainerName` from config
  - [x] `UploadFileAsync`: uploads stream to blob container, returns full blob URL (`https://<account>.blob.core.windows.net/<container>/<filename>`)
  - [x] `DeleteFileAsync`: parses blob name from URL, deletes blob
  - [x] Do NOT throw if blob not found on delete (idempotent delete)

- [x] Task 8: Register `IStorageService` in DI (AC: #3)
  - [x] In `Program.cs`: if `IsDevelopment()` → register `LocalStorageService`, else → register `AzureBlobStorageService`
  - [x] Add `app.UseStaticFiles()` BEFORE `UseCors` (required to serve `/uploads/` in dev)
  - [x] Add `builder.Services.AddHttpContextAccessor()`

- [x] Task 9: Create `ErrorHandlingMiddleware` (AC: #4)
  - [x] Create `rollplan-api/Middleware/ErrorHandlingMiddleware.cs`
  - [x] Constructor takes `RequestDelegate` and `ILogger<ErrorHandlingMiddleware>`
  - [x] `InvokeAsync`: wraps `_next(context)` in try/catch
  - [x] On exception: log with `_logger.LogError(ex, ...)`, write RFC 7807 ProblemDetails response
  - [x] Response: `Content-Type: application/problem+json`, status 500, `detail` is always generic ("An internal server error has occurred") — never expose `ex.Message`
  - [x] Use `context.Response.WriteAsJsonAsync(problem)` to write response

- [x] Task 10: Register `ErrorHandlingMiddleware` in pipeline (AC: #4)
  - [x] Add `app.UseMiddleware<ErrorHandlingMiddleware>()` as the FIRST middleware in `app` pipeline (before all others)
  - [x] Clean up deferred item from Story 1.1: replace stale `Logging` section in `appsettings.json` with Serilog-based config
  - [x] Add `app.UseAuthentication()` placeholder comment in pipeline (JWT Bearer scheme added in Story 1.3)

- [ ] Task 11: Run and verify initial EF migration (AC: #1) — DEFERRED (no local PostgreSQL at time of implementation)
  - [ ] Fill in `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` with local PostgreSQL connection string
  - [ ] Run: `dotnet ef migrations add Initial --project rollplan-api`
  - [ ] Inspect generated migration — should contain Identity tables (AspNetUsers, AspNetRoles, etc.) with snake_case column names
  - [ ] Run: `dotnet ef database update --project rollplan-api`
  - [ ] Confirm migration applied (check `__ef_migrations_history` table in PostgreSQL)

## Dev Notes

### What's Already in Place (from Story 1.1)

`Program.cs` already has:
- Serilog bootstrap logger + `builder.Host.UseSerilog()`
- `builder.Services.AddControllers()`
- `builder.Services.AddOpenApi()` / `app.MapOpenApi()`
- CORS policy `AllowAngularDev` for `localhost:4200`
- `app.UseHttpsRedirection()` / `app.UseAuthorization()` / `app.MapControllers()`

Packages already installed and pinned:
- `Npgsql.EntityFrameworkCore.PostgreSQL 9.0.4`
- `EFCore.NamingConventions 9.0.0`
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore 9.0.14`
- `Azure.Storage.Blobs 12.27.0`
- `Serilog.AspNetCore 10.0.0`

**DO NOT reinstall any packages from this list.** Only add `Microsoft.EntityFrameworkCore.Design`.

### ApplicationUser

```csharp
// rollplan-api/Models/Entities/ApplicationUser.cs
using Microsoft.AspNetCore.Identity;

namespace RollPlan.Api.Models.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
}
```

### AppDbContext

```csharp
// rollplan-api/Data/AppDbContext.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Trip, Step, Photo DbSets added in Epics 2–5

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder); // REQUIRED — sets up Identity tables
    }
}
```

### `AddIdentityCore` vs `AddIdentity`

**MUST use `AddIdentityCore`** — `AddIdentity` also adds cookie authentication schemes which conflict with JWT Bearer auth added in Story 1.3.

```csharp
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole<Guid>>()
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();
```

### EF Core + PostgreSQL Registration

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention()); // from EFCore.NamingConventions
```

### IStorageService Interface

```csharp
// rollplan-api/Storage/IStorageService.cs
namespace RollPlan.Api.Storage;

public interface IStorageService
{
    /// <summary>Uploads a file and returns its publicly accessible URL.</summary>
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);

    /// <summary>Deletes a file by its public URL. Idempotent — no-op if not found.</summary>
    Task DeleteFileAsync(string fileUrl);
}
```

### LocalStorageService

```csharp
// rollplan-api/Storage/LocalStorageService.cs
using Microsoft.AspNetCore.Http.Extensions;

namespace RollPlan.Api.Storage;

public class LocalStorageService : IStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LocalStorageService(IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor)
    {
        _env = env;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var uploadsPath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsPath);

        var ext = Path.GetExtension(fileName);
        var storedName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsPath, storedName);

        await using var fs = File.Create(filePath);
        await fileStream.CopyToAsync(fs);

        // Build absolute URL from current request context
        var request = _httpContextAccessor.HttpContext!.Request;
        return $"{request.Scheme}://{request.Host}/uploads/{storedName}";
    }

    public Task DeleteFileAsync(string fileUrl)
    {
        var fileName = Path.GetFileName(new Uri(fileUrl).LocalPath);
        var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", fileName);
        if (File.Exists(filePath))
            File.Delete(filePath);
        return Task.CompletedTask;
    }
}
```

### AzureBlobStorageService

```csharp
// rollplan-api/Storage/AzureBlobStorageService.cs
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace RollPlan.Api.Storage;

public class AzureBlobStorageService : IStorageService
{
    private readonly BlobContainerClient _containerClient;

    public AzureBlobStorageService(IConfiguration configuration)
    {
        var connectionString = configuration["AzureBlob:ConnectionString"]!;
        var containerName = configuration["AzureBlob:ContainerName"]!;
        _containerClient = new BlobContainerClient(connectionString, containerName);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var ext = Path.GetExtension(fileName);
        var blobName = $"{Guid.NewGuid()}{ext}";
        var blobClient = _containerClient.GetBlobClient(blobName);

        await blobClient.UploadAsync(fileStream, new BlobHttpHeaders { ContentType = contentType });
        return blobClient.Uri.ToString();
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        var blobName = Path.GetFileName(new Uri(fileUrl).LocalPath);
        var blobClient = _containerClient.GetBlobClient(blobName);
        await blobClient.DeleteIfExistsAsync(); // idempotent
    }
}
```

### ErrorHandlingMiddleware

```csharp
// rollplan-api/Middleware/ErrorHandlingMiddleware.cs
using Microsoft.AspNetCore.Mvc;

namespace RollPlan.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception _)
    {
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7807",
            Title = "An unexpected error occurred.",
            Status = StatusCodes.Status500InternalServerError,
            Detail = "An internal server error has occurred." // never expose ex.Message
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
```

### Updated `Program.cs` Structure (after Story 1.2)

Add these registrations in the `builder.Services` section (after existing registrations):

```csharp
// Data
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

// Identity (core only — JWT Bearer scheme added in Story 1.3)
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole<Guid>>()
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Storage
builder.Services.AddHttpContextAccessor();
if (builder.Environment.IsDevelopment())
    builder.Services.AddScoped<IStorageService, LocalStorageService>();
else
    builder.Services.AddScoped<IStorageService, AzureBlobStorageService>();
```

Add to the `app` pipeline — MUST be in this order:

```csharp
app.UseMiddleware<ErrorHandlingMiddleware>(); // FIRST — catches all downstream exceptions
// app.UseHttpsRedirection(); — already there
app.UseStaticFiles();                         // serves /uploads/ in dev
// app.UseCors("AllowAngularDev"); — already there
// app.UseAuthentication(); — added in Story 1.3 after JWT Bearer scheme configured
// app.UseAuthorization(); — already there
// app.MapControllers(); — already there
```

### appsettings.json — Clean Up Stale Logging Section

Replace the existing content with a Serilog-based config (cleans up the deferred item from Story 1.1 review):

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    }
  },
  "AllowedHosts": "*"
}
```

### Local PostgreSQL Connection String

Format for `appsettings.Development.json`:
```json
"ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=rollplan_dev;Username=postgres;Password=yourpassword"
}
```

Developer must have a local PostgreSQL instance running. Create the `rollplan_dev` database manually before running migrations:
```sql
CREATE DATABASE rollplan_dev;
```

### EF Migration Commands

```bash
# From monorepo root
dotnet ef migrations add Initial --project rollplan-api

# Apply to database
dotnet ef database update --project rollplan-api
```

Expected migration tables (Identity): `asp_net_users`, `asp_net_roles`, `asp_net_user_roles`, `asp_net_user_claims`, `asp_net_user_logins`, `asp_net_user_tokens`, `asp_net_role_claims` — all with `snake_case` column names (e.g., `user_name`, `email`, `password_hash`).

### Project Structure Notes

New files for this story:
```
rollplan-api/
  Models/
    Entities/
      ApplicationUser.cs       ← NEW
  Data/
    AppDbContext.cs             ← NEW
    Migrations/                 ← GENERATED by dotnet ef
  Middleware/
    ErrorHandlingMiddleware.cs  ← NEW
  Storage/
    IStorageService.cs          ← NEW
    LocalStorageService.cs      ← NEW
    AzureBlobStorageService.cs  ← NEW
```

### Architecture Compliance Checklist

- [ ] `AppDbContext` inherits `IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>` (Guid keys on all Identity tables)
- [ ] `UseSnakeCaseNamingConvention()` chained on `UseNpgsql()` call
- [ ] `AddIdentityCore` used (NOT `AddIdentity` — avoids cookie auth conflict with JWT)
- [ ] `ErrorHandlingMiddleware` is first in the pipeline
- [ ] `ex.Message` never written to response body
- [ ] `IStorageService` registered as scoped (not singleton) — `LocalStorageService` uses `IHttpContextAccessor` which is request-scoped

### References

- Data architecture: [Source: architecture.md#Data-Architecture]
- `UseSnakeCaseNamingConvention`: [Source: architecture.md#Naming-Patterns]
- Guid PKs on all entities: [Source: architecture.md#Enforcement-Guidelines]
- `IStorageService` abstraction: [Source: architecture.md#Data-Architecture]
- `ErrorHandlingMiddleware` → ProblemDetails: [Source: architecture.md#Process-Patterns]
- RFC 7807 format: [Source: architecture.md#Format-Patterns]
- Project structure: [Source: architecture.md#Structure-Patterns]
- Story 1.1 learnings: `appsettings.json` Logging section deferred; .NET 9 (not 8); `AddIdentityCore` to avoid cookie auth conflict

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `dotnet-ef` global tool was not installed — installed `dotnet-ef 9.0.14` via `dotnet tool install --global dotnet-ef --version "9.*"`
- `Microsoft.EntityFrameworkCore.Design` auto-resolved to `9.*` (floating) — pinned to `9.0.14` in csproj post-install
- Task 11 (migration) deferred — no local PostgreSQL instance available at implementation time; all code in place, migration ready to run

### Completion Notes List

- AC1 ✅ EF Core Design package installed; `dotnet-ef 9.0.14` installed; `AppDbContext` + migration scaffolding ready (migration deferred to when PostgreSQL is available)
- AC2 ✅ `UseSnakeCaseNamingConvention()` chained on `UseNpgsql()` in `Program.cs`
- AC3 ✅ `IStorageService` interface + `LocalStorageService` (dev) + `AzureBlobStorageService` (prod) created and registered
- AC4 ✅ `ErrorHandlingMiddleware` first in pipeline; returns RFC 7807 ProblemDetails; never exposes `ex.Message`
- Deferred: Task 1.1 cleanup item resolved — `appsettings.json` stale `Logging` section replaced with Serilog config
- Deferred: Task 11 (EF migration) — requires PostgreSQL connection; all code in place; run when DB available

### File List

- `rollplan-api/Models/Entities/ApplicationUser.cs` (NEW)
- `rollplan-api/Data/AppDbContext.cs` (NEW)
- `rollplan-api/Storage/IStorageService.cs` (NEW)
- `rollplan-api/Storage/LocalStorageService.cs` (NEW)
- `rollplan-api/Storage/AzureBlobStorageService.cs` (NEW)
- `rollplan-api/Middleware/ErrorHandlingMiddleware.cs` (NEW)
- `rollplan-api/Program.cs` (MODIFIED — added DbContext, Identity, Storage, ErrorHandlingMiddleware, UseStaticFiles)
- `rollplan-api/appsettings.json` (MODIFIED — replaced stale Logging section with Serilog config)
- `rollplan-api/RollPlan.Api.csproj` (MODIFIED — added Microsoft.EntityFrameworkCore.Design 9.0.14)
