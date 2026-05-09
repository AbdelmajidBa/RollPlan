using RollPlan.Api.Models.DTOs.Trips;

namespace RollPlan.Api.Services;

public interface ITripService
{
    Task<TripResponse> CreateTripAsync(Guid userId, CreateTripRequest request);
    Task<IEnumerable<TripResponse>> GetTripsAsync(Guid userId);
}
