using RollPlan.Api.Models.DTOs.Steps;

namespace RollPlan.Api.Services;

public interface IStepService
{
    Task<IEnumerable<StepResponse>?> GetStepsAsync(Guid userId, Guid tripId);
    Task<StepResponse?> AddStepAsync(Guid userId, Guid tripId, CreateStepRequest request);
}
