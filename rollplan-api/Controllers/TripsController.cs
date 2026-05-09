using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RollPlan.Api.Models.DTOs.Trips;
using RollPlan.Api.Services;

namespace RollPlan.Api.Controllers;

[ApiController]
[Route("api/v1/trips")]
[Authorize]
public class TripsController : ControllerBase
{
    private readonly ITripService _tripService;

    public TripsController(ITripService tripService)
    {
        _tripService = tripService;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (idStr is null || !Guid.TryParse(idStr, out var userId))
            throw new UnauthorizedAccessException("User identity claim is invalid or missing.");
        return userId;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTrip([FromForm] CreateTripRequest request)
    {
        var userId = GetCurrentUserId();
        var response = await _tripService.CreateTripAsync(userId, request);
        return CreatedAtAction(nameof(GetTrip), new { id = response.Id }, response);
    }

    // Placeholder for future story — required for CreatedAtAction routing
    [HttpGet("{id:guid}")]
    public IActionResult GetTrip(Guid id)
    {
        return NotFound();
    }
}
