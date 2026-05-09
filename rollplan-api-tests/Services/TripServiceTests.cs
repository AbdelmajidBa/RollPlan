using Microsoft.EntityFrameworkCore;
using Moq;
using RollPlan.Api.Data;
using RollPlan.Api.Models.DTOs.Trips;
using RollPlan.Api.Models.Entities;
using RollPlan.Api.Services;
using RollPlan.Api.Storage;

namespace RollPlan.Api.Tests.Services;

public class TripServiceTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly Mock<IStorageService> _storageMock;
    private readonly TripService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public TripServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AppDbContext(options);
        _storageMock = new Mock<IStorageService>();
        _service = new TripService(_dbContext, _storageMock.Object);
    }

    public void Dispose() => _dbContext.Dispose();

    private static Mock<Microsoft.AspNetCore.Http.IFormFile> CreateFormFileMock(
        string fileName, string contentType, long size)
    {
        var mock = new Mock<Microsoft.AspNetCore.Http.IFormFile>();
        mock.Setup(f => f.FileName).Returns(fileName);
        mock.Setup(f => f.ContentType).Returns(contentType);
        mock.Setup(f => f.Length).Returns(size);
        // Factory delegate: each OpenReadStream() call returns a fresh stream;
        // TripService disposes it via `await using`.
        mock.Setup(f => f.OpenReadStream()).Returns(() => new MemoryStream(Array.Empty<byte>()));
        return mock;
    }

    [Fact]
    public async Task CreateTripAsync_ValidRequest_CreatesTripAndReturnsResponse()
    {
        var request = new CreateTripRequest { Name = "My Trip", Description = "A great trip" };

        var result = await _service.CreateTripAsync(_userId, request);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("My Trip", result.Name);
        Assert.Equal("A great trip", result.Description);
        Assert.Equal(TripStatus.Planning, result.Status);
        Assert.Null(result.CoverImageUrl);

        var saved = await _dbContext.Trips.FindAsync(result.Id);
        Assert.NotNull(saved);
        Assert.Equal(_userId, saved.UserId);
    }

    [Fact]
    public async Task CreateTripAsync_WithCoverImage_UploadsImageAndSetsUrl()
    {
        const string expectedUrl = "http://localhost/uploads/cover.jpg";
        _storageMock
            .Setup(s => s.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(expectedUrl);

        var fileMock = CreateFormFileMock("cover.jpg", "image/jpeg", 1024);
        var request = new CreateTripRequest { Name = "Photo Trip", CoverImage = fileMock.Object };

        var result = await _service.CreateTripAsync(_userId, request);

        Assert.Equal(expectedUrl, result.CoverImageUrl);
        _storageMock.Verify(
            s => s.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), "image/jpeg"),
            Times.Once);
    }

    [Fact]
    public async Task CreateTripAsync_NoCoverImage_DoesNotCallStorageService()
    {
        var request = new CreateTripRequest { Name = "Simple Trip" };

        await _service.CreateTripAsync(_userId, request);

        _storageMock.Verify(
            s => s.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateTripAsync_DefaultStatus_IsPlanningAndTimestampsSet()
    {
        var before = DateTime.UtcNow;
        var request = new CreateTripRequest { Name = "Status Check Trip" };

        var result = await _service.CreateTripAsync(_userId, request);

        Assert.Equal(TripStatus.Planning, result.Status);
        Assert.True(result.CreatedAt >= before);
        Assert.True(result.UpdatedAt >= before);
        Assert.Equal(result.CreatedAt, result.UpdatedAt);
    }

    [Fact]
    public async Task GetTripsAsync_ReturnsOnlyUserTrips()
    {
        var otherUserId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        _dbContext.Trips.Add(new Trip { Id = Guid.NewGuid(), Name = "My Trip", UserId = _userId, Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        _dbContext.Trips.Add(new Trip { Id = Guid.NewGuid(), Name = "Other Trip", UserId = otherUserId, Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var result = (await _service.GetTripsAsync(_userId)).ToList();

        Assert.Single(result);
        Assert.Equal("My Trip", result[0].Name);
    }

    [Fact]
    public async Task GetTripsAsync_OrdersByUpdatedAtDescending()
    {
        var base_ = DateTime.UtcNow;

        _dbContext.Trips.Add(new Trip { Id = Guid.NewGuid(), Name = "First", UserId = _userId, Status = TripStatus.Planning, CreatedAt = base_, UpdatedAt = base_.AddHours(-2) });
        _dbContext.Trips.Add(new Trip { Id = Guid.NewGuid(), Name = "Second", UserId = _userId, Status = TripStatus.Planning, CreatedAt = base_, UpdatedAt = base_ });
        _dbContext.Trips.Add(new Trip { Id = Guid.NewGuid(), Name = "Third", UserId = _userId, Status = TripStatus.Planning, CreatedAt = base_, UpdatedAt = base_.AddHours(-1) });
        await _dbContext.SaveChangesAsync();

        var result = (await _service.GetTripsAsync(_userId)).ToList();

        Assert.Equal(3, result.Count);
        Assert.Equal("Second", result[0].Name);
        Assert.Equal("Third", result[1].Name);
        Assert.Equal("First", result[2].Name);
    }

    [Fact]
    public async Task GetTripsAsync_NoTrips_ReturnsEmpty()
    {
        var result = await _service.GetTripsAsync(_userId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetTripAsync_ReturnsTrip_WhenOwned()
    {
        var now = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "My Trip", UserId = _userId, Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var result = await _service.GetTripAsync(_userId, tripId);

        Assert.NotNull(result);
        Assert.Equal(tripId, result.Id);
        Assert.Equal("My Trip", result.Name);
    }

    [Fact]
    public async Task GetTripAsync_ReturnsNull_WhenOwnedByOtherUser()
    {
        var now = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "Other Trip", UserId = Guid.NewGuid(), Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var result = await _service.GetTripAsync(_userId, tripId);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetTripAsync_ReturnsNull_WhenNotFound()
    {
        var result = await _service.GetTripAsync(_userId, Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateTripAsync_UpdatesFieldsAndReturnsResponse()
    {
        var now = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "Old Name", Description = "Old Desc", UserId = _userId, Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var request = new UpdateTripRequest { Name = "New Name", Description = "New Desc" };
        var result = await _service.UpdateTripAsync(_userId, tripId, request);

        Assert.NotNull(result);
        Assert.Equal("New Name", result.Name);
        Assert.Equal("New Desc", result.Description);
    }

    [Fact]
    public async Task UpdateTripAsync_UpdatesTimestamp()
    {
        var before = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "Trip", UserId = _userId, Status = TripStatus.Planning, CreatedAt = before.AddHours(-1), UpdatedAt = before.AddHours(-1) });
        await _dbContext.SaveChangesAsync();

        var request = new UpdateTripRequest { Name = "Updated" };
        var result = await _service.UpdateTripAsync(_userId, tripId, request);

        Assert.NotNull(result);
        Assert.True(result.UpdatedAt >= before);
    }

    [Fact]
    public async Task UpdateTripAsync_ReturnsNull_WhenNotOwned()
    {
        var now = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "Other Trip", UserId = Guid.NewGuid(), Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var request = new UpdateTripRequest { Name = "Hacked" };
        var result = await _service.UpdateTripAsync(_userId, tripId, request);

        Assert.Null(result);
        var unchanged = await _dbContext.Trips.FindAsync(tripId);
        Assert.Equal("Other Trip", unchanged!.Name);
    }

    [Fact]
    public async Task SetTripStatusAsync_UpdatesStatus_WhenOwned()
    {
        var now = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "My Trip", UserId = _userId, Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var result = await _service.SetTripStatusAsync(_userId, tripId, TripStatus.Active);

        Assert.NotNull(result);
        Assert.Equal(TripStatus.Active, result.Status);
        var saved = await _dbContext.Trips.FindAsync(tripId);
        Assert.Equal(TripStatus.Active, saved!.Status);
    }

    [Fact]
    public async Task SetTripStatusAsync_ReturnsNull_WhenNotOwned()
    {
        var now = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "Other Trip", UserId = Guid.NewGuid(), Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var result = await _service.SetTripStatusAsync(_userId, tripId, TripStatus.Active);

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteTripAsync_DeletesTrip_WhenOwned()
    {
        var now = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "My Trip", UserId = _userId, Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var result = await _service.DeleteTripAsync(_userId, tripId);

        Assert.True(result);
        var deleted = await _dbContext.Trips.FindAsync(tripId);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task DeleteTripAsync_ReturnsFalse_WhenNotOwned()
    {
        var now = DateTime.UtcNow;
        var tripId = Guid.NewGuid();
        _dbContext.Trips.Add(new Trip { Id = tripId, Name = "Other Trip", UserId = Guid.NewGuid(), Status = TripStatus.Planning, CreatedAt = now, UpdatedAt = now });
        await _dbContext.SaveChangesAsync();

        var result = await _service.DeleteTripAsync(_userId, tripId);

        Assert.False(result);
        var unchanged = await _dbContext.Trips.FindAsync(tripId);
        Assert.NotNull(unchanged);
    }
}
