using FluentValidation;

namespace RollPlan.Api.Models.DTOs.Trips;

public class SetTripStatusRequestValidator : AbstractValidator<SetTripStatusRequest>
{
    public SetTripStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Status must be one of: Planning, Active, Completed, Archived.");
    }
}
