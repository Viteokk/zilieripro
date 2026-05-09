using Ezilier.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ezilier.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Idnp).HasMaxLength(13).IsRequired();
        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(254);
        builder.Property(x => x.Phone).HasMaxLength(20);
        builder.Property(x => x.Language).HasMaxLength(5);

        builder.HasIndex(x => x.Idnp);
        builder.HasIndex(x => x.Email);

        builder.HasMany(x => x.Identities).WithOne(x => x.User).HasForeignKey(x => x.UserId);
    }
}

public class UserIdentityConfiguration : IEntityTypeConfiguration<UserIdentity>
{
    public void Configure(EntityTypeBuilder<UserIdentity> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PasswordHash).HasMaxLength(500);
        builder.Property(x => x.RefreshToken).HasMaxLength(500);
        builder.Property(x => x.AssignedDistricts).HasMaxLength(1000);

        builder.HasIndex(x => x.UserId);

        builder.HasOne(x => x.Role).WithMany(x => x.Users).HasForeignKey(x => x.RoleId);
        builder.HasOne(x => x.Beneficiary).WithMany(x => x.Users).HasForeignKey(x => x.BeneficiaryId);
    }
}

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);

        builder.HasIndex(x => x.Key).IsUnique();
    }
}

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);

        builder.HasOne(x => x.Role).WithMany(x => x.Permissions).HasForeignKey(x => x.RoleId);
    }
}

public class UserPermissionConfiguration : IEntityTypeConfiguration<UserPermission>
{
    public void Configure(EntityTypeBuilder<UserPermission> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.UserIdentityId, x.PermissionId }).IsUnique();

        builder.HasOne(x => x.UserIdentity).WithMany(x => x.Permissions).HasForeignKey(x => x.UserIdentityId);
        builder.HasOne(x => x.Permission).WithMany().HasForeignKey(x => x.PermissionId);
    }
}
