using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ezilier.Application.Handlers.Reports;

public record ExportIpc21PdfCommand(
    Guid BeneficiaryId,
    string Period
) : IRequest<(byte[]? Pdf, string? FileName, ValidationResult? Errors, int Status)>;

public class ExportIpc21PdfCommandHandler(
    IDataContext context,
    IIpc21PdfGenerator pdf,
    IMediator mediator,
    ILogger<ExportIpc21PdfCommandHandler> logger
) : IRequestHandler<ExportIpc21PdfCommand, (byte[]? Pdf, string? FileName, ValidationResult? Errors, int Status)>
{
    public async Task<(byte[]? Pdf, string? FileName, ValidationResult? Errors, int Status)> Handle(
        ExportIpc21PdfCommand command, CancellationToken cancellationToken)
    {
        // 1. Build the report model via the existing query handler.
        var (model, queryErrors, queryStatus) = await mediator.Send(
            new GetIpc21ReportQuery(command.BeneficiaryId, command.Period), cancellationToken);

        if (queryStatus != 200 || model is null)
        {
            return (null, null, queryErrors, queryStatus);
        }

        // 2. Render PDF (no DB writes yet).
        byte[] pdfBytes;
        try
        {
            pdfBytes = pdf.Generate(model);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "IPC21 PDF generation failed for beneficiary {BeneficiaryId} period {Period}",
                command.BeneficiaryId, command.Period);
            return (null, null, new ValidationResult(
                [new ValidationFailure(string.Empty, "Generarea PDF-ului a esuat.")]), 500);
        }

        // 3. Status transition Executat -> Raportat in a transaction.
        var transitionedCount = 0;
        if (model.Lines.Count > 0)
        {
            await using var transaction = await context.BeginTransactionAsync(cancellationToken);
            try
            {
                var executatVouchers = await context.Vouchers
                    .Where(v => v.BeneficiaryId == command.BeneficiaryId
                        && v.Status == VoucherStatus.Executat
                        && v.WorkDate >= model.PeriodStart
                        && v.WorkDate <= model.PeriodEnd
                        && !v.IsDeleted)
                    .ToListAsync(cancellationToken);

                var now = DateTimeOffset.UtcNow;
                foreach (var v in executatVouchers)
                {
                    v.Status = VoucherStatus.Raportat;
                    v.ReportedAt = now;
                    v.UpdatedAt = now;
                    v.ReportPeriod = command.Period;
                }

                if (executatVouchers.Count > 0)
                {
                    await context.SaveChangesAsync(cancellationToken);
                }

                await transaction.CommitAsync(cancellationToken);
                transitionedCount = executatVouchers.Count;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                logger.LogError(ex,
                    "IPC21 status transition failed for beneficiary {BeneficiaryId} period {Period}",
                    command.BeneficiaryId, command.Period);
                return (null, null, new ValidationResult(
                    [new ValidationFailure(string.Empty, "Actualizarea statutului voucher-elor a esuat.")]), 500);
            }
        }

        var periodParts = command.Period.Split('-');
        string[] roMonths = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
            "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
        var monthName = roMonths[int.Parse(periodParts[1]) - 1];
        var fileName = $"IPC21_{model.Beneficiary.Idno}_{monthName}_{periodParts[0]}.pdf";
        logger.LogInformation(
            "IPC21 export OK: beneficiary={BeneficiaryId} period={Period} transitioned={Count}",
            command.BeneficiaryId, command.Period, transitionedCount);

        return (pdfBytes, fileName, null, 200);
    }
}
