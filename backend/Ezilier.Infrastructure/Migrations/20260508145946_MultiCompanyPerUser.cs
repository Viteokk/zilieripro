using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ezilier.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MultiCompanyPerUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserIdentities_UserId",
                table: "UserIdentities");

            migrationBuilder.CreateIndex(
                name: "IX_UserIdentities_UserId",
                table: "UserIdentities",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserIdentities_UserId",
                table: "UserIdentities");

            migrationBuilder.CreateIndex(
                name: "IX_UserIdentities_UserId",
                table: "UserIdentities",
                column: "UserId",
                unique: true);
        }
    }
}
