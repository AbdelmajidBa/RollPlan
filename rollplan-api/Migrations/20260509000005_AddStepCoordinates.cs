using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RollPlan.Api.Migrations
{
    public partial class AddStepCoordinates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "latitude",
                table: "steps",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "longitude",
                table: "steps",
                type: "double precision",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "latitude", table: "steps");
            migrationBuilder.DropColumn(name: "longitude", table: "steps");
        }
    }
}
