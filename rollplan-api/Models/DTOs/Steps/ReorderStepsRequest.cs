namespace RollPlan.Api.Models.DTOs.Steps;

public class ReorderStepsRequest
{
    public List<Guid> StepIds { get; set; } = new();
}
