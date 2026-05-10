using Microsoft.EntityFrameworkCore;
using RollPlan.Api.Data;
using RollPlan.Api.Models.DTOs.Steps;
using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Services;

public class StepService : IStepService
{
    private readonly AppDbContext _dbContext;

    public StepService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<StepResponse>?> GetStepsAsync(Guid userId, Guid tripId)
    {
        var trip = await _dbContext.Trips
            .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

        if (trip is null) return null;

        var steps = await _dbContext.Steps
            .Where(s => s.TripId == tripId)
            .OrderBy(s => s.SortOrder)
            .ToListAsync();

        return steps.Select(MapToResponse);
    }

    public async Task<StepResponse?> AddStepAsync(Guid userId, Guid tripId, CreateStepRequest request)
    {
        var trip = await _dbContext.Trips
            .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

        if (trip is null) return null;

        var maxOrder = await _dbContext.Steps
            .Where(s => s.TripId == tripId)
            .MaxAsync(s => (int?)s.SortOrder) ?? 0;

        var now = DateTime.UtcNow;
        var step = new Step
        {
            Id = Guid.NewGuid(),
            TripId = tripId,
            Name = request.Name,
            Type = request.Type,
            Location = request.Location,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Date = request.Date,
            StartTime = request.StartTime,
            SortOrder = maxOrder + 1,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Steps.Add(step);
        await _dbContext.SaveChangesAsync();

        return MapToResponse(step);
    }

    private static StepResponse MapToResponse(Step step) => new()
    {
        Id = step.Id,
        TripId = step.TripId,
        Name = step.Name,
        Type = step.Type,
        Location = step.Location,
        Latitude = step.Latitude,
        Longitude = step.Longitude,
        Date = step.Date,
        StartTime = step.StartTime,
        SortOrder = step.SortOrder,
        Note = step.Note,
        CreatedAt = step.CreatedAt,
        UpdatedAt = step.UpdatedAt
    };
}
