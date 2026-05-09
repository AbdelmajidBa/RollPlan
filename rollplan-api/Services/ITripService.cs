using RollPlan.Api.Models.DTOs.Trips;
using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Services;

public interface ITripService
{
    Task<TripResponse> CreateTripAsync(Guid userId, CreateTripRequest request);
    Task<IEnumerable<TripResponse>> GetTripsAsync(Guid userId);
    Task<TripResponse?> GetTripAsync(Guid userId, Guid tripId);
    Task<TripResponse?> UpdateTripAsync(Guid userId, Guid tripId, UpdateTripRequest request);
    Task<TripResponse?> SetTripStatusAsync(Guid userId, Guid tripId, TripStatus status);
}
