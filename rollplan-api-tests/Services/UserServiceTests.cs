using Microsoft.AspNetCore.Identity;
using Moq;
using RollPlan.Api.Models.DTOs.Users;
using RollPlan.Api.Models.Entities;
using RollPlan.Api.Services;

namespace RollPlan.Api.Tests.Services;

public class UserServiceTests
{
    private static Mock<UserManager<ApplicationUser>> CreateMockUserManager()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    private static ApplicationUser MakeUser(Guid? id = null, string email = "user@example.com", string displayName = "Alice")
    {
        return new ApplicationUser
        {
            Id = id ?? Guid.NewGuid(),
            Email = email,
            UserName = email,
            DisplayName = displayName
        };
    }

    // ─── GetProfileAsync Tests ───

    [Fact]
    public async Task GetProfileAsync_ValidUser_ReturnsProfileResponse()
    {
        var user = MakeUser();
        var userManager = CreateMockUserManager();
        userManager.Setup(m => m.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);

        var service = new UserService(userManager.Object);
        var result = await service.GetProfileAsync(user.Id);

        Assert.NotNull(result);
        Assert.Equal(user.Email, result.Email);
        Assert.Equal(user.DisplayName, result.DisplayName);
    }

    [Fact]
    public async Task GetProfileAsync_UserNotFound_ThrowsInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var userManager = CreateMockUserManager();
        userManager.Setup(m => m.FindByIdAsync(userId.ToString())).ReturnsAsync((ApplicationUser?)null);

        var service = new UserService(userManager.Object);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.GetProfileAsync(userId));
        Assert.Equal("User not found.", ex.Message);
    }

    // ─── UpdateProfileAsync Tests ───

    [Fact]
    public async Task UpdateProfileAsync_DisplayNameChange_UpdatesAndReturnsProfile()
    {
        var user = MakeUser(displayName: "OldName");
        var userManager = CreateMockUserManager();
        userManager.Setup(m => m.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        userManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>())).ReturnsAsync(IdentityResult.Success);

        var service = new UserService(userManager.Object);
        var request = new UpdateProfileRequest { DisplayName = "NewName", Email = user.Email! };

        var result = await service.UpdateProfileAsync(user.Id, request);

        Assert.Equal("NewName", result.DisplayName);
        Assert.Equal(user.Email, result.Email);
        userManager.Verify(m => m.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Once);
        userManager.Verify(m => m.SetEmailAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdateProfileAsync_EmailChange_UpdatesEmailAndUsername()
    {
        var user = MakeUser(email: "old@example.com");
        var userManager = CreateMockUserManager();
        userManager.Setup(m => m.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        userManager.Setup(m => m.SetEmailAsync(user, "new@example.com")).ReturnsAsync(IdentityResult.Success);
        userManager.Setup(m => m.SetUserNameAsync(user, "new@example.com")).ReturnsAsync(IdentityResult.Success);

        var service = new UserService(userManager.Object);
        var request = new UpdateProfileRequest { DisplayName = user.DisplayName, Email = "new@example.com" };

        await service.UpdateProfileAsync(user.Id, request);

        userManager.Verify(m => m.SetEmailAsync(user, "new@example.com"), Times.Once);
        userManager.Verify(m => m.SetUserNameAsync(user, "new@example.com"), Times.Once);
        userManager.Verify(m => m.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Never);
        // FindByEmailAsync should NOT be called — uniqueness enforced by SetEmailAsync result
        userManager.Verify(m => m.FindByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdateProfileAsync_DuplicateEmail_ThrowsInvalidOperationException()
    {
        var user = MakeUser(email: "user@example.com");
        var userManager = CreateMockUserManager();
        userManager.Setup(m => m.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        // SetEmailAsync returns DuplicateEmail error — no manual pre-check needed
        userManager.Setup(m => m.SetEmailAsync(user, "taken@example.com"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError
            {
                Code = "DuplicateEmail",
                Description = "Email 'taken@example.com' is already taken."
            }));

        var service = new UserService(userManager.Object);
        var request = new UpdateProfileRequest { DisplayName = user.DisplayName, Email = "taken@example.com" };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.UpdateProfileAsync(user.Id, request));
        Assert.Equal("Email is already in use.", ex.Message);
    }

    [Fact]
    public async Task UpdateProfileAsync_SameEmail_SkipsEmailUpdate()
    {
        var user = MakeUser(email: "user@example.com");
        var userManager = CreateMockUserManager();
        userManager.Setup(m => m.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        userManager.Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>())).ReturnsAsync(IdentityResult.Success);

        var service = new UserService(userManager.Object);
        var request = new UpdateProfileRequest { DisplayName = "New Name", Email = "user@example.com" };

        await service.UpdateProfileAsync(user.Id, request);

        // Neither SetEmailAsync nor FindByEmailAsync should be called when email is unchanged
        userManager.Verify(m => m.SetEmailAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
        userManager.Verify(m => m.FindByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdateProfileAsync_UserNotFound_ThrowsInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var userManager = CreateMockUserManager();
        userManager.Setup(m => m.FindByIdAsync(userId.ToString())).ReturnsAsync((ApplicationUser?)null);

        var service = new UserService(userManager.Object);
        var request = new UpdateProfileRequest { DisplayName = "Name", Email = "x@example.com" };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.UpdateProfileAsync(userId, request));
        Assert.Equal("User not found.", ex.Message);
    }
}
