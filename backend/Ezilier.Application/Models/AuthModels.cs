namespace Ezilier.Application.Models;

public record LoginRequest(string Idnp, string Password);

public record CompanyInfo(Guid BeneficiaryId, string CompanyName, string Idno);

public record SwitchCompanyRequest(Guid BeneficiaryId);

public record LoginResponse(
    string Token,
    string RefreshToken,
    DateTimeOffset ExpiresAt,
    UserInfoModel User,
    List<CompanyInfo> AvailableCompanies
);

public record RefreshTokenRequest(string RefreshToken);

public record UserInfoModel(
    Guid Id,
    string Idnp,
    string FirstName,
    string LastName,
    string? Email,
    string Role,
    string RoleType,
    Guid? BeneficiaryId,
    string? BeneficiaryName,
    List<string> Permissions
);
