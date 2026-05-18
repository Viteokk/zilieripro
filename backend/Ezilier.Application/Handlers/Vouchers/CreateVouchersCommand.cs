using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Application.Services;
using Ezilier.Domain.Entities;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Vouchers;

public record CreateVouchersCommand(
    CreateVoucherRequest Request,
    Guid BeneficiaryId
) : IRequest<(VoucherCreatedSummary? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class CreateVouchersCommandHandler(
    IDataContext context,
    ITaxCalculationService taxService,
    IRspVerificationService rspService
) : IRequestHandler<CreateVouchersCommand, (VoucherCreatedSummary? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(VoucherCreatedSummary? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        CreateVouchersCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var beneficiaryId = command.BeneficiaryId;

        // Validate hours
        var failures = new List<ValidationFailure>();

        if (request.HoursWorked < 1 || request.HoursWorked > 8)
        {
            failures.Add(new ValidationFailure("HoursWorked", "Numarul de ore trebuie sa fie intre 1 si 8."));
        }

        if (request.Workers.Count == 0)
        {
            failures.Add(new ValidationFailure("Workers", "Trebuie sa specificati cel putin un lucrator."));
        }

        if (failures.Count > 0)
        {
            return (null, new ValidationResult(failures), 400);
        }

        var currentYear = request.WorkDate.Year;
        var yearStart = new DateOnly(currentYear, 1, 1);
        var yearEnd = new DateOnly(currentYear, 12, 31);

        var createdVouchers = new List<Voucher>();

        foreach (var workerReq in request.Workers)
        {
            // Find or create worker
            var worker = await context.Workers
                .FirstOrDefaultAsync(w => w.Idnp == workerReq.Idnp && w.BeneficiaryId == beneficiaryId,
                    cancellationToken);

            if (worker == null)
            {
                worker = new Worker
                {
                    Idnp = workerReq.Idnp,
                    FirstName = workerReq.FirstName,
                    LastName = workerReq.LastName,
                    BirthDate = workerReq.BirthDate,
                    Phone = workerReq.Phone,
                    Email = workerReq.Email,
                    BeneficiaryId = beneficiaryId
                };
                context.Workers.Add(worker);
            }
            else
            {
                worker.Phone = workerReq.Phone ?? worker.Phone;
                worker.Email = workerReq.Email ?? worker.Email;
            }

            // RSP verification
            var rspResult = await rspService.VerifyWorkerAsync(
                workerReq.Idnp, workerReq.FirstName, workerReq.LastName, workerReq.BirthDate);

            worker.RspValidated = rspResult.IsValid;
            worker.RspValidatedAt = DateTimeOffset.UtcNow;
            worker.RspErrorMessage = rspResult.ErrorMessage;

            if (!rspResult.IsValid)
            {
                foreach (var fieldError in rspResult.FieldErrors)
                {
                    failures.Add(new ValidationFailure(
                        $"Workers[{workerReq.Idnp}].{fieldError.Key}",
                        fieldError.Value));
                }
                continue;
            }

            // Check yearly limit (120 vouchers per worker per beneficiary)
            var yearlyCount = await context.Vouchers
                .CountAsync(v => v.WorkerId == worker.Id
                    && v.BeneficiaryId == beneficiaryId
                    && v.WorkDate >= yearStart
                    && v.WorkDate <= yearEnd
                    && v.Status != VoucherStatus.Anulat,
                    cancellationToken);

            if (yearlyCount >= 120)
            {
                failures.Add(new ValidationFailure(
                    $"Workers[{workerReq.Idnp}]",
                    $"Lucratorul {workerReq.FirstName} {workerReq.LastName} a atins limita anuala de 120 vouchere."));
                continue;
            }

            // Check duplicate (worker + date + beneficiary)
            var duplicate = await context.Vouchers
                .AnyAsync(v => v.WorkerId == worker.Id
                    && v.BeneficiaryId == beneficiaryId
                    && v.WorkDate == request.WorkDate
                    && v.Status != VoucherStatus.Anulat,
                    cancellationToken);

            if (duplicate)
            {
                failures.Add(new ValidationFailure(
                    $"Workers[{workerReq.Idnp}]",
                    $"Exista deja un voucher pentru lucratorul {workerReq.FirstName} {workerReq.LastName} la data {request.WorkDate}."));
                continue;
            }

            // Calculate taxes
            var (incomeTax, cnas, gross) = taxService.Calculate(workerReq.NetRemuneration);

            // Generate unique code
            var code = $"VCH-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";

            var voucher = new Voucher
            {
                Code = code,
                BeneficiaryId = beneficiaryId,
                WorkerId = worker.Id,
                Status = VoucherStatus.Emis,
                WorkDate = request.WorkDate,
                HoursWorked = request.HoursWorked,
                NetRemuneration = workerReq.NetRemuneration,
                IncomeTax = incomeTax,
                CnasContribution = cnas,
                GrossRemuneration = gross,
                WorkDistrict = request.WorkDistrict,
                WorkLocality = request.WorkLocality,
                WorkAddress = request.WorkAddress,
                ActivityType = request.ActivityType,
                RspValidated = rspResult.IsValid,
                Art5Alin1LitB = request.Art5Alin1LitB,
                Art5Alin1LitG = request.Art5Alin1LitG,
                WorkerPhone = worker.Phone,
                WorkerEmail = worker.Email,
                Worker = worker
            };

            context.Vouchers.Add(voucher);
            createdVouchers.Add(voucher);
        }

        if (failures.Count > 0)
        {
            return (null, new ValidationResult(failures), 400);
        }

        await context.SaveChangesAsync(cancellationToken);

        var summary = new VoucherCreatedSummary
        {
            TotalVouchers = createdVouchers.Count,
            TotalNet = createdVouchers.Sum(v => v.NetRemuneration),
            TotalGross = createdVouchers.Sum(v => v.GrossRemuneration),
            TotalTax = createdVouchers.Sum(v => v.IncomeTax),
            TotalCnas = createdVouchers.Sum(v => v.CnasContribution),
            Vouchers = createdVouchers.Select(v => new VoucherTableItem
            {
                Id = v.Id,
                Code = v.Code,
                Status = v.Status,
                WorkDate = v.WorkDate,
                HoursWorked = v.HoursWorked,
                NetRemuneration = v.NetRemuneration,
                GrossRemuneration = v.GrossRemuneration,
                WorkerIdnp = v.Worker.Idnp,
                WorkerFullName = $"{v.Worker.FirstName} {v.Worker.LastName}",
                WorkDistrict = v.WorkDistrict,
                CreatedAt = v.CreatedAt
            }).ToList()
        };

        return (summary, null, 201);
    }
}
