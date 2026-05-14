namespace Ezilier.Application.Models;

public record BeneficiaryModel
{
    public Guid Id { get; init; }
    public string Idno { get; init; } = string.Empty;
    public string CompanyName { get; init; } = string.Empty;
    public string? LegalForm { get; init; }
    public string? ActivityType { get; init; }
    public string? Address { get; init; }
    public string? District { get; init; }
    public string? Locality { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public int WorkerCount { get; init; }
    public int VoucherCount { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}

public record RegisterBeneficiaryRequest
{
    public string Idno { get; init; } = string.Empty;
}

public record CreateBeneficiaryRequest
{
    public string? CompanyName { get; init; }
    public string? Idno { get; init; }
    public string? LegalForm { get; init; }
    public string? ActivityType { get; init; }
    public string? Address { get; init; }
    public string? District { get; init; }
    public string? Locality { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
}
