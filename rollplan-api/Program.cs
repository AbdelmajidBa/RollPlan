using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RollPlan.Api.Data;
using RollPlan.Api.Middleware;
using RollPlan.Api.Models.Entities;
using RollPlan.Api.Storage;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog();

    builder.Services.AddControllers();
    builder.Services.AddOpenApi(); // .NET 9 built-in OpenAPI (replaces Swashbuckle)

    // CORS — allow Angular dev origin
    // Production origin added when deploying to Railway + Netlify/Vercel
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularDev", policy =>
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod());
    });

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

    var app = builder.Build();

    app.UseMiddleware<ErrorHandlingMiddleware>(); // FIRST — catches all downstream exceptions

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi(); // serves OpenAPI spec at /openapi/v1.json
    }

    app.UseHttpsRedirection();
    app.UseStaticFiles(); // serves /uploads/ in dev
    app.UseCors("AllowAngularDev");
    // app.UseAuthentication(); — added in Story 1.3 after JWT Bearer scheme configured
    app.UseAuthorization();
    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
