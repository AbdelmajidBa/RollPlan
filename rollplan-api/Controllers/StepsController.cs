using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RollPlan.Api.Models.DTOs.Steps;
using RollPlan.Api.Services;

namespace RollPlan.Api.Controllers;

[ApiController]
[Route("api/v1/trips/{tripId:guid}/steps")]
[Authorize]
public class StepsController : ControllerBase
{
    private readonly IStepService _stepService;

    public StepsController(IStepService stepService)
    {
        _stepService = stepService;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (idStr is null || !Guid.TryParse(idStr, out var userId))
            throw new UnauthorizedAccessException("User identity claim is invalid or missing.");
        return userId;
    }

    [HttpGet]
    public async Task<IActionResult> GetSteps(Guid tripId)
    {
        var userId = GetCurrentUserId();
        var steps = await _stepService.GetStepsAsync(userId, tripId);
        return steps is null ? NotFound() : Ok(steps);
    }

    [HttpPost]
    public async Task<IActionResult> AddStep(Guid tripId, [FromBody] CreateStepRequest request)
    {
        var userId = GetCurrentUserId();
        var step = await _stepService.AddStepAsync(userId, tripId, request);
        return step is null ? NotFound() : StatusCode(201, step);
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> ReorderSteps(Guid tripId, [FromBody] ReorderStepsRequest request)
    {
        var userId = GetCurrentUserId();
        var steps = await _stepService.ReorderStepsAsync(userId, tripId, request);
        return steps is null ? NotFound() : Ok(steps);
    }

    [HttpPut("{stepId:guid}")]
    public async Task<IActionResult> UpdateStep(Guid tripId, Guid stepId, [FromBody] UpdateStepRequest request)
    {
        var userId = GetCurrentUserId();
        var step = await _stepService.UpdateStepAsync(userId, tripId, stepId, request);
        return step is null ? NotFound() : Ok(step);
    }

    [HttpDelete("{stepId:guid}")]
    public async Task<IActionResult> DeleteStep(Guid tripId, Guid stepId)
    {
        var userId = GetCurrentUserId();
        var deleted = await _stepService.DeleteStepAsync(userId, tripId, stepId);
        return deleted ? NoContent() : NotFound();
    }
}
