using Microsoft.EntityFrameworkCore;
using Startime.Api.Data;
using Startime.Api.Domain;
using Startime.Api.Middleware;
using Startime.Api.Services;

namespace Startime.Api.Routes;

public static class StarHubRoutes
{
    public static void MapStarHub(this WebApplication app)
    {
        var v1 = app.MapGroup("/api/v1");

        v1.MapGet("/demo/users", (AppDbContext db) =>
            db.Users.AsNoTracking().Where(u => u.Active).Select(u => new
            {
                u.Id,
                u.DisplayName,
                u.Username,
                roles = u.RolesCsv.Split(',', StringSplitOptions.RemoveEmptyEntries),
            }));

        v1.MapGet("/me", (HttpContext ctx, AppDbContext db) =>
        {
            var user = Current(ctx, db);
            var team = user.TeamId is null ? null : db.Teams.FirstOrDefault(t => t.Id == user.TeamId);
            return Results.Json(new
            {
                user.Id,
                displayName = user.DisplayName,
                givenName = user.DisplayName.Split(' ')[0],
                email = user.Email,
                roles = user.RolesCsv.Split(',', StringSplitOptions.RemoveEmptyEntries),
                team = team is null ? null : new { team.Id, team.Name },
                managerId = user.ManagerId,
            });
        });

        v1.MapGet("/me/absences", (HttpContext ctx, AppDbContext db, DateOnly? from, DateOnly? to) =>
        {
            var user = Current(ctx, db);
            var q = db.Absences.AsNoTracking().Where(a => a.UserId == user.Id);
            if (from is not null)
            {
                q = q.Where(a => (a.EndDate ?? a.StartDate) >= from);
            }

            if (to is not null)
            {
                q = q.Where(a => a.StartDate <= to);
            }

            return Results.Json(q.OrderByDescending(a => a.SubmittedAt).Select(a => MapAbsence(a, user, user, db)));
        });

        v1.MapGet("/me/log", (HttpContext ctx, AppDbContext db) =>
        {
            var user = Current(ctx, db);
            var audit = db.AuditLog.AsNoTracking()
                .Where(a => a.SubjectUserId == user.Id || a.ActorId == user.Id)
                .OrderByDescending(a => a.At)
                .Take(50)
                .Select(a => new { a.At, a.Action, a.Entity, a.EntityId });
            var access = db.AccessLog.AsNoTracking()
                .Where(a => a.SubjectUserId == user.Id)
                .OrderByDescending(a => a.At)
                .Take(50)
                .Select(a => new { a.At, a.ViewerId, a.Scope });
            return Results.Json(new { audit, access });
        });

        v1.MapPost("/absences/sick", async (HttpContext ctx, AbsenceService svc, AppDbContext db, SickBody body, CancellationToken ct) =>
        {
            try
            {
                var user = Current(ctx, db);
                var a = await svc.ReportSickAsync(user, body.StartDate, ct);
                return Results.Json(MapAbsence(a, user, user, db));
            }
            catch (ApiProblemException ex)
            {
                return Problem(ex);
            }
        });

        v1.MapPost("/absences/sick/{id:guid}/recover", async (HttpContext ctx, AbsenceService svc, AppDbContext db, Guid id, RecoverBody? body, CancellationToken ct) =>
        {
            try
            {
                var user = Current(ctx, db);
                var a = await svc.RecoverSickAsync(user, id, body?.EndDate, ct);
                return Results.Json(MapAbsence(a, user, user, db));
            }
            catch (ApiProblemException ex)
            {
                return Problem(ex);
            }
        });

        v1.MapPost("/absences/requests", async (HttpContext ctx, AbsenceService svc, AppDbContext db, RequestBody body, CancellationToken ct) =>
        {
            try
            {
                var user = Current(ctx, db);
                var type = body.Type.ToLowerInvariant() switch
                {
                    "day_off" => AbsenceType.DayOff,
                    "vacation" => AbsenceType.Vacation,
                    _ => throw new ApiProblemException("invalid_type", "Ugyldig type."),
                };
                var a = await svc.CreateRequestAsync(user, type, body.StartDate, body.EndDate, body.HalfDay, ct);
                return Results.Json(MapAbsence(a, user, user, db));
            }
            catch (ApiProblemException ex)
            {
                return Problem(ex);
            }
        });

        v1.MapPost("/absences/requests/{id:guid}/withdraw", async (HttpContext ctx, AbsenceService svc, AppDbContext db, Guid id, VersionBody body, CancellationToken ct) =>
        {
            try
            {
                var user = Current(ctx, db);
                await svc.WithdrawAsync(user, id, body.Version, ct);
                return Results.NoContent();
            }
            catch (ApiProblemException ex)
            {
                return Problem(ex);
            }
        });

        v1.MapGet("/absences/preview", (HttpContext ctx, AbsenceService svc, AppDbContext db, DateOnly start, DateOnly end, string? type) =>
        {
            var user = Current(ctx, db);
            var holidays = svc.GetHolidaySet();
            if (end < start)
            {
                return Problem(new ApiProblemException("invalid_range", "Slutdato skal være samme dag eller senere."));
            }

            var half = type == "day_off" && start == end;
            var days = WorkdayCalculator.CountWorkingDays(start, end, holidays, half);
            if (days <= 0)
            {
                return Problem(new ApiProblemException("no_working_days", "Perioden indeholder ingen arbejdsdage."));
            }

            var teamUserIds = db.Users.AsNoTracking()
                .Where(u => u.TeamId == user.TeamId && u.Id != user.Id)
                .Select(u => u.Id)
                .ToList();
            var overlap = db.Absences.AsNoTracking()
                .Where(a => teamUserIds.Contains(a.UserId))
                .Where(a => a.Status == AbsenceStatus.Pending || a.Status == AbsenceStatus.Approved)
                .Where(a => a.StartDate <= end && (a.EndDate ?? a.StartDate) >= start)
                .Join(db.Users.AsNoTracking(), a => a.UserId, u => u.Id, (a, u) => new { u, a })
                .AsEnumerable()
                .Select(x => new
                {
                    name = x.u.DisplayName,
                    kind = VisibilityService.CanSeeType(user, x.u, start, db)
                        ? x.a.Type.ToString().ToLowerInvariant()
                        : "absent",
                })
                .ToList();

            return Results.Json(new
            {
                workingDays = days,
                message = $"{days} arbejdsdage (weekender og helligdage tælles ikke med)",
                overlap,
            });
        });

        v1.MapGet("/approvals", (HttpContext ctx, AppDbContext db, string? status) =>
        {
            var user = Current(ctx, db);
            var st = status == "decided" ? AbsenceStatus.Approved : AbsenceStatus.Pending;
            var items = db.Absences.AsNoTracking()
                .Where(a => a.ApproverId == user.Id && a.Status == st && a.Type != AbsenceType.Sick)
                .Join(db.Users, a => a.UserId, u => u.Id, (a, u) => new { a, u })
                .AsEnumerable()
                .Select(x => new
                {
                    absence = MapAbsence(x.a, user, x.u, db),
                    employeeName = x.u.DisplayName,
                    submittedAt = x.a.SubmittedAt,
                });
            return Results.Json(items);
        });

        v1.MapPost("/approvals/{id:guid}/approve", async (HttpContext ctx, AbsenceService svc, AppDbContext db, Guid id, VersionBody body, CancellationToken ct) =>
        {
            try
            {
                await svc.ApproveAsync(Current(ctx, db), id, body.Version, ct);
                return Results.NoContent();
            }
            catch (ApiProblemException ex)
            {
                return Problem(ex);
            }
        });

        v1.MapPost("/approvals/{id:guid}/reject", async (HttpContext ctx, AbsenceService svc, AppDbContext db, Guid id, RejectBody body, CancellationToken ct) =>
        {
            try
            {
                await svc.RejectAsync(Current(ctx, db), id, body.Version, body.Reason, ct);
                return Results.NoContent();
            }
            catch (ApiProblemException ex)
            {
                return Problem(ex);
            }
        });

        v1.MapGet("/calendar", (HttpContext ctx, AppDbContext db, Guid? team_id, DateOnly from, DateOnly to) =>
        {
            var viewer = Current(ctx, db);
            var teamId = team_id ?? viewer.TeamId ?? SeedData.TeamItOps;
            var members = db.Users.AsNoTracking().Where(u => u.TeamId == teamId && u.Active).ToList();
            var absences = db.Absences.AsNoTracking()
                .Where(a => members.Select(m => m.Id).Contains(a.UserId))
                .Where(a => a.StartDate <= to && (a.EndDate ?? a.StartDate) >= from)
                .ToList();
            var holidays = db.Holidays.AsNoTracking().Where(h => h.Date >= from && h.Date <= to).ToDictionary(h => h.Date);

            var days = new List<object>();
            for (var d = from; d <= to; d = d.AddDays(1))
            {
                holidays.TryGetValue(d, out var h);
                days.Add(new
                {
                    date = d,
                    working = WorkdayCalculator.IsWorkingDay(d, holidays.Keys.ToHashSet()),
                    holidayName = h?.Name,
                });
            }

            var rows = members.Select(m =>
            {
                var cells = new List<object>();
                for (var d = from; d <= to; d = d.AddDays(1))
                {
                    var a = absences.FirstOrDefault(x => x.UserId == m.Id && x.StartDate <= d && (x.EndDate ?? x.StartDate) >= d);
                    string? kind = null;
                    var pending = false;
                    if (a is not null && a.Status is not AbsenceStatus.Withdrawn and not AbsenceStatus.Rejected)
                    {
                        pending = a.Status == AbsenceStatus.Pending;
                        var raw = a.Type switch
                        {
                            AbsenceType.Sick => "sick",
                            AbsenceType.DayOff => "day_off",
                            AbsenceType.Vacation => "vacation",
                            _ => null,
                        };
                        kind = raw is null ? null : VisibilityService.MaskKind(raw, VisibilityService.CanSeeType(viewer, m, d, db));
                        if (a.Status is AbsenceStatus.Withdrawn or AbsenceStatus.Rejected)
                        {
                            kind = null;
                        }
                    }

                    cells.Add(new { date = d, kind, pending, half = a?.HalfDay ?? false });
                }

                return new { userId = m.Id, name = m.DisplayName, cells };
            });

            return Results.Json(new { days, rows, teamId });
        });

        v1.MapGet("/teams", (HttpContext ctx, AppDbContext db) =>
        {
            _ = Current(ctx, db);
            return Results.Json(db.Teams.AsNoTracking().Select(t => new { t.Id, t.Name }));
        });

        v1.MapGet("/deputies", (HttpContext ctx, AppDbContext db) =>
        {
            var user = Current(ctx, db);
            return Results.Json(db.Deputies.AsNoTracking().Where(d => d.ManagerId == user.Id));
        });

        v1.MapPut("/deputies", async (HttpContext ctx, AppDbContext db, List<DeputyBody> body, CancellationToken ct) =>
        {
            var user = Current(ctx, db);
            var existing = db.Deputies.Where(d => d.ManagerId == user.Id);
            db.Deputies.RemoveRange(existing);
            foreach (var d in body)
            {
                db.Deputies.Add(new Deputy
                {
                    ManagerId = user.Id,
                    DeputyId = d.DeputyId,
                    ValidFrom = d.ValidFrom,
                    ValidTo = d.ValidTo,
                });
            }

            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        v1.MapGet("/admin/users", (HttpContext ctx, AppDbContext db, string? q, string? status) =>
        {
            RequireAdmin(ctx, db);
            var users = db.Users.AsNoTracking().AsEnumerable();
            if (status == "active")
            {
                users = users.Where(u => u.Active);
            }
            else if (status == "inactive")
            {
                users = users.Where(u => !u.Active);
            }

            if (!string.IsNullOrWhiteSpace(q))
            {
                users = users.Where(u => u.DisplayName.Contains(q, StringComparison.OrdinalIgnoreCase) || u.Username.Contains(q, StringComparison.OrdinalIgnoreCase));
            }

            return Results.Json(users.Select(u => new
            {
                u.Id,
                u.DisplayName,
                u.Username,
                u.Email,
                u.TeamId,
                u.ManagerId,
                u.Active,
                roles = u.RolesCsv.Split(',', StringSplitOptions.RemoveEmptyEntries),
            }));
        });

        v1.MapGet("/admin/holidays", (HttpContext ctx, AppDbContext db, int? year) =>
        {
            RequireAdmin(ctx, db);
            var y = year ?? DateTime.Now.Year;
            var from = new DateOnly(y, 1, 1);
            var to = new DateOnly(y, 12, 31);
            return Results.Json(db.Holidays.AsNoTracking().Where(h => h.Date >= from && h.Date <= to).OrderBy(h => h.Date));
        });

        v1.MapPut("/admin/holidays/{date}", async (HttpContext ctx, AppDbContext db, DateOnly date, HolidayBody body, CancellationToken ct) =>
        {
            RequireAdmin(ctx, db);
            db.Holidays.Add(new Holiday { Date = date, Name = body.Name, Kind = body.Kind ?? "public" });
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        v1.MapDelete("/admin/holidays/{date}", async (HttpContext ctx, AppDbContext db, DateOnly date, CancellationToken ct) =>
        {
            RequireAdmin(ctx, db);
            var h = db.Holidays.FirstOrDefault(x => x.Date == date);
            if (h is not null)
            {
                db.Holidays.Remove(h);
                await db.SaveChangesAsync(ct);
            }

            return Results.NoContent();
        });

        v1.MapGet("/admin/audit", (HttpContext ctx, AppDbContext db) =>
        {
            RequireAdmin(ctx, db);
            return Results.Json(db.AuditLog.AsNoTracking().OrderByDescending(a => a.At).Take(100)
                .Select(a => new { a.At, a.Action, a.Entity, a.EntityId, a.ActorId, a.SubjectUserId }));
        });
    }

    private static UserEntity Current(HttpContext ctx, AppDbContext db) =>
        db.Users.First(u => u.Id == HttpContextUser.GetUserId(ctx));

    private static void RequireAdmin(HttpContext ctx, AppDbContext db)
    {
        var u = Current(ctx, db);
        if (!u.RolesCsv.Contains(RoleNames.Admin))
        {
            throw new ApiProblemException("forbidden", "Kræver administrator.");
        }
    }

    private static IResult Problem(ApiProblemException ex) =>
        Results.Json(new { code = ex.Code, detail = ex.Message }, statusCode: ex.Code switch
        {
            "forbidden" => 403,
            "overlap" or "version_conflict" => 409,
            _ => 422,
        });

    private static object MapAbsence(Absence a, UserEntity viewer, UserEntity subject, AppDbContext db)
    {
        var canSee = VisibilityService.CanSeeType(viewer, subject, a.StartDate, db);
        var type = a.Type switch
        {
            AbsenceType.Sick => canSee ? "sick" : "absent",
            AbsenceType.DayOff => "day_off",
            AbsenceType.Vacation => "vacation",
            _ => "absent",
        };
        if (a.Status is AbsenceStatus.Withdrawn or AbsenceStatus.Rejected && viewer.Id != subject.Id && !canSee)
        {
            type = "hidden";
        }

        return new
        {
            a.Id,
            type,
            status = a.Status.ToString().ToLowerInvariant(),
            a.StartDate,
            a.EndDate,
            a.HalfDay,
            a.Version,
            a.SubmittedAt,
            rejectionReason = viewer.Id == subject.Id ? a.RejectionReason : null,
        };
    }

    private sealed record SickBody(DateOnly StartDate);
    private sealed record RecoverBody(DateOnly? EndDate);
    private sealed record RequestBody(string Type, DateOnly StartDate, DateOnly EndDate, bool HalfDay);
    private sealed record VersionBody(int Version);
    private sealed record RejectBody(int Version, string Reason);
    private sealed record DeputyBody(Guid DeputyId, DateOnly ValidFrom, DateOnly? ValidTo);
    private sealed record HolidayBody(string Name, string? Kind);
}
