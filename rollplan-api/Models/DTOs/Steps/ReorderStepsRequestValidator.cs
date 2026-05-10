using FluentValidation;

namespace RollPlan.Api.Models.DTOs.Steps;

public class ReorderStepsRequestValidator : AbstractValidator<ReorderStepsRequest>
{
    public ReorderStepsRequestValidator()
    {
        RuleFor(x => x.StepIds)
            .NotEmpty().WithMessage("StepIds must contain at least one step.");
    }
}
