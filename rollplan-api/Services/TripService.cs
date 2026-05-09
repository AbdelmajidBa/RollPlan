using RollPlan.Api.Data;
using RollPlan.Api.Models.DTOs.Trips;
using RollPlan.Api.Models.Entities;
using RollPlan.Api.Storage;

namespace RollPlan.Api.Services;

public class TripService : ITripService
{
    private readonly AppDbContext _dbContext;
    private readonly IStorageService _storageService;

    public TripService(AppDbContext dbContext, IStorageService storageService)
    {
        _dbContext = dbContext;
        _storageService = storageService;
    }

    public async Task<TripResponse> CreateTripAsync(Guid userId, CreateTripRequest request)
    {
        string? coverImageUrl = null;

        if (request.CoverImage != null)
        {
            await using var stream = request.CoverImage.OpenReadStream();
            coverImageUrl = await _storageService.UploadFileAsync(
                stream,
                request.CoverImage.FileName,
                request.CoverImage.ContentType);
        }

        var now = DateTime.UtcNow;
        var trip = new Trip
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Status = TripStatus.Planning,
            CoverImageUrl = coverImageUrl,
            CreatedAt = now,
            UpdatedAt = now,
            UserId = userId
        };

        _dbContext.Trips.Add(trip);
        await _dbContext.SaveChangesAsync();

        return MapToResponse(trip);
    }

    private static TripResponse MapToResponse(Trip trip) => new()
    {
        Id = trip.Id,
        Name = trip.Name,
        Description = trip.Description,
        Status = trip.Status,
        CoverImageUrl = trip.CoverImageUrl,
        CreatedAt = trip.CreatedAt,
        UpdatedAt = trip.UpdatedAt
    };
}
