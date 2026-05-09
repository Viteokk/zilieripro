using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Application.Services;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Auth;

public record SwitchCompanyCommand(Guid UserId, Guid BeneficiaryId)
    : IRequest<(LoginResponse? Model, ValidationResult? Errors, int Status)>;

public class SwitchCompanyCommandHandler(IDataContext context, ITokenService tokenService)
    : IRequestHandler<SwitchCompanyCommand, (LoginResponse? Model, ValidationResult? Errors, int Status)>
{
    public async Task<(LoginResponse? Model, ValidationResult? Errors, int Status)> Handle(
        SwitchCompanyCommand command, CancellationToken ct)
    {
        var user = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == command.UserId, ct);

        if (user is null)
            return (null, new ValidationResult([new ValidationFailure("User", "Utilizatorul nu a fost gasit.")]), 404);

        // Load all identities to validate access and build available companies
        var identities = await context.UserIdentities
            .Include(ui => ui.Role)
                .ThenInclude(r => r.Permissions)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .Include(ui => ui.Beneficiary)
            .Where(ui => ui.UserId == command.UserId && ui.Status == UserStatus.Active)
            .ToListAsync(ct);

        var target = identities.FirstOrDefault(ui => ui.BeneficiaryId == command.BeneficiaryId);
        if (target is null)
            return (null, new ValidationResult([new ValidationFailure("BeneficiaryId", "Nu aveti acces la aceasta companie.")]), 403);

        var permissions = target.Role.Permissions
            .Select(p => p.Key)
            .Union(target.Permissions.Select(up => up.Permission.Key))
            .Distinct()
            .ToList();

        var accessToken = tokenService.GenerateAccessToken(
            user.Id, user.Idnp, target.Role.Key, permissions, target.BeneficiaryId);

        var refreshToken = tokenService.GenerateRefreshToken();

        var trackedIdentity = await context.UserIdentities.FirstAsync(ui => ui.Id == target.Id, ct);
        trackedIdentity.RefreshToken = refreshToken;
        trackedIdentity.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(7);
        await context.SaveChangesAsync(ct);

        var userInfo = new UserInfoModel(
            Id: user.Id,
            Idnp: user.Idnp,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Email: user.Email,
            Role: target.Role.Key,
            RoleType: target.Role.Type.ToString(),
            BeneficiaryId: target.BeneficiaryId,
            BeneficiaryName: target.Beneficiary?.CompanyName,
            Permissions: permissions
        );

        var availableCompanies = identities
            .Where(ui => ui.BeneficiaryId.HasValue && ui.Beneficiary is not null)
            .Select(ui => new CompanyInfo(ui.BeneficiaryId!.Value, ui.Beneficiary!.CompanyName, ui.Beneficiary.Idno))
            .ToList();

        return (new LoginResponse(
            Token: accessToken,
            RefreshToken: refreshToken,
            ExpiresAt: DateTimeOffset.UtcNow.AddHours(1),
            User: userInfo,
            AvailableCompanies: availableCompanies
        ), null, 200);
    }
}
