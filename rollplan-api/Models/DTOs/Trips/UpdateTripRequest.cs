using Microsoft.AspNetCore.Http;

namespace RollPlan.Api.Models.DTOs.Trips;

public class UpdateTripRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IFormFile? CoverImage { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
