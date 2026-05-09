using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Models.DTOs.Steps;

public class StepResponse
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public string Name { get; set; } = string.Empty;
    public StepType Type { get; set; }
    public string? Location { get; set; }
    public DateOnly? Date { get; set; }
    public string? StartTime { get; set; }
    public int SortOrder { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
