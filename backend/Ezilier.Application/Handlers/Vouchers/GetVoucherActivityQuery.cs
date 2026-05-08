using Ezilier.Application.Interfaces;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Ezilier.Application.Handlers.Vouchers;

public record VoucherActivityItem(
    string ActionLabel,
    string? UserFullName,
    DateTimeOffset Timestamp,
    List<string>? Changes = null
);

public record GetVoucherActivityQuery(Guid VoucherId)
    : IRequest<(List<VoucherActivityItem>? Items, ValidationResult? Errors, int Status)>;

public class GetVoucherActivityQueryHandler(IDataContext context)
    : IRequestHandler<GetVoucherActivityQuery, (List<VoucherActivityItem>? Items, ValidationResult? Errors, int Status)>
{
    public async Task<(List<VoucherActivityItem>? Items, ValidationResult? Errors, int Status)> Handle(
        GetVoucherActivityQuery query, CancellationToken cancellationToken)
    {
        var voucher = await context.Vouchers
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == query.VoucherId && !v.IsDeleted, cancellationToken);

        if (voucher is null)
            return (null, new ValidationResult(
                [new ValidationFailure("VoucherId", "Voucherul nu a fost gasit.")]), 404);

        var idStr = query.VoucherId.ToString();

        // Action-specific middleware logs (activate, execute, sign, cancel, report)
        var actionLogs = await context.AuditLogs
            .AsNoTracking()
            .Where(a => a.Action.Contains(idStr) && a.EntityType == "Api")
            .ToListAsync(cancellationToken);

        // Field-level edit logs created by EditVoucherCommand
        var editLogs = await context.AuditLogs
            .AsNoTracking()
            .Where(a => a.EntityType == "VoucherEdit" && a.EntityId == query.VoucherId)
            .ToListAsync(cancellationToken);

        // Collect all IDNPs for name lookup
        var idnps = actionLogs
            .Where(a => a.UserName != null)
            .Select(a => a.UserName!)
            .Concat(editLogs.Where(a => a.UserName != null).Select(a => a.UserName!))
            .Distinct()
            .ToList();

        var nameDict = idnps.Count > 0
            ? (await context.Users
                .AsNoTracking()
                .Where(u => idnps.Contains(u.Idnp))
                .Select(u => new { u.Idnp, u.FirstName, u.LastName })
                .ToListAsync(cancellationToken))
                .ToDictionary(u => u.Idnp, u => $"{u.FirstName} {u.LastName}")
            : new Dictionary<string, string>();

        var items = new List<VoucherActivityItem>
        {
            new("Emis", null, voucher.CreatedAt)
        };

        // Process action-specific API logs (skip generic PUT/edit ones)
        foreach (var log in actionLogs)
        {
            var label = log.Action switch
            {
                var a when a.Contains("/activate") => "Activat",
                var a when a.Contains("/execute") => "Executat",
                var a when a.Contains("/sign") => "Semnat",
                var a when a.Contains("/cancel") => "Anulat",
                var a when a.Contains("/report") => "Raportat",
                _ => null  // skip generic PUT/GET logs
            };

            if (label is null) continue;

            string? fullName = log.UserName != null && nameDict.TryGetValue(log.UserName, out var n) ? n : null;
            items.Add(new VoucherActivityItem(label, fullName, log.CreatedAt));
        }

        // Process field-level edit logs
        foreach (var log in editLogs)
        {
            List<string>? changes = null;
            if (!string.IsNullOrEmpty(log.Details))
            {
                try { changes = JsonSerializer.Deserialize<List<string>>(log.Details); }
                catch { /* ignore parse errors */ }
            }

            string? fullName = log.UserName != null && nameDict.TryGetValue(log.UserName, out var n) ? n : null;
            items.Add(new VoucherActivityItem("Modificat", fullName, log.CreatedAt, changes));
        }

        items.Sort((a, b) => a.Timestamp.CompareTo(b.Timestamp));

        return (items, null, 200);
    }
}
