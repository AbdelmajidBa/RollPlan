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
    }
}
