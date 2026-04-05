namespace RollPlan.Api.Models.DTOs.Users;

public class UpdateProfileRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
