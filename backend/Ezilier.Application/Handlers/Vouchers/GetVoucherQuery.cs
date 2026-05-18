using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Vouchers;

public record GetVoucherQuery(
    Guid Id
) : IRequest<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class GetVoucherQueryHandler(
    IDataContext context
) : IRequestHandler<GetVoucherQuery, (VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        GetVoucherQuery query, CancellationToken cancellationToken)
    {
        var voucher = await context.Vouchers
            .AsNoTracking()
            .Include(v => v.Worker)
            .Include(v => v.Beneficiary)
            .FirstOrDefaultAsync(v => v.Id == query.Id, cancellationToken);

        if (voucher is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Voucherul nu a fost gasit.")]), 404);
        }

        var model = MapToDetailModel(voucher);

        return (model, null, 200);
    }

    internal static VoucherDetailModel MapToDetailModel(Domain.Entities.Voucher voucher)
    {
        return new VoucherDetailModel
        {
            Id = voucher.Id,
            Code = voucher.Code,
            Status = voucher.Status,
            WorkDate = voucher.WorkDate,
            HoursWorked = voucher.HoursWorked,
            NetRemuneration = voucher.NetRemuneration,
            IncomeTax = voucher.IncomeTax,
            CnasContribution = voucher.CnasContribution,
            GrossRemuneration = voucher.GrossRemuneration,
            WorkDistrict = voucher.WorkDistrict,
            WorkLocality = voucher.WorkLocality,
            WorkAddress = voucher.WorkAddress,
            ActivityType = voucher.ActivityType,
            RspValidated = voucher.RspValidated,
            Art5Alin1LitB = voucher.Art5Alin1LitB,
            Art5Alin1LitG = voucher.Art5Alin1LitG,
            CancellationReason = voucher.CancellationReason,
            CancellationNote = voucher.CancellationNote,
            CancellationDate = voucher.CancellationDate,
            ActivatedAt = voucher.ActivatedAt,
            ExecutedAt = voucher.ExecutedAt,
            ReportedAt = voucher.ReportedAt,
            ReportPeriod = voucher.ReportPeriod,
            CreatedAt = voucher.CreatedAt,
            SignatureDataUrl = voucher.SignatureDataUrl,
            SignedAt = voucher.SignedAt,
            WorkerPhone = voucher.WorkerPhone,
            WorkerEmail = voucher.WorkerEmail,
            Worker = new WorkerModel
            {
                Id = voucher.Worker.Id,
                Idnp = voucher.Worker.Idnp,
                FirstName = voucher.Worker.FirstName,
                LastName = voucher.Worker.LastName,
                BirthDate = voucher.Worker.BirthDate,
                Phone = voucher.Worker.Phone,
                Email = voucher.Worker.Email,
                RspValidated = voucher.Worker.RspValidated,
                RspValidatedAt = voucher.Worker.RspValidatedAt,
                RspErrorMessage = voucher.Worker.RspErrorMessage,
                CreatedAt = voucher.Worker.CreatedAt
            },
            Beneficiary = new BeneficiaryModel
            {
                Id = voucher.Beneficiary.Id,
                Idno = voucher.Beneficiary.Idno,
                CompanyName = voucher.Beneficiary.CompanyName,
                LegalForm = voucher.Beneficiary.LegalForm,
                ActivityType = voucher.Beneficiary.ActivityType,
                Address = voucher.Beneficiary.Address,
                District = voucher.Beneficiary.District,
                Locality = voucher.Beneficiary.Locality,
                Phone = voucher.Beneficiary.Phone,
                Email = voucher.Beneficiary.Email,
                CreatedAt = voucher.Beneficiary.CreatedAt
            }
        };
    }
}
