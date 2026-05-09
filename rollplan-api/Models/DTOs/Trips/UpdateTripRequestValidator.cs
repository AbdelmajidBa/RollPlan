using FluentValidation;

namespace RollPlan.Api.Models.DTOs.Trips;

public class UpdateTripRequestValidator : AbstractValidator<UpdateTripRequest>
{
    private static readonly string[] AllowedTypes = ["image/jpeg", "image/png"];
    private const long MaxBytes = 10 * 1024 * 1024;

    public UpdateTripRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Trip name is required.")
            .MaximumLength(200).WithMessage("Trip name must not exceed 200 characters.");

        When(x => x.CoverImage != null, () =>
        {
            RuleFor(x => x.CoverImage!.ContentType)
                .Must(ct => AllowedTypes.Contains(ct))
                .WithMessage("Cover image must be a JPG or PNG file.");

            RuleFor(x => x.CoverImage!.Length)
                .LessThanOrEqualTo(MaxBytes)
                .WithMessage("Cover image must not exceed 10 MB.");
        });
    }
}
