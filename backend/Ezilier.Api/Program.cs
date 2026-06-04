using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Ezilier.Application.Interfaces;
using Ezilier.Application.Services;
using Ezilier.Infrastructure.Persistence;
using Ezilier.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;

QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──
var dbProvider = builder.Configuration["Database:Provider"] ?? "Sqlite";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (dbProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
{
    connectionString ??= "Data Source=ezilier.db";
    builder.Services.AddDbContext<DataContext>(options => options.UseSqlite(connectionString));
}
else
{
    connectionString ??= "Host=localhost;Port=5432;Database=ezilier;Username=postgres;Password=postgres";
    builder.Services.AddDbContext<DataContext>(options =>
        options.UseNpgsql(connectionString, npgsql =>
        {
            npgsql.MigrationsAssembly(typeof(DataContext).Assembly.FullName);
        }));
}

builder.Services.AddScoped<IDataContext>(sp => sp.GetRequiredService<DataContext>());

// ── Authentication (JWT) ──
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "EzilierSuperSecretKeyForDevelopment2026!Min32Chars";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ezilier-api";

builder.Services.AddSingleton<ITokenService>(new TokenService(jwtSecret, jwtIssuer));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtIssuer,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── MediatR ──
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(Ezilier.Application.Handlers.Auth.LoginCommand).Assembly));

// ── Application Services ──
builder.Services.AddSingleton<ITaxCalculationService, TaxCalculationService>();
builder.Services.AddScoped<IRspVerificationService, MockRspVerificationService>();
builder.Services.AddScoped<IRsudService, MockRsudService>();
builder.Services.AddScoped<IIpc21PdfGenerator, Ipc21PdfGenerator>();

// ── Controllers & JSON ──
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// ── CORS ──
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:4401")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── Swagger ──
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "eZilier API",
        Version = "v1",
        Description = "API pentru Sistemul Informatic de Vouchere pentru Zilieri (SIVZ)"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── Apply migrations & seed on startup ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DataContext>();
    db.Database.EnsureCreated();

    // Lightweight schema sync for SQLite (no migrations infrastructure).
    // Safe to re-run: ALTER TABLE ADD COLUMN is a no-op if the column exists
    // (we catch and ignore the duplicate-column exception).
    foreach (var sql in new[]
    {
        "ALTER TABLE Vouchers ADD COLUMN SignatureDataUrl TEXT NULL",
        "ALTER TABLE Vouchers ADD COLUMN SignedAt TEXT NULL",
        "ALTER TABLE Vouchers ADD COLUMN ActivityType TEXT NULL",
        "ALTER TABLE Vouchers ADD COLUMN ReportedAt TEXT NULL",
        "ALTER TABLE Workers ADD COLUMN IsActive INTEGER NOT NULL DEFAULT 1",
        "ALTER TABLE Workers ADD COLUMN Email TEXT NULL",
        "DROP INDEX IF EXISTS IX_UserIdentities_UserId",
        "CREATE INDEX IF NOT EXISTS IX_UserIdentities_UserId ON UserIdentities (UserId)",
        "ALTER TABLE Vouchers ADD COLUMN WorkerPhone TEXT NULL",
        "ALTER TABLE Vouchers ADD COLUMN WorkerEmail TEXT NULL",
        "ALTER TABLE UserIdentities ADD COLUMN JobTitle TEXT NULL",
    })
    {
        try { db.Database.ExecuteSqlRaw(sql); }
        catch { /* column already exists */ }
    }

    await DataSeeder.SeedAsync(db);
}

// ── Pipeline ──
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "eZilier API v1"));
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<Ezilier.Api.Middleware.AuditLoggingMiddleware>();
app.MapControllers();

app.Run();
