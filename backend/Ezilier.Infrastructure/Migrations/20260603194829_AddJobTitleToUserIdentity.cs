using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ezilier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJobTitleToUserIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WorkerEmail",
                table: "Vouchers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkerPhone",
                table: "Vouchers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JobTitle",
                table: "UserIdentities",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WorkerEmail",
                table: "Vouchers");

            migrationBuilder.DropColumn(
                name: "WorkerPhone",
                table: "Vouchers");

            migrationBuilder.DropColumn(
                name: "JobTitle",
                table: "UserIdentities");
        }
    }
}
