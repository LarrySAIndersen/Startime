using Microsoft.EntityFrameworkCore;
using Startime.Api.Data;
using Startime.Api.Domain;

namespace Startime.Api.Services;

public sealed class AbsenceService(AppDbContext db, AuditService audit)
{
    public HashSet<DateOnly> GetHolidaySet() =>
        db.Holidays.AsNoTracking().Select(h => h.Date).ToHashSet();

    public UserEntity RequireUser(Guid id) =>
        db.Users.First(u => u.Id == id && u.Active);

    public Guid ResolveApproverId(UserEntity employee, DateOnly onDate)
    {
        if (employee.ManagerId is null)
        {
            return employee.Id;
        }

        var manager = db.Users.First(u => u.Id == employee.ManagerId);
        if (!IsAbsent(manager.Id, onDate))
        {
            return manager.Id;
        }

        var deputy = db.Deputies.FirstOrDefault(d =>
            d.ManagerId == manager.Id &&
            d.ValidFrom <= onDate &&
            (d.ValidTo == null || d.ValidTo >= onDate));
        if (deputy is not null)
        {
            return deputy.DeputyId;
        }

        return manager.Id;
    }

    public bool IsAbsent(Guid userId, DateOnly date) =>
        db.Absences.Any(a =>
            a.UserId == userId &&
            ((a.Type == AbsenceType.Sick && a.Status == AbsenceStatus.Registered && a.EndDate == null) ||
             (a.Status == AbsenceStatus.Approved && a.StartDate <= date && (a.EndDate == null || a.EndDate >= date))));

    public async Task<Absence> ReportSickAsync(UserEntity actor, DateOnly startDate, CancellationToken ct)
    {
        var holidays = GetHolidaySet();
        var today = DateOnly.FromDateTime(DateTime.Now);
        if (startDate > today)
        {
            throw new ApiProblemException("invalid_date", "Vælg en startdato.");
        }

        var earliest = today;
        for (var i = 0; i < 3; i++)
        {
            earliest = earliest.AddDays(-1);
            while (!WorkdayCalculator.IsWorkingDay(earliest, holidays))
            {
                earliest = earliest.AddDays(-1);
            }
        }

        if (startDate < earliest)
        {
            throw new ApiProblemException("invalid_date", "Startdato er for langt tilbage.");
        }

        if (db.Absences.Any(a => a.UserId == actor.Id && a.Type == AbsenceType.Sick && a.Status == AbsenceStatus.Registered))
        {
            throw new ApiProblemException("overlap", "Du har allerede en åben sygemelding.");
        }

        var absence = new Absence
        {
            UserId = actor.Id,
            Type = AbsenceType.Sick,
            Status = AbsenceStatus.Registered,
            StartDate = startDate,
            EndDate = null,
            CreatedBy = actor.Id,
        };
        db.Absences.Add(absence);
        await db.SaveChangesAsync(ct);
        await audit.RecordAsync(actor.Id, "absence.create", "absence", absence.Id, actor.Id, null, absence, ct);
        await EnqueueAsync(absence.ApproverId ?? ResolveApproverId(actor, startDate), "absence_reported", "/overblik", ct);
        return absence;
    }

    public async Task<Absence> RecoverSickAsync(UserEntity actor, Guid id, DateOnly? endDate, CancellationToken ct)
    {
        var absence = db.Absences.First(a => a.Id == id && a.UserId == actor.Id && a.Type == AbsenceType.Sick);
        var end = endDate ?? DateOnly.FromDateTime(DateTime.Now);
        if (end < absence.StartDate || end > DateOnly.FromDateTime(DateTime.Now))
        {
            throw new ApiProblemException("invalid_date", "Ugyldig slutdato.");
        }

        absence.EndDate = end;
        absence.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.RecordAsync(actor.Id, "absence.recover", "absence", absence.Id, actor.Id, null, absence, ct);
        return absence;
    }

    public async Task<Absence> CreateRequestAsync(
        UserEntity actor,
        AbsenceType type,
        DateOnly start,
        DateOnly end,
        bool halfDay,
        CancellationToken ct)
    {
        var holidays = GetHolidaySet();
        if (end < start)
        {
            throw new ApiProblemException("invalid_range", "Slutdato skal være samme dag eller senere.");
        }

        if (halfDay && (type != AbsenceType.DayOff || start != end))
        {
            throw new ApiProblemException("invalid_half_day", "Halv dag gælder kun fri på én dag.");
        }

        var days = WorkdayCalculator.CountWorkingDays(start, end, holidays, halfDay);
        if (days <= 0)
        {
            throw new ApiProblemException("no_working_days", "Perioden indeholder ingen arbejdsdage.");
        }

        if (HasOverlap(actor.Id, type, start, end))
        {
            throw new ApiProblemException("overlap", "Perioden overlapper en anden anmodning.");
        }

        var approverId = ResolveApproverId(actor, start);
        var absence = new Absence
        {
            UserId = actor.Id,
            Type = type,
            Status = AbsenceStatus.Pending,
            StartDate = start,
            EndDate = end,
            HalfDay = halfDay,
            ApproverId = approverId,
            CreatedBy = actor.Id,
        };
        db.Absences.Add(absence);
        await db.SaveChangesAsync(ct);
        await audit.RecordAsync(actor.Id, "absence.request", "absence", absence.Id, actor.Id, null, absence, ct);
        await EnqueueAsync(approverId, "request_submitted", "/godkendelser", ct);
        return absence;
    }

