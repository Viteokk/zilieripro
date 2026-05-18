using Ezilier.Domain.Enums;

namespace Ezilier.Domain.Entities;

public class Voucher : EntityBase
{
    public string Code { get; set; } = string.Empty;
    public Guid BeneficiaryId { get; set; }
    public Guid WorkerId { get; set; }
    public VoucherStatus Status { get; set; } = VoucherStatus.Emis;

    public DateOnly WorkDate { get; set; }
    public int HoursWorked { get; set; }

    public decimal NetRemuneration { get; set; }
    public decimal IncomeTax { get; set; }
    public decimal CnasContribution { get; set; }
    public decimal GrossRemuneration { get; set; }

    public string WorkDistrict { get; set; } = string.Empty;
    public string WorkLocality { get; set; } = string.Empty;
    public string? WorkAddress { get; set; }

    // Activity performed (Art. 5(4) lit. f). Nomenclator code from category 'activity_types'.
    public string? ActivityType { get; set; }

    public CancellationReasonCode? CancellationReason { get; set; }
    public DateTimeOffset? CancellationDate { get; set; }
    public string? CancellationNote { get; set; }

    public bool RspValidated { get; set; }
    public DateTimeOffset? ActivatedAt { get; set; }
    public DateTimeOffset? ExecutedAt { get; set; }
    public DateTimeOffset? ReportedAt { get; set; }
    public string? ReportPeriod { get; set; }

    public bool Art5Alin1LitB { get; set; }
    public bool Art5Alin1LitG { get; set; }

    // Electronic signature (US-A19): captured as data URL (PNG), shown on receipt.
    public string? SignatureDataUrl { get; set; }
    public DateTimeOffset? SignedAt { get; set; }

    // Snapshot of worker contact details at voucher creation time.
    public string? WorkerPhone { get; set; }
    public string? WorkerEmail { get; set; }

    public virtual Beneficiary Beneficiary { get; set; } = null!;
    public virtual Worker Worker { get; set; } = null!;
}
