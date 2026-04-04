using Microsoft.AspNetCore.Identity;

namespace RollPlan.Api.Models.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
}
