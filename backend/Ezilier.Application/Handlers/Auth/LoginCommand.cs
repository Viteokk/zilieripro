using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Application.Services;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Auth;

public sealed class LoginCommand : IRequest<(LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public LoginRequest Request { get; set; } = null!;
}

public sealed class LoginCommandHandler
    : IRequestHandler<LoginCommand, (LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    private readonly IDataContext _context;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(IDataContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<(LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        LoginCommand command, CancellationToken ct)
    {
        var request = command.Request;

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Idnp == request.Idnp, ct);

        if (user is null)
            return (null, new ValidationResult([new ValidationFailure("Credentials", "IDNP sau parola incorectă.")]), 401);

        // Load ALL identities for this user (multi-company support)
        var identities = await _context.UserIdentities
            .Include(ui => ui.Role)
                .ThenInclude(r => r.Permissions)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .Include(ui => ui.Beneficiary)
            .Where(ui => ui.UserId == user.Id)
            .ToListAsync(ct);

        if (identities.Count == 0)
            return (null, new ValidationResult([new ValidationFailure("Credentials", "IDNP sau parola incorectă.")]), 401);

        // Find an active identity whose password matches
        var identity = identities
            .Where(ui => ui.Status == UserStatus.Active)
            .FirstOrDefault(ui =>
                !string.IsNullOrEmpty(ui.PasswordHash) &&
                BCrypt.Net.BCrypt.Verify(request.Password, ui.PasswordHash));

        if (identity is null)
        {
            // Check if any identity is blocked/inactive (different error message)
            var anyActive = identities.Any(ui => ui.Status == UserStatus.Active);
            if (!anyActive)
                return (null, new ValidationResult([new ValidationFailure("Status", "Contul este blocat sau dezactivat.")]), 401);

            return (null, new ValidationResult([new ValidationFailure("Credentials", "IDNP sau parola incorectă.")]), 401);
        }

        var permissions = identity.Role.Permissions
            .Select(p => p.Key)
            .Union(identity.Permissions.Select(up => up.Permission.Key))
            .Distinct()
            .ToList();

        var accessToken = _tokenService.GenerateAccessToken(
            user.Id, user.Idnp, identity.Role.Key, permissions, identity.BeneficiaryId);

        var refreshToken = _tokenService.GenerateRefreshToken();

        // Save refresh token on the matched identity (tracked query needed)
        var trackedIdentity = await _context.UserIdentities
            .FirstAsync(ui => ui.Id == identity.Id, ct);
        trackedIdentity.RefreshToken = refreshToken;
        trackedIdentity.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(7);
        await _context.SaveChangesAsync(ct);

        var userInfo = new UserInfoModel(
            Id: user.Id,
            Idnp: user.Idnp,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Email: user.Email,
            Role: identity.Role.Key,
            RoleType: identity.Role.Type.ToString(),
            BeneficiaryId: identity.BeneficiaryId,
            BeneficiaryName: identity.Beneficiary?.CompanyName,
            Permissions: permissions
        );

        // Build available companies list from all active identities
        var availableCompanies = identities
            .Where(ui => ui.Status == UserStatus.Active && ui.BeneficiaryId.HasValue && ui.Beneficiary is not null)
            .Select(ui => new CompanyInfo(ui.BeneficiaryId!.Value, ui.Beneficiary!.CompanyName, ui.Beneficiary.Idno))
            .ToList();

        var response = new LoginResponse(
            Token: accessToken,
            RefreshToken: refreshToken,
            ExpiresAt: DateTimeOffset.UtcNow.AddHours(1),
            User: userInfo,
            AvailableCompanies: availableCompanies
        );

        return (response, null, 200);
    }
}
