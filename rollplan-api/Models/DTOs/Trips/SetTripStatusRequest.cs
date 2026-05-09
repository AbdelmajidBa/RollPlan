using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Models.DTOs.Trips;

public class SetTripStatusRequest
{
    public TripStatus Status { get; set; }
}
