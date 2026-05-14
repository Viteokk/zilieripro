using Ezilier.Application.Interfaces;
using Ezilier.Domain.Entities;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Beneficiaries;

public record LinkUserToBeneficiaryCommand(Guid BeneficiaryId, string Idnp)
    : IRequest<(bool Success, ValidationResult? Errors, int StatusCode)>;

public class LinkUserToBeneficiaryCommandHandler(IDataContext context)
    : IRequestHandler<LinkUserToBeneficiaryCommand, (bool Success, ValidationResult? Errors, int StatusCode)>
{
    public async Task<(bool Success, ValidationResult? Errors, int StatusCode)> Handle(
        LinkUserToBeneficiaryCommand command, CancellationToken ct)
    {
        var beneficiary = await context.Beneficiaries
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == command.BeneficiaryId && !b.IsDeleted, ct);
        if (beneficiary is null)
            return (false, new ValidationResult([new ValidationFailure("BeneficiaryId", "Compania nu a fost găsită.")]), 404);

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Idnp == command.Idnp && !u.IsDeleted, ct);
        if (user is null)
            return (false, new ValidationResult([new ValidationFailure("Idnp", "Utilizatorul cu acest IDNP nu există.")]), 404);

        var duplicate = await context.UserIdentities
            .AnyAsync(ui => ui.UserId == user.Id && ui.BeneficiaryId == command.BeneficiaryId, ct);
        if (duplicate)
            return (false, new ValidationResult([new ValidationFailure("Idnp", "Utilizatorul este deja asociat cu această companie.")]), 409);

        var role = await context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Key == "angajator" && !r.IsDeleted, ct);
        if (role is null)
            return (false, new ValidationResult([new ValidationFailure("Role", "Rolul Angajator nu a fost găsit.")]), 500);

        var existingIdentity = await context.UserIdentities
            .AsNoTracking()
            .FirstOrDefaultAsync(ui => ui.UserId == user.Id, ct);
        var passwordHash = existingIdentity?.PasswordHash ?? string.Empty;

        var identity = new UserIdentity
        {
            UserId = user.Id,
            Status = UserStatus.Active,
            PasswordHash = passwordHash,
            RoleId = role.Id,
            BeneficiaryId = command.BeneficiaryId,
        };

        context.UserIdentities.Add(identity);
        await context.SaveChangesAsync(ct);

        return (true, null, 200);
    }
}
