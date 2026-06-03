using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Entities;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Users;

public record UpdateUserCommand(
    Guid Id,
    UpdateUserRequest Request
) : IRequest<(UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class UpdateUserCommandHandler(
    IDataContext context
) : IRequestHandler<UpdateUserCommand, (UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(UserDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        UpdateUserCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        var identity = await context.UserIdentities
            .Include(ui => ui.User)
            .Include(ui => ui.Role)
            .Include(ui => ui.Beneficiary)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .Where(ui => !ui.IsDeleted && !ui.User.IsDeleted)
            .FirstOrDefaultAsync(ui => ui.UserId == command.Id, cancellationToken);

        if (identity is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Utilizatorul nu a fost gasit.")]), 404);
        }

        // Update user fields
        if (request.FirstName is not null)
        {
            identity.User.FirstName = request.FirstName;
        }

        if (request.LastName is not null)
        {
            identity.User.LastName = request.LastName;
        }

        if (request.Email is not null)
        {
            identity.User.Email = request.Email;
        }

        if (request.Phone is not null)
        {
            identity.User.Phone = request.Phone;
        }

        if (request.Language is not null)
        {
            identity.User.Language = request.Language;
        }

        // Update identity fields
        if (request.RoleId.HasValue)
        {
            var role = await context.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == request.RoleId.Value && !r.IsDeleted, cancellationToken);

            if (role is null)
            {
                return (null, new ValidationResult(
                    [new ValidationFailure("RoleId", "Rolul selectat nu a fost gasit.")]), 400);
            }

            identity.RoleId = request.RoleId.Value;
        }

        if (request.BeneficiaryId.HasValue)
        {
            identity.BeneficiaryId = request.BeneficiaryId.Value;
        }

        if (request.AssignedDistricts is not null)
        {
            identity.AssignedDistricts = request.AssignedDistricts;
        }

        if (request.JobTitle is not null)
        {
            identity.JobTitle = request.JobTitle;
        }

        // Update permissions
        if (request.PermissionIds is not null)
        {
            // Validate permissions exist
            if (request.PermissionIds.Count > 0)
            {
                var validPermissionCount = await context.Permissions
                    .CountAsync(p => request.PermissionIds.Contains(p.Id) && !p.IsDeleted, cancellationToken);

                if (validPermissionCount != request.PermissionIds.Count)
                {
                    return (null, new ValidationResult(
                        [new ValidationFailure("PermissionIds", "Una sau mai multe permisiuni nu au fost gasite.")]), 400);
                }
            }

            // Remove existing permissions
            var existingPermissions = await context.UserPermissions
                .Where(up => up.UserIdentityId == identity.Id)
                .ToListAsync(cancellationToken);

            foreach (var existing in existingPermissions)
            {
                context.UserPermissions.Remove(existing);
            }

            // Add new permissions
            foreach (var permissionId in request.PermissionIds)
            {
                context.UserPermissions.Add(new UserPermission
                {
                    UserIdentityId = identity.Id,
                    PermissionId = permissionId
                });
            }
        }

        identity.User.UpdatedAt = DateTimeOffset.UtcNow;
        identity.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        // Reload with fresh navigation properties
        var updatedIdentity = await context.UserIdentities
            .AsNoTracking()
            .Include(ui => ui.User)
            .Include(ui => ui.Role)
            .Include(ui => ui.Beneficiary)
            .Include(ui => ui.Permissions)
                .ThenInclude(up => up.Permission)
            .FirstAsync(ui => ui.Id == identity.Id, cancellationToken);

        var model = GetUserQueryHandler.MapToDetailModel(updatedIdentity);

        return (model, null, 200);
    }
}
