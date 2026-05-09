using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Auth;

public sealed class GetCurrentUserQuery : IRequest<(UserInfoModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public Guid UserId { get; set; }
    public Guid? BeneficiaryId { get; set; }
}

public sealed class GetCurrentUserQueryHandler
    : IRequestHandler<GetCurrentUserQuery, (UserInfoModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    private readonly IDataContext _context;

    public GetCurrentUserQueryHandler(IDataContext context)
    {
        _context = context;
    }

    public async Task<(UserInfoModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetCurrentUserQuery query, CancellationToken ct)
    {
        var identityQuery = _context.UserIdentities
            .AsNoTracking()
            .Include(ui => ui.User)
            .Include(ui => ui.Role)
                .ThenInclude(r => r.Permissions)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .Include(ui => ui.Beneficiary)
            .Where(ui => ui.UserId == query.UserId);

        if (query.BeneficiaryId.HasValue)
            identityQuery = identityQuery.Where(ui => ui.BeneficiaryId == query.BeneficiaryId.Value);

        var identity = await identityQuery.FirstOrDefaultAsync(ct);

        if (identity is null)
        {
            return (null, new ValidationResult(new[]
            {
                new ValidationFailure("UserId", "Utilizatorul nu a fost găsit.")
            }), 404);
        }

        var permissions = identity.Role.Permissions
            .Select(p => p.Key)
            .Union(identity.Permissions.Select(up => up.Permission.Key))
            .Distinct()
            .ToList();

        var model = new UserInfoModel(
            Id: identity.UserId,
            Idnp: identity.User.Idnp,
            FirstName: identity.User.FirstName,
            LastName: identity.User.LastName,
            Email: identity.User.Email,
            Role: identity.Role.Key,
            RoleType: identity.Role.Type.ToString(),
            BeneficiaryId: identity.BeneficiaryId,
            BeneficiaryName: identity.Beneficiary?.CompanyName,
            Permissions: permissions
        );

        return (model, null, 200);
    }
}
