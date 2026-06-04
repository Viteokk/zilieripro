using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Users;

public record GetUsersQuery(
    UsersQueryParams Params
) : IRequest<(PaginatedResult<UserTableItem>? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetUsersQueryHandler(
    IDataContext context
) : IRequestHandler<GetUsersQuery, (PaginatedResult<UserTableItem>? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(PaginatedResult<UserTableItem>? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetUsersQuery query, CancellationToken cancellationToken)
    {
        var p = query.Params;

        var q = context.UserIdentities
            .AsNoTracking()
            .Include(ui => ui.User)
            .Include(ui => ui.Role)
            .Where(ui => !ui.IsDeleted && !ui.User.IsDeleted)
            .AsQueryable();

        if (p.Status.HasValue)
        {
            q = q.Where(ui => ui.Status == p.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(p.Role))
        {
            q = q.Where(ui => ui.Role.Key == p.Role);
        }

        if (!string.IsNullOrWhiteSpace(p.Search))
        {
            var search = p.Search.Trim().ToLower();
            q = q.Where(ui =>
                ui.User.Idnp.Contains(search) ||
                ui.User.FirstName.ToLower().Contains(search) ||
                ui.User.LastName.ToLower().Contains(search) ||
                (ui.User.Email != null && ui.User.Email.ToLower().Contains(search)));
        }

        q = q.OrderBy(ui => ui.User.LastName).ThenBy(ui => ui.User.FirstName);

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .Skip(p.Offset)
            .Take(p.Limit)
            .Select(ui => new UserTableItem
            {
                Id = ui.UserId,
                Idnp = ui.User.Idnp,
                FirstName = ui.User.FirstName,
                LastName = ui.User.LastName,
                Email = ui.User.Email,
                Phone = ui.User.Phone,
                RoleName = ui.Role.Title,
                JobTitle = ui.JobTitle,
                Status = ui.Status,
                CreatedAt = ui.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var result = new PaginatedResult<UserTableItem>
        {
            Items = items,
            TotalCount = totalCount,
            Offset = p.Offset,
            Limit = p.Limit
        };

        return (result, null, 200);
    }
}
