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

    [HttpGet]
    public async Task<IActionResult> GetTrips()
    {
        var userId = GetCurrentUserId();
        var trips = await _tripService.GetTripsAsync(userId);
        return Ok(trips);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTrip(Guid id)
    {
        var userId = GetCurrentUserId();
        var trip = await _tripService.GetTripAsync(userId, id);
        return trip is null ? NotFound() : Ok(trip);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTrip(Guid id, [FromForm] UpdateTripRequest request)
    {
        var userId = GetCurrentUserId();
        var trip = await _tripService.UpdateTripAsync(userId, id, request);
        return trip is null ? NotFound() : Ok(trip);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetTripStatus(Guid id, [FromBody] SetTripStatusRequest request)
    {
        var userId = GetCurrentUserId();
        var trip = await _tripService.SetTripStatusAsync(userId, id, request.Status);
        return trip is null ? NotFound() : Ok(trip);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTrip(Guid id)
    {
        var userId = GetCurrentUserId();
        var deleted = await _tripService.DeleteTripAsync(userId, id);
        return deleted ? NoContent() : NotFound();
    }
}
