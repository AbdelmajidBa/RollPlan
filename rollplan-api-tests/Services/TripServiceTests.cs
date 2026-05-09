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
            s => s.UploadFileAsync(It.IsAny<Stream>(), "cover.jpg", "image/jpeg"),
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
}
