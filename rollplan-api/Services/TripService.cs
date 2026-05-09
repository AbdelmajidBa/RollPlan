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

    public async Task<TripResponse?> GetTripAsync(Guid userId, Guid tripId)
    {
        var trip = await _dbContext.Trips
            .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

        return trip is null ? null : MapToResponse(trip);
    }

    public async Task<TripResponse?> UpdateTripAsync(Guid userId, Guid tripId, UpdateTripRequest request)
    {
        var trip = await _dbContext.Trips
            .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

        if (trip is null) return null;

        string? newCoverImageUrl = null;
        if (request.CoverImage != null)
        {
            var ext = request.CoverImage.ContentType == "image/png" ? ".png" : ".jpg";
            var safeFileName = $"{Guid.NewGuid()}{ext}";
            await using var stream = request.CoverImage.OpenReadStream();
            newCoverImageUrl = await _storageService.UploadFileAsync(stream, safeFileName, request.CoverImage.ContentType);
        }

        var oldCoverImageUrl = trip.CoverImageUrl;
        trip.Name = request.Name;
        trip.Description = request.Description;
        trip.StartDate = request.StartDate;
        trip.EndDate = request.EndDate;
        if (newCoverImageUrl != null)
            trip.CoverImageUrl = newCoverImageUrl;
        trip.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch
        {
            if (newCoverImageUrl != null)
                await _storageService.DeleteFileAsync(newCoverImageUrl);
            throw;
        }

        if (newCoverImageUrl != null && oldCoverImageUrl != null)
            await _storageService.DeleteFileAsync(oldCoverImageUrl);

        return MapToResponse(trip);
    }

    public async Task<TripResponse?> SetTripStatusAsync(Guid userId, Guid tripId, TripStatus status)
    {
        var trip = await _dbContext.Trips
            .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

        if (trip is null) return null;

        trip.Status = status;
        trip.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return MapToResponse(trip);
    }

    public async Task<bool> DeleteTripAsync(Guid userId, Guid tripId)
    {
        var trip = await _dbContext.Trips
            .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

        if (trip is null) return false;

        var coverImageUrl = trip.CoverImageUrl;
        _dbContext.Trips.Remove(trip);
        await _dbContext.SaveChangesAsync();

        if (coverImageUrl != null)
            await _storageService.DeleteFileAsync(coverImageUrl);

        return true;
    }

    private static TripResponse MapToResponse(Trip trip) => new()
    {
        Id = trip.Id,
        Name = trip.Name,
        Description = trip.Description,
        Status = trip.Status,
        CoverImageUrl = trip.CoverImageUrl,
        StartDate = trip.StartDate,
        EndDate = trip.EndDate,
        CreatedAt = trip.CreatedAt,
        UpdatedAt = trip.UpdatedAt
    };
}
