using Microsoft.EntityFrameworkCore;
using Startime.Api.Data;
using Startime.Api.Middleware;
using Startime.Api.Routes;
using Startime.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var dbPath = Environment.GetEnvironmentVariable("STARHUB_DB")
    ?? Path.Combine("/workspace", ".local", "starhub.db");
Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(dbPath))!);

builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite($"Data Source={dbPath}"));
builder.Services.AddSingleton<AuditService>();
builder.Services.AddScoped<AbsenceService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins(
                "http://localhost:4319",
                "http://127.0.0.1:4319",
                "http://0.0.0.0:4319")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    SeedData.Ensure(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseMiddleware<DemoAuthMiddleware>();

var wwwroot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(wwwroot))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.MapGet("/api/health", () => Results.Json(new
{
    ok = true,
    service = "star-hub-api",
    timestamp = DateTime.UtcNow,
}));

app.MapGet("/healthz", () => Results.Json(new { status = "ok" }));
app.MapGet("/readyz", () => Results.Json(new { status = "ready" }));

app.MapStarHub();

if (Directory.Exists(wwwroot))
{
    app.MapFallbackToFile("index.html");
}

app.Run();
