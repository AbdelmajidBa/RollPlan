using Microsoft.EntityFrameworkCore;
using RollPlan.Api.Data;
using RollPlan.Api.Models.DTOs.Steps;
using RollPlan.Api.Models.Entities;
using RollPlan.Api.Services;

namespace RollPlan.Api.Tests.Services;

public class StepServiceTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly StepService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public StepServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AppDbContext(options);
        _service = new StepService(_dbContext);
    }

    public void Dispose() => _dbContext.Dispose();

    private Trip SeedTrip(Guid? userId = null)
    {
        var now = DateTime.UtcNow;
        var trip = new Trip
        {
            Id = Guid.NewGuid(),
            Name = "Test Trip",
            UserId = userId ?? _userId,
            Status = TripStatus.Planning,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.Trips.Add(trip);
        _dbContext.SaveChanges();
        return trip;
    }

    private Step SeedStep(Guid tripId, int sortOrder)
    {
        var now = DateTime.UtcNow;
        var step = new Step
        {
            Id = Guid.NewGuid(),
            TripId = tripId,
            Name = $"Step {sortOrder}",
            Type = StepType.Activity,
            SortOrder = sortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.Steps.Add(step);
        _dbContext.SaveChanges();
        return step;
    }

    [Fact]
    public async Task GetStepsAsync_ReturnsSteps_WhenOwned()
    {
        var trip = SeedTrip();
        SeedStep(trip.Id, 2);
        SeedStep(trip.Id, 1);

        var result = (await _service.GetStepsAsync(_userId, trip.Id))!.ToList();

        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal(1, result[0].SortOrder);
        Assert.Equal(2, result[1].SortOrder);
    }

    [Fact]
    public async Task GetStepsAsync_ReturnsNull_WhenTripNotOwned()
    {
        var trip = SeedTrip(Guid.NewGuid());

        var result = await _service.GetStepsAsync(_userId, trip.Id);

        Assert.Null(result);
    }

    [Fact]
    public async Task AddStepAsync_CreatesStep_WhenOwned()
    {
        var trip = SeedTrip();
        var request = new CreateStepRequest
        {
            Name = "Ferry Crossing",
            Type = StepType.Travel,
            Location = "Portsmouth",
            Date = new DateOnly(2026, 7, 1),
            StartTime = "08:30"
        };

        var result = await _service.AddStepAsync(_userId, trip.Id, request);

        Assert.NotNull(result);
        Assert.Equal("Ferry Crossing", result.Name);
        Assert.Equal(StepType.Travel, result.Type);
        Assert.Equal("Portsmouth", result.Location);
        Assert.Equal(new DateOnly(2026, 7, 1), result.Date);
        Assert.Equal("08:30", result.StartTime);
        Assert.Equal(1, result.SortOrder);

        var saved = await _dbContext.Steps.FindAsync(result.Id);
        Assert.NotNull(saved);
        Assert.Equal(trip.Id, saved.TripId);
    }

    [Fact]
    public async Task AddStepAsync_ReturnsNull_WhenTripNotOwned()
    {
        var trip = SeedTrip(Guid.NewGuid());
        var request = new CreateStepRequest { Name = "Hacked", Type = StepType.Activity };

        var result = await _service.AddStepAsync(_userId, trip.Id, request);

        Assert.Null(result);
        Assert.Empty(await _dbContext.Steps.ToListAsync());
    }

    [Fact]
    public async Task AddStepAsync_SetsCorrectSortOrder()
    {
        var trip = SeedTrip();
        SeedStep(trip.Id, 1);
        SeedStep(trip.Id, 2);

        var request = new CreateStepRequest { Name = "Third Step", Type = StepType.Meal };
        var result = await _service.AddStepAsync(_userId, trip.Id, request);

        Assert.NotNull(result);
        Assert.Equal(3, result.SortOrder);
    }

    [Fact]
    public async Task AddStepAsync_StoresCoordinates_WhenProvided()
    {
        var trip = SeedTrip();
        var request = new CreateStepRequest
        {
            Name = "Eiffel Tower",
            Type = StepType.Activity,
            Location = "Paris, France",
            Latitude = 48.8566,
            Longitude = 2.3522
        };

        var result = await _service.AddStepAsync(_userId, trip.Id, request);

        Assert.NotNull(result);
        Assert.Equal(48.8566, result.Latitude);
        Assert.Equal(2.3522, result.Longitude);

        var saved = await _dbContext.Steps.FindAsync(result.Id);
        Assert.NotNull(saved);
        Assert.Equal(48.8566, saved.Latitude);
        Assert.Equal(2.3522, saved.Longitude);
    }

    [Fact]
    public async Task AddStepAsync_StoresNullCoordinates_WhenNotProvided()
    {
        var trip = SeedTrip();
        var request = new CreateStepRequest
        {
            Name = "Somewhere",
            Type = StepType.Activity,
            Location = "Unknown Place"
        };

        var result = await _service.AddStepAsync(_userId, trip.Id, request);

        Assert.NotNull(result);
        Assert.Null(result.Latitude);
        Assert.Null(result.Longitude);

        var saved = await _dbContext.Steps.FirstOrDefaultAsync(s => s.Id == result.Id);
        Assert.NotNull(saved);
        Assert.Null(saved.Latitude);
        Assert.Null(saved.Longitude);
    }

    [Fact]
    public async Task UpdateStepAsync_UpdatesStep_WhenOwned()
    {
        var trip = SeedTrip();
        var step = SeedStep(trip.Id, 1);
        var request = new UpdateStepRequest
        {
            Name = "Updated Ferry",
            Type = StepType.Travel,
            Location = "Dover",
            Latitude = 51.1295,
            Longitude = 1.3089,
            Date = new DateOnly(2026, 8, 1),
            StartTime = "09:00"
        };

        var result = await _service.UpdateStepAsync(_userId, trip.Id, step.Id, request);

        Assert.NotNull(result);
        Assert.Equal("Updated Ferry", result.Name);
        Assert.Equal(StepType.Travel, result.Type);
        Assert.Equal("Dover", result.Location);
        Assert.Equal(51.1295, result.Latitude);
        Assert.Equal(1.3089, result.Longitude);
        Assert.Equal(new DateOnly(2026, 8, 1), result.Date);
        Assert.Equal("09:00", result.StartTime);
        Assert.Equal(step.SortOrder, result.SortOrder);

        var saved = await _dbContext.Steps.FindAsync(step.Id);
        Assert.NotNull(saved);
        Assert.Equal("Updated Ferry", saved.Name);
        Assert.Equal("Dover", saved.Location);
    }

    [Fact]
    public async Task UpdateStepAsync_ReturnsNull_WhenTripNotOwned()
    {
        var trip = SeedTrip(Guid.NewGuid());
        var step = SeedStep(trip.Id, 1);
        var request = new UpdateStepRequest { Name = "Hacked", Type = StepType.Activity };

        var result = await _service.UpdateStepAsync(_userId, trip.Id, step.Id, request);

        Assert.Null(result);
        var unchanged = await _dbContext.Steps.FindAsync(step.Id);
        Assert.NotNull(unchanged);
        Assert.Equal(step.Name, unchanged.Name);
    }

    [Fact]
    public async Task UpdateStepAsync_ReturnsNull_WhenStepNotFound()
    {
        var trip = SeedTrip();
        var request = new UpdateStepRequest { Name = "Ghost", Type = StepType.Activity };

        var result = await _service.UpdateStepAsync(_userId, trip.Id, Guid.NewGuid(), request);

        Assert.Null(result);
    }
}
