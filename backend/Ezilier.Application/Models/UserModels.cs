using Ezilier.Domain.Enums;

namespace Ezilier.Application.Models;

public record UserTableItem
{
    public Guid Id { get; init; }
    public string Idnp { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string RoleName { get; init; } = string.Empty;
    public string? JobTitle { get; init; }
    public UserStatus Status { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}

public record UserDetailModel
{
    public Guid Id { get; init; }
    public string Idnp { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public DateOnly? BirthDate { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Language { get; init; }
    public UserStatus Status { get; init; }
    public string RoleName { get; init; } = string.Empty;
    public Guid RoleId { get; init; }
    public Guid? BeneficiaryId { get; init; }
    public string? BeneficiaryName { get; init; }
    public string? AssignedDistricts { get; init; }
    public string? JobTitle { get; init; }
    public List<string> Permissions { get; init; } = [];
    public DateTimeOffset CreatedAt { get; init; }
}

public record CreateUserRequest
{
    public string Idnp { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Language { get; init; }
    public string Password { get; init; } = string.Empty;
    public Guid RoleId { get; init; }
    public Guid? BeneficiaryId { get; init; }
    public string? AssignedDistricts { get; init; }
    public string? JobTitle { get; init; }
    public List<Guid> PermissionIds { get; init; } = [];
}

public record UpdateUserRequest
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Language { get; init; }
    public Guid? RoleId { get; init; }
    public Guid? BeneficiaryId { get; init; }
    public string? AssignedDistricts { get; init; }
    public string? JobTitle { get; init; }
    public List<Guid>? PermissionIds { get; init; }
}

public record ChangeUserStatusRequest
{
    public UserStatus Status { get; init; }
}

public record UsersQueryParams
{
    public int Offset { get; init; }
    public int Limit { get; init; } = 25;
    public string? Search { get; init; }
    public string? Role { get; init; }
    public UserStatus? Status { get; init; }
}
