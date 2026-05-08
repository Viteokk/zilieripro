using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Vouchers;

public record CancelVoucherCommand(
    Guid Id,
    CancelVoucherRequest Request
) : IRequest<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class CancelVoucherCommandHandler(
    IDataContext context
) : IRequestHandler<CancelVoucherCommand, (VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        CancelVoucherCommand command, CancellationToken cancellationToken)
    {
        var voucher = await context.Vouchers
            .Include(v => v.Worker)
            .Include(v => v.Beneficiary)
            .FirstOrDefaultAsync(v => v.Id == command.Id, cancellationToken);

        if (voucher is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Voucherul nu a fost gasit.")]), 404);
        }

        if (voucher.Status != VoucherStatus.Emis && voucher.Status != VoucherStatus.Activ)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Status",
                    $"Voucherul poate fi anulat doar din starea Emis sau Activ. Starea curenta: {voucher.Status}.")]), 400);
        }

        var reason = command.Request.ReasonCode.Replace("-", "") switch
        {
            "CA01" => CancellationReasonCode.CA01,
            "CA02" => CancellationReasonCode.CA02,
            "CA03" => CancellationReasonCode.CA03,
            _ => (CancellationReasonCode?)null
        };
        if (reason is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("ReasonCode", "Motivul anularii este invalid.")]), 400);
        }

        voucher.Status = VoucherStatus.Anulat;
        voucher.CancellationReason = reason.Value;
        voucher.CancellationDate = command.Request.CancellationDate.HasValue
            ? new DateTimeOffset(command.Request.CancellationDate.Value.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero)
            : DateTimeOffset.UtcNow;
        voucher.CancellationNote = command.Request.Note;
        voucher.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        var model = GetVoucherQueryHandler.MapToDetailModel(voucher);

        return (model, null, 200);
    }
}
