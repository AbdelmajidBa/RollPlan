using Microsoft.EntityFrameworkCore;
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
            var ext = request.CoverImage.ContentType == "image/png" ? ".png" : ".jpg";
            var safeFileName = $"{Guid.NewGuid()}{ext}";
            await using var stream = request.CoverImage.OpenReadStream();
            coverImageUrl = await _storageService.UploadFileAsync(
                stream,
                safeFileName,
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
        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch
        {
            if (coverImageUrl != null)
                await _storageService.DeleteFileAsync(coverImageUrl);
            throw;
        }

        return MapToResponse(trip);
    }

    public async Task<IEnumerable<TripResponse>> GetTripsAsync(Guid userId)
    {
        var trips = await _dbContext.Trips
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();

        return trips.Select(MapToResponse);
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
