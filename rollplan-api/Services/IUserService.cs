using RollPlan.Api.Models.DTOs.Users;

namespace RollPlan.Api.Services;

public interface IUserService
{
    /// <summary>
    /// Returns the profile for the given user.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when user is not found.</exception>
    Task<ProfileResponse> GetProfileAsync(Guid userId);

    /// <summary>
    /// Updates display name and/or email for the given user.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when user not found or email is already in use.</exception>
    Task<ProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
}
