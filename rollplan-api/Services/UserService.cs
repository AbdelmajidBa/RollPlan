using Microsoft.AspNetCore.Identity;
using RollPlan.Api.Models.DTOs.Users;
using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Services;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UserService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<ProfileResponse> GetProfileAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");

        return new ProfileResponse
        {
            Email = user.Email!,
            DisplayName = user.DisplayName
        };
    }

    public async Task<ProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");

        // Always update DisplayName
        user.DisplayName = request.DisplayName;

        // Determine if email is changing
        var emailChanged = !string.Equals(request.Email, user.Email, StringComparison.OrdinalIgnoreCase);

        if (emailChanged)
        {
            // SetEmailAsync saves the full user entity (including DisplayName) and enforces uniqueness.
            // Parse IdentityResult errors directly — eliminates the TOCTOU check-then-act window.
            var setEmailResult = await _userManager.SetEmailAsync(user, request.Email);
            if (!setEmailResult.Succeeded)
            {
                var isDuplicate = setEmailResult.Errors.Any(e =>
                    e.Code is "DuplicateEmail" or "DuplicateUserName");
                throw new InvalidOperationException(isDuplicate
                    ? "Email is already in use."
                    : "Failed to update email.");
            }

            // Identity requires UserName == Email — keep them in sync
            var setUserNameResult = await _userManager.SetUserNameAsync(user, request.Email);
            if (!setUserNameResult.Succeeded)
                throw new InvalidOperationException("Failed to update username after email change.");
        }
        else
        {
            // Only DisplayName changed — save explicitly
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                throw new InvalidOperationException("Failed to update profile.");
        }

        return new ProfileResponse
        {
            Email = user.Email!,
            DisplayName = user.DisplayName
        };
    }
}