    public bool HasOverlap(Guid userId, AbsenceType type, DateOnly start, DateOnly end)
    {
        if (type == AbsenceType.Sick)
        {
            return false;
        }

        return db.Absences.Any(a =>
            a.UserId == userId &&
            a.Type != AbsenceType.Sick &&
            (a.Status == AbsenceStatus.Pending || a.Status == AbsenceStatus.Approved) &&
            a.StartDate <= end &&
            (a.EndDate ?? a.StartDate) >= start);
    }

    public async Task ApproveAsync(UserEntity actor, Guid id, int version, CancellationToken ct)
    {
        var absence = db.Absences.First(a => a.Id == id);
        EnsureApprover(actor, absence);
        if (absence.Version != version)
        {
            throw new ApiProblemException("version_conflict", "Anmodningen er ændret. Genindlæs siden.");
        }

        if (absence.UserId == actor.Id)
        {
            throw new ApiProblemException("not_approver", "Du kan ikke godkende din egen anmodning.");
        }

        absence.Status = AbsenceStatus.Approved;
        absence.DecidedBy = actor.Id;
        absence.DecidedAt = DateTimeOffset.UtcNow;
        absence.Version++;
        absence.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.RecordAsync(actor.Id, "absence.approve", "absence", absence.Id, absence.UserId, null, absence, ct);
        await EnqueueAsync(absence.UserId, "request_decided", "/overblik", ct);
    }

    public async Task RejectAsync(UserEntity actor, Guid id, int version, string reason, CancellationToken ct)
    {
        reason = reason.Trim();
        if (reason.Length < 5 || reason.Length > 500)
        {
            throw new ApiProblemException("reason_required", "Skriv en kort begrundelse.");
        }

        var absence = db.Absences.First(a => a.Id == id);
        EnsureApprover(actor, absence);
        if (absence.Version != version)
        {
            throw new ApiProblemException("version_conflict", "Anmodningen er ændret. Genindlæs siden.");
        }

        absence.Status = AbsenceStatus.Rejected;
        absence.RejectionReason = reason;
        absence.DecidedBy = actor.Id;
        absence.DecidedAt = DateTimeOffset.UtcNow;
        absence.Version++;
        absence.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.RecordAsync(actor.Id, "absence.reject", "absence", absence.Id, absence.UserId, null, absence, ct);
        await EnqueueAsync(absence.UserId, "request_decided", "/overblik", ct);
    }

    public async Task WithdrawAsync(UserEntity actor, Guid id, int version, CancellationToken ct)
    {
        var absence = db.Absences.First(a => a.Id == id && a.UserId == actor.Id);
        if (absence.Status != AbsenceStatus.Pending || absence.Version != version)
        {
            throw new ApiProblemException("version_conflict", "Kan ikke trække tilbage.");
        }

        absence.Status = AbsenceStatus.Withdrawn;
        absence.Version++;
        absence.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.RecordAsync(actor.Id, "absence.withdraw", "absence", absence.Id, actor.Id, null, absence, ct);
    }

    private void EnsureApprover(UserEntity actor, Absence absence)
    {
        if (absence.Status != AbsenceStatus.Pending || absence.ApproverId != actor.Id)
        {
            var employee = db.Users.First(u => u.Id == absence.UserId);
            if (!VisibilityService.CanSeeType(actor, employee, absence.StartDate, db) ||
                !actor.RolesCsv.Contains(RoleNames.Manager))
            {
                throw new ApiProblemException("not_approver", "Du er ikke godkender for denne anmodning.");
            }
        }
    }

    private async Task EnqueueAsync(Guid recipientId, string template, string link, CancellationToken ct)
    {
        db.NotificationOutbox.Add(new NotificationOutbox
        {
            RecipientUserId = recipientId,
            Template = template,
            LinkPath = link,
        });
        await db.SaveChangesAsync(ct);
    }
}

public sealed class ApiProblemException(string code, string detail) : Exception(detail)
{
    public string Code { get; } = code;
}
