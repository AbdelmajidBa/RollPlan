using RollPlan.Api.Models.DTOs.Steps;

namespace RollPlan.Api.Services;

public interface IStepService
{
    Task<IEnumerable<StepResponse>?> GetStepsAsync(Guid userId, Guid tripId);
    Task<StepResponse?> AddStepAsync(Guid userId, Guid tripId, CreateStepRequest request);
    Task<StepResponse?> UpdateStepAsync(Guid userId, Guid tripId, Guid stepId, UpdateStepRequest request);
    Task<bool> DeleteStepAsync(Guid userId, Guid tripId, Guid stepId);
}
