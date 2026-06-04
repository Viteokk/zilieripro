using Ezilier.Domain.Enums;

namespace Ezilier.Domain.Entities;

public class UserIdentity : EntityBase
{
    public Guid UserId { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public string? PasswordHash { get; set; }
    public string? RefreshToken { get; set; }
    public DateTimeOffset? RefreshTokenExpiresAt { get; set; }

    public Guid RoleId { get; set; }
    public Guid? BeneficiaryId { get; set; }

    public string? AssignedDistricts { get; set; }
    public string? JobTitle { get; set; }

    public virtual User User { get; set; } = null!;
    public virtual Role Role { get; set; } = null!;
    public virtual Beneficiary? Beneficiary { get; set; }
    public virtual IList<UserPermission> Permissions { get; set; } = [];
}
