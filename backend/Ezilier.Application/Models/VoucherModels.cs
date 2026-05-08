using Ezilier.Domain.Enums;

namespace Ezilier.Application.Models;

public record CreateVoucherRequest
{
    public DateOnly WorkDate { get; init; }
    public int HoursWorked { get; init; }
    public string WorkDistrict { get; init; } = string.Empty;
    public string WorkLocality { get; init; } = string.Empty;
    public string? WorkAddress { get; init; }
    public string? ActivityType { get; init; }
    public bool Art5Alin1LitB { get; init; }
    public bool Art5Alin1LitG { get; init; }
    public List<VoucherWorkerRequest> Workers { get; init; } = [];
}

public record VoucherWorkerRequest
{
    public string Idnp { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public DateOnly BirthDate { get; init; }
    public decimal NetRemuneration { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
}

public record EditVoucherRequest
{
    public DateOnly? WorkDate { get; init; }
    public int? HoursWorked { get; init; }
    public decimal? NetRemuneration { get; init; }
    public string? WorkDistrict { get; init; }
    public string? WorkLocality { get; init; }
    public string? WorkAddress { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
}

public record CancelVoucherRequest
{
    public string ReasonCode { get; init; } = string.Empty;
    public DateOnly? CancellationDate { get; init; }
    public string? Note { get; init; }
}

public record SignVoucherRequest
{
    public string SignatureDataUrl { get; init; } = string.Empty;
}

public record VoucherTableItem
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public VoucherStatus Status { get; init; }
    public DateOnly WorkDate { get; init; }
    public int HoursWorked { get; init; }
    public decimal NetRemuneration { get; init; }
    public decimal GrossRemuneration { get; init; }
    public string WorkerIdnp { get; init; } = string.Empty;
    public string WorkerFullName { get; init; } = string.Empty;
    public string BeneficiaryName { get; init; } = string.Empty;
    public string WorkDistrict { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
}

public record VoucherDetailModel
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public VoucherStatus Status { get; init; }
    public DateOnly WorkDate { get; init; }
    public int HoursWorked { get; init; }
    public decimal NetRemuneration { get; init; }
    public decimal IncomeTax { get; init; }
    public decimal CnasContribution { get; init; }
    public decimal GrossRemuneration { get; init; }
    public string WorkDistrict { get; init; } = string.Empty;
    public string WorkLocality { get; init; } = string.Empty;
    public string? WorkAddress { get; init; }
    public string? ActivityType { get; init; }
    public bool RspValidated { get; init; }
    public bool Art5Alin1LitB { get; init; }
    public bool Art5Alin1LitG { get; init; }
    public CancellationReasonCode? CancellationReason { get; init; }
    public string? CancellationNote { get; init; }
    public DateTimeOffset? CancellationDate { get; init; }
    public DateTimeOffset? ActivatedAt { get; init; }
    public DateTimeOffset? ExecutedAt { get; init; }
    public DateTimeOffset? ReportedAt { get; init; }
    public string? ReportPeriod { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public string? SignatureDataUrl { get; init; }
    public DateTimeOffset? SignedAt { get; init; }

    public WorkerModel Worker { get; init; } = null!;
    public BeneficiaryModel Beneficiary { get; init; } = null!;
}

public record VoucherCreatedSummary
{
    public int TotalVouchers { get; init; }
    public decimal TotalNet { get; init; }
    public decimal TotalGross { get; init; }
    public decimal TotalTax { get; init; }
    public decimal TotalCnas { get; init; }
    public List<VoucherTableItem> Vouchers { get; init; } = [];
}

public record VouchersQueryParams
{
    public int Offset { get; init; }
    public int Limit { get; init; } = 25;
    public VoucherStatus? Status { get; init; }
    public string? WorkerIdnp { get; init; }
    public string? Code { get; init; }
    public DateOnly? DateFrom { get; init; }
    public DateOnly? DateTo { get; init; }
    public string? District { get; init; }
    public string? Locality { get; init; }
    public Guid? BeneficiaryId { get; init; }
    public string? SortBy { get; init; }
    public bool SortDesc { get; init; }
}
