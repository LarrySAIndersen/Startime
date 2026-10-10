using Startime.Api.Models;
using Startime.Api.Services;

namespace Startime.Api.Routes;

public static class VacationRoutes
{
    private const string DemoEmployee = "Jan Vinding";

    public static void MapVacationRoutes(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/vacation-requests");

        group.MapPost("/preview", (VacationPreviewBody body) =>
        {
            if (body.EndDate < body.StartDate)
            {
                return Results.BadRequest(new { code = "invalid_range", detail = "Slutdato skal være samme dag eller senere." });
            }

            var days = WorkdayCalculator.CountWorkingDays(body.StartDate, body.EndDate);
            if (days == 0)
            {
                return Results.BadRequest(new { code = "no_working_days", detail = "Perioden indeholder ingen arbejdsdage." });
            }

            var message = $"{days} arbejdsdage (weekender og helligdage tælles ikke med)";
            return Results.Json(new VacationPreviewResponse(days, message));
        });

        group.MapGet("/", (VacationRequestStore store) =>
        {
            var list = store.ListForEmployee(DemoEmployee).Select(VacationLabels.ToResponse);
            return Results.Json(list);
        });

        group.MapPost("/", (CreateVacationRequestBody body, VacationRequestStore store) =>
        {
            if (body.EndDate < body.StartDate)
            {
                return Results.BadRequest(new { code = "invalid_range", detail = "Slutdato skal være samme dag eller senere." });
            }

            var days = WorkdayCalculator.CountWorkingDays(body.StartDate, body.EndDate);
            if (days == 0)
            {
                return Results.BadRequest(new { code = "no_working_days", detail = "Perioden indeholder ingen arbejdsdage." });
            }

            var created = store.Add(DemoEmployee, body.StartDate, body.EndDate, days);
            return Results.Created($"/api/v1/vacation-requests/{created.Id}", VacationLabels.ToResponse(created));
        });

        group.MapPost("/{id:guid}/withdraw", (Guid id, VacationRequestStore store) =>
        {
            if (!store.TryWithdraw(id, DemoEmployee, out var updated) || updated is null)
            {
                return Results.NotFound(new { detail = "Anmodningen findes ikke eller kan ikke trækkes tilbage." });
            }

            return Results.Json(VacationLabels.ToResponse(updated));
        });
    }
}
