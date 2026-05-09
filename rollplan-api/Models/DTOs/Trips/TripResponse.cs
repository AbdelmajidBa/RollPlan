using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Models.DTOs.Trips;

public class TripResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TripStatus Status { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
