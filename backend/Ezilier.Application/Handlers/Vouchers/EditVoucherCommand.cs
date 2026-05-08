using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Application.Services;
using Ezilier.Domain.Entities;
using Ezilier.Domain.Enums;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Ezilier.Application.Handlers.Vouchers;

public record EditVoucherCommand(
    Guid Id,
    EditVoucherRequest Request,
    string? UserIdnp = null
) : IRequest<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class EditVoucherCommandHandler(
    IDataContext context,
    ITaxCalculationService taxService
) : IRequestHandler<EditVoucherCommand, (VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(VoucherDetailModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        EditVoucherCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        var voucher = await context.Vouchers
            .Include(v => v.Worker)
            .Include(v => v.Beneficiary)
            .FirstOrDefaultAsync(v => v.Id == command.Id, cancellationToken);

        if (voucher is null)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Id", "Voucherul nu a fost gasit.")]), 404);
        }

        // Check if editing is allowed based on status
        if (voucher.Status is VoucherStatus.Executat or VoucherStatus.Raportat or VoucherStatus.Anulat)
        {
            return (null, new ValidationResult(
                [new ValidationFailure("Status",
                    $"Voucherul nu poate fi editat in starea {voucher.Status}.")]), 400);
        }

        // Capture old values for audit trail
        var oldHoursWorked = voucher.HoursWorked;
        var oldNetRemuneration = voucher.NetRemuneration;
        var oldWorkDate = voucher.WorkDate;
        var oldWorkDistrict = voucher.WorkDistrict;
        var oldWorkLocality = voucher.WorkLocality;
        var oldWorkAddress = voucher.WorkAddress;
        var oldPhone = voucher.Worker?.Phone;
        var oldEmail = voucher.Worker?.Email;

        var failures = new List<ValidationFailure>();
        var remunerationChanged = false;

        if (voucher.Status == VoucherStatus.Emis)
        {
            // All fields editable
            if (request.WorkDate.HasValue)
            {
                voucher.WorkDate = request.WorkDate.Value;
            }

            if (request.HoursWorked.HasValue)
            {
                if (request.HoursWorked.Value < 1 || request.HoursWorked.Value > 8)
                {
                    failures.Add(new ValidationFailure("HoursWorked",
                        "Numarul de ore trebuie sa fie intre 1 si 8."));
                }
                else
                {
                    voucher.HoursWorked = request.HoursWorked.Value;
                }
            }

            if (request.NetRemuneration.HasValue)
            {
                voucher.NetRemuneration = request.NetRemuneration.Value;
                remunerationChanged = true;
            }

            if (request.WorkDistrict is not null)
            {
                voucher.WorkDistrict = request.WorkDistrict;
            }

            if (request.WorkLocality is not null)
            {
                voucher.WorkLocality = request.WorkLocality;
            }

            if (request.WorkAddress is not null)
            {
                voucher.WorkAddress = request.WorkAddress;
            }

            if (request.Phone is not null)
            {
                voucher.Worker.Phone = request.Phone;
            }

            if (request.Email is not null)
            {
                voucher.Worker.Email = request.Email;
            }
        }
        else if (voucher.Status == VoucherStatus.Activ)
        {
            // Only hours, net remuneration, phone, email editable (NOT RSP fields)
            if (request.WorkDate.HasValue)
            {
                failures.Add(new ValidationFailure("WorkDate",
                    "Data de lucru nu poate fi modificata pentru un voucher activ."));
            }

            if (request.WorkDistrict is not null)
            {
                failures.Add(new ValidationFailure("WorkDistrict",
                    "Districtul nu poate fi modificat pentru un voucher activ."));
            }

            if (request.WorkLocality is not null)
            {
                failures.Add(new ValidationFailure("WorkLocality",
                    "Localitatea nu poate fi modificata pentru un voucher activ."));
            }

            if (request.WorkAddress is not null)
            {
                failures.Add(new ValidationFailure("WorkAddress",
                    "Adresa nu poate fi modificata pentru un voucher activ."));
            }

            if (request.HoursWorked.HasValue)
            {
                if (request.HoursWorked.Value < 1 || request.HoursWorked.Value > 8)
                {
                    failures.Add(new ValidationFailure("HoursWorked",
                        "Numarul de ore trebuie sa fie intre 1 si 8."));
                }
                else
                {
                    voucher.HoursWorked = request.HoursWorked.Value;
                }
            }

            if (request.NetRemuneration.HasValue)
            {
                voucher.NetRemuneration = request.NetRemuneration.Value;
                remunerationChanged = true;
            }

            if (request.Phone is not null)
            {
                voucher.Worker.Phone = request.Phone;
            }

            if (request.Email is not null)
            {
                voucher.Worker.Email = request.Email;
            }
        }

        if (failures.Count > 0)
        {
            return (null, new ValidationResult(failures), 400);
        }

        // Recalculate taxes if remuneration changed
        if (remunerationChanged)
        {
            var (incomeTax, cnas, gross) = taxService.Calculate(voucher.NetRemuneration);
            voucher.IncomeTax = incomeTax;
            voucher.CnasContribution = cnas;
            voucher.GrossRemuneration = gross;
        }

        voucher.UpdatedAt = DateTimeOffset.UtcNow;

        // Build field-level change audit
        var auditChanges = new List<string>();
        if (voucher.HoursWorked != oldHoursWorked)
            auditChanges.Add($"Ore lucrate: {oldHoursWorked} → {voucher.HoursWorked}");
        if (voucher.NetRemuneration != oldNetRemuneration)
            auditChanges.Add($"Remuneratie neta: {oldNetRemuneration:F2} → {voucher.NetRemuneration:F2}");
        if (voucher.WorkDate != oldWorkDate)
            auditChanges.Add($"Data activitatii: {oldWorkDate} → {voucher.WorkDate}");
        if (voucher.WorkDistrict != oldWorkDistrict)
            auditChanges.Add($"Raion: {oldWorkDistrict} → {voucher.WorkDistrict}");
        if (voucher.WorkLocality != oldWorkLocality)
            auditChanges.Add($"Localitate: {oldWorkLocality} → {voucher.WorkLocality}");
        if (voucher.WorkAddress != oldWorkAddress)
            auditChanges.Add($"Adresa: {oldWorkAddress ?? "-"} → {voucher.WorkAddress ?? "-"}");
        if (voucher.Worker?.Phone != oldPhone)
            auditChanges.Add($"Telefon: {oldPhone ?? "-"} → {voucher.Worker?.Phone ?? "-"}");
        if (voucher.Worker?.Email != oldEmail)
            auditChanges.Add($"Email: {oldEmail ?? "-"} → {voucher.Worker?.Email ?? "-"}");

        if (auditChanges.Count > 0)
        {
            context.AuditLogs.Add(new AuditLog
            {
                EntityType = "VoucherEdit",
                EntityId = voucher.Id,
                UserName = command.UserIdnp,
                Action = $"PUT /api/zilieri/vouchers/{voucher.Id}",
                Details = JsonSerializer.Serialize(auditChanges),
            });
        }

        await context.SaveChangesAsync(cancellationToken);

        var model = GetVoucherQueryHandler.MapToDetailModel(voucher);

        return (model, null, 200);
    }
}
