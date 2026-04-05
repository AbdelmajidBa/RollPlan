using RollPlan.Api.Models.DTOs.Auth;

namespace RollPlan.Api.Services;

public interface IAuthService
{
    /// <summary>
    /// Registers a new user and returns a JWT token.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when email is already registered.</exception>
    Task<AuthResponse> RegisterAsync(RegisterRequest request);

    /// <summary>
    /// Authenticates a user and returns a JWT token.
    /// </summary>
    /// <exception cref="UnauthorizedAccessException">Thrown when credentials are invalid.</exception>
    Task<AuthResponse> LoginAsync(LoginRequest request);
}
