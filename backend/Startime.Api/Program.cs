var builder = WebApplication.CreateBuilder(args);

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.MapGet("/api/health", () => Results.Json(new
{
    ok = true,
    service = "startime-api",
    timestamp = DateTime.UtcNow,
}))
.WithName("Health")
.WithOpenApi();

app.MapGet("/api/status", () => Results.Json(new
{
    app = "Startime",
    stack = new[] { "React", ".NET 8" },
    message = "Frontend og API kører.",
}))
.WithName("Status")
.WithOpenApi();

app.Run();
