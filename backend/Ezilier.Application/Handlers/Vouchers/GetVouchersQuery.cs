using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Vouchers;

public record GetVouchersQuery(
    VouchersQueryParams Params,
    Guid? BeneficiaryId
) : IRequest<(PaginatedResult<VoucherTableItem>? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetVouchersQueryHandler(
    IDataContext context
) : IRequestHandler<GetVouchersQuery, (PaginatedResult<VoucherTableItem>? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(PaginatedResult<VoucherTableItem>? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetVouchersQuery query, CancellationToken cancellationToken)
    {
        var p = query.Params;
        var beneficiaryId = query.BeneficiaryId;

        var q = context.Vouchers
            .AsNoTracking()
            .Include(v => v.Worker)
            .Include(v => v.Beneficiary)
            .AsQueryable();

        // Scope to beneficiary if provided (employer view)
        if (beneficiaryId.HasValue)
        {
            q = q.Where(v => v.BeneficiaryId == beneficiaryId.Value);
        }

        // Additional beneficiary filter from query params (inspector cross-beneficiary)
        if (p.BeneficiaryId.HasValue)
        {
            q = q.Where(v => v.BeneficiaryId == p.BeneficiaryId.Value);
        }

        if (p.Status.HasValue)
        {
            q = q.Where(v => v.Status == p.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(p.WorkerIdnp))
        {
            q = q.Where(v => v.Worker.Idnp == p.WorkerIdnp);
        }

        if (!string.IsNullOrWhiteSpace(p.Code))
        {
            q = q.Where(v => v.Code.Contains(p.Code));
        }

        if (p.DateFrom.HasValue)
        {
            q = q.Where(v => v.WorkDate >= p.DateFrom.Value);
        }

        if (p.DateTo.HasValue)
        {
            q = q.Where(v => v.WorkDate <= p.DateTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(p.District))
        {
            q = q.Where(v => v.WorkDistrict == p.District);
        }

        if (!string.IsNullOrWhiteSpace(p.Locality))
        {
            // Multi-select: frontend trimite CSV (ex: "Balti,Cahul"). Daca un singur item, fallback Contains pentru flexibilitate.
            var localities = p.Locality
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToArray();

            if (localities.Length == 1)
            {
                var single = localities[0];
                q = q.Where(v => v.WorkLocality.Contains(single));
            }
            else if (localities.Length > 1)
            {
                q = q.Where(v => localities.Contains(v.WorkLocality));
            }
        }

        // Sorting (SQLite doesn't support DateTimeOffset in ORDER BY, use WorkDate/Id instead)
        q = p.SortBy?.ToLowerInvariant() switch
        {
            "code" => p.SortDesc ? q.OrderByDescending(v => v.Code) : q.OrderBy(v => v.Code),
            "status" => p.SortDesc ? q.OrderByDescending(v => v.Status) : q.OrderBy(v => v.Status),
            "hoursworked" => p.SortDesc ? q.OrderByDescending(v => v.HoursWorked) : q.OrderBy(v => v.HoursWorked),
            "netremuneration" => p.SortDesc ? q.OrderByDescending(v => v.NetRemuneration) : q.OrderBy(v => v.NetRemuneration),
            "grossremuneration" => p.SortDesc ? q.OrderByDescending(v => v.GrossRemuneration) : q.OrderBy(v => v.GrossRemuneration),
            "createdat" => p.SortDesc ? q.OrderByDescending(v => v.WorkDate).ThenByDescending(v => v.Id) : q.OrderBy(v => v.WorkDate).ThenBy(v => v.Id),
            "workdistrict" => p.SortDesc ? q.OrderByDescending(v => v.WorkDistrict) : q.OrderBy(v => v.WorkDistrict),
            _ => q.OrderByDescending(v => v.WorkDate).ThenByDescending(v => v.Id)
        };

        var totalCount = await q.CountAsync(cancellationToken);

        var items = await q
            .Skip(p.Offset)
            .Take(p.Limit)
            .Select(v => new VoucherTableItem
            {
                Id = v.Id,
                Code = v.Code,
                Status = v.Status,
                WorkDate = v.WorkDate,
                HoursWorked = v.HoursWorked,
                NetRemuneration = v.NetRemuneration,
                GrossRemuneration = v.GrossRemuneration,
                WorkerIdnp = v.Worker.Idnp,
                WorkerFullName = v.Worker.FirstName + " " + v.Worker.LastName,
                BeneficiaryName = v.Beneficiary != null ? v.Beneficiary.CompanyName : string.Empty,
                WorkDistrict = v.WorkDistrict,
                CreatedAt = v.CreatedAt,
                WorkerPhone = v.WorkerPhone,
                WorkerEmail = v.WorkerEmail
            })
            .ToListAsync(cancellationToken);

        var result = new PaginatedResult<VoucherTableItem>
        {
            Items = items,
            TotalCount = totalCount,
            Offset = p.Offset,
            Limit = p.Limit
        };

        return (result, null, 200);
    }
}
