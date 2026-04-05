using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using RollPlan.Api.Models.DTOs.Auth;
using RollPlan.Api.Models.Entities;
using RollPlan.Api.Services;

namespace RollPlan.Api.Tests.Services;

public class AuthServiceTests
{
    private static Mock<UserManager<ApplicationUser>> CreateMockUserManager()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    private static IConfiguration CreateConfiguration(string jwtKey = "test-secret-key-at-least-32-chars!!")
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = jwtKey,
            ["Jwt:Issuer"] = "RollPlan",
            ["Jwt:Audience"] = "RollPlan",
            ["Jwt:ExpiryDays"] = "7"
        };
        return new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
    }

    [Fact]
    public async Task RegisterAsync_ValidCredentials_ReturnsAuthResponseWithToken()
    {
        // Arrange
        var userManager = CreateMockUserManager();
        userManager
            .Setup(u => u.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        var config = CreateConfiguration();
        var service = new AuthService(userManager.Object, config);
        var request = new RegisterRequest { Email = "test@example.com", Password = "password123" };

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal("test@example.com", result.Email);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsInvalidOperationException()
    {
        // Arrange
        var userManager = CreateMockUserManager();
        userManager
            .Setup(u => u.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError
            {
                Code = "DuplicateEmail",
                Description = "Email 'test@example.com' is already taken."
            }));

        var config = CreateConfiguration();
        var service = new AuthService(userManager.Object, config);
        var request = new RegisterRequest { Email = "test@example.com", Password = "password123" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.RegisterAsync(request));
        Assert.Equal("Email is already registered.", ex.Message);
    }

    [Fact]
    public async Task RegisterAsync_OtherIdentityError_ThrowsGenericMessage()
    {
        // Arrange
        var userManager = CreateMockUserManager();
        userManager
            .Setup(u => u.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError
            {
                Code = "PasswordTooShort",
                Description = "Passwords must be at least 6 characters."
            }));

        var config = CreateConfiguration();
        var service = new AuthService(userManager.Object, config);
        var request = new RegisterRequest { Email = "test@example.com", Password = "123" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.RegisterAsync(request));
        // P3 patch: non-duplicate errors return a generic message (never leaks internal Identity details)
        Assert.Equal("Registration failed. Please check your input and try again.", ex.Message);
    }

    // ─── LoginAsync Tests ───

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsAuthResponseWithToken()
    {
        // Arrange
        var userManager = CreateMockUserManager();
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "test@example.com",
            DisplayName = string.Empty
        };
        userManager
            .Setup(u => u.FindByEmailAsync("test@example.com"))
            .ReturnsAsync(user);
        userManager
            .Setup(u => u.CheckPasswordAsync(user, "password123"))
            .ReturnsAsync(true);

        var config = CreateConfiguration();
        var service = new AuthService(userManager.Object, config);
        var request = new LoginRequest { Email = "test@example.com", Password = "password123" };

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal("test@example.com", result.Email);
    }

    [Fact]
    public async Task LoginAsync_UserNotFound_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var userManager = CreateMockUserManager();
        userManager
            .Setup(u => u.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);

        var config = CreateConfiguration();
        var service = new AuthService(userManager.Object, config);
        var request = new LoginRequest { Email = "notfound@example.com", Password = "password123" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.LoginAsync(request));
        Assert.Equal("Invalid email or password.", ex.Message);
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var userManager = CreateMockUserManager();
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            UserName = "test@example.com",
            DisplayName = string.Empty
        };
        userManager
            .Setup(u => u.FindByEmailAsync("test@example.com"))
            .ReturnsAsync(user);
        userManager
            .Setup(u => u.CheckPasswordAsync(user, "wrongpassword"))
            .ReturnsAsync(false);

        var config = CreateConfiguration();
        var service = new AuthService(userManager.Object, config);
        var request = new LoginRequest { Email = "test@example.com", Password = "wrongpassword" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.LoginAsync(request));
        Assert.Equal("Invalid email or password.", ex.Message);
    }
}
