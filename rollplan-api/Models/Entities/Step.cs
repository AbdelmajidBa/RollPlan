namespace RollPlan.Api.Models.Entities;

public class Step
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public StepType Type { get; set; }
    public string? Location { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateOnly? Date { get; set; }
    public string? StartTime { get; set; }
    public int SortOrder { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid TripId { get; set; }
    public Trip Trip { get; set; } = null!;
}
