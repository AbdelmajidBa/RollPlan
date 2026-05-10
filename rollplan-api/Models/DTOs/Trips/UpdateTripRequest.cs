using Microsoft.AspNetCore.Http;

namespace RollPlan.Api.Models.DTOs.Trips;

public class UpdateTripRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IFormFile? CoverImage { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
