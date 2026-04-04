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
