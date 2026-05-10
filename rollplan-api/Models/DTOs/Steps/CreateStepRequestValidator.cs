using FluentValidation;
using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Models.DTOs.Steps;

public class CreateStepRequestValidator : AbstractValidator<CreateStepRequest>
{
    public CreateStepRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Step name is required.")
            .MaximumLength(200).WithMessage("Step name must not exceed 200 characters.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Step type must be one of: Travel, Accommodation, Activity, Meal, Rest.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90.0, 90.0).When(x => x.Latitude.HasValue)
            .WithMessage("Latitude must be between -90 and 90.")
            .Must((req, _) => req.Longitude.HasValue).When(x => x.Latitude.HasValue)
            .WithMessage("Longitude is required when Latitude is provided.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180.0, 180.0).When(x => x.Longitude.HasValue)
            .WithMessage("Longitude must be between -180 and 180.")
            .Must((req, _) => req.Latitude.HasValue).When(x => x.Longitude.HasValue)
            .WithMessage("Latitude is required when Longitude is provided.");
    }
}
