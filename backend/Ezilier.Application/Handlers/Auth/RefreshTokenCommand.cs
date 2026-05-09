using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Application.Services;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Auth;

public sealed class RefreshTokenCommand : IRequest<(LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public RefreshTokenRequest Request { get; set; } = null!;
}

public sealed class RefreshTokenCommandHandler
    : IRequestHandler<RefreshTokenCommand, (LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    private readonly IDataContext _context;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(IDataContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<(LoginResponse? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        RefreshTokenCommand command, CancellationToken ct)
    {
        var request = command.Request;

        // Find identity by refresh token
        var identity = await _context.UserIdentities
            .Include(ui => ui.User)
            .Include(ui => ui.Role)
                .ThenInclude(r => r.Permissions)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .Include(ui => ui.Beneficiary)
            .FirstOrDefaultAsync(ui => ui.RefreshToken == request.RefreshToken, ct);

        if (identity is null)
        {
            return (null, new ValidationResult(new[]
            {
                new ValidationFailure("RefreshToken", "Token de reautentificare invalid.")
            }), 401);
        }

        // Check expiration
        if (identity.RefreshTokenExpiresAt is null ||
            identity.RefreshTokenExpiresAt <= DateTimeOffset.UtcNow)
        {
            // Revoke expired token
            identity.RefreshToken = null;
            identity.RefreshTokenExpiresAt = null;
            await _context.SaveChangesAsync(ct);

            return (null, new ValidationResult(new[]
            {
                new ValidationFailure("RefreshToken", "Token de reautentificare expirat.")
            }), 401);
        }

        // Check account status
        if (identity.Status != Domain.Enums.UserStatus.Active)
        {
            return (null, new ValidationResult(new[]
            {
                new ValidationFailure("Status", "Contul este blocat sau dezactivat.")
            }), 401);
        }

        var user = identity.User;

        // Collect permissions
        var permissions = identity.Role.Permissions
            .Select(p => p.Key)
            .Union(identity.Permissions.Select(up => up.Permission.Key))
            .Distinct()
            .ToList();

        // Generate new tokens (token rotation)
        var newAccessToken = _tokenService.GenerateAccessToken(
            user.Id, user.Idnp, identity.Role.Key, permissions, identity.BeneficiaryId);

        var newRefreshToken = _tokenService.GenerateRefreshToken();

        // Persist rotated refresh token
        identity.RefreshToken = newRefreshToken;
        identity.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(7);
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

        // Build available companies for this user
        var allIdentities = await _context.UserIdentities
            .Include(ui => ui.Beneficiary)
            .Where(ui => ui.UserId == user.Id && ui.Status == Domain.Enums.UserStatus.Active && ui.BeneficiaryId.HasValue)
            .AsNoTracking()
            .ToListAsync(ct);

        var availableCompanies = allIdentities
            .Where(ui => ui.Beneficiary is not null)
            .Select(ui => new CompanyInfo(ui.BeneficiaryId!.Value, ui.Beneficiary!.CompanyName, ui.Beneficiary.Idno))
            .ToList();

        var response = new LoginResponse(
            Token: newAccessToken,
            RefreshToken: newRefreshToken,
            ExpiresAt: DateTimeOffset.UtcNow.AddMinutes(60),
            User: userInfo,
            AvailableCompanies: availableCompanies
        );

        return (response, null, 200);
    }
}
