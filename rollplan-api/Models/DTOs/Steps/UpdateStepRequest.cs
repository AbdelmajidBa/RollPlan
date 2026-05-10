using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Models.DTOs.Steps;

public class UpdateStepRequest
{
    public string Name { get; set; } = string.Empty;
    public StepType Type { get; set; }
    public string? Location { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateOnly? Date { get; set; }
    public string? StartTime { get; set; }
}
