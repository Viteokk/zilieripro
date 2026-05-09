namespace Ezilier.Domain.Entities;

public class User : EntityBase
{
    public string Idnp { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Language { get; set; } = "ro";

    public virtual IList<UserIdentity> Identities { get; set; } = [];
}
