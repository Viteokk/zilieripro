using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Beneficiaries;

public record GetBeneficiariesQuery(string? Search, int Offset, int Limit)
    : IRequest<PaginatedResult<BeneficiaryModel>>;

public class GetBeneficiariesQueryHandler(IDataContext context)
    : IRequestHandler<GetBeneficiariesQuery, PaginatedResult<BeneficiaryModel>>
{
    public async Task<PaginatedResult<BeneficiaryModel>> Handle(GetBeneficiariesQuery query, CancellationToken ct)
    {
        var q = context.Beneficiaries
            .AsNoTracking()
            .Where(b => !b.IsDeleted);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(b => b.CompanyName.ToLower().Contains(s) || b.Idno.Contains(s));
        }

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderBy(b => b.CompanyName)
            .Skip(query.Offset)
            .Take(query.Limit)
            .Select(b => new BeneficiaryModel
            {
                Id = b.Id,
                Idno = b.Idno,
                CompanyName = b.CompanyName,
                LegalForm = b.LegalForm,
                ActivityType = b.ActivityType,
                Address = b.Address,
                District = b.District,
                Locality = b.Locality,
                Phone = b.Phone,
                Email = b.Email,
                WorkerCount = b.Workers.Count(w => !w.IsDeleted),
                VoucherCount = b.Vouchers.Count(v => !v.IsDeleted),
                CreatedAt = b.CreatedAt,
            })
            .ToListAsync(ct);

        return new PaginatedResult<BeneficiaryModel>
        {
            Items = items,
            TotalCount = total,
            Offset = query.Offset,
            Limit = query.Limit,
        };
    }
}
