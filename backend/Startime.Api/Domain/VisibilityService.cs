using Startime.Api.Data;

namespace Startime.Api.Domain;

public static class VisibilityService
{
    public static bool CanSeeType(UserEntity viewer, UserEntity subject, DateOnly date, AppDbContext db)
    {
        if (viewer.Id == subject.Id)
        {
            return true;
        }

        if (viewer.RolesCsv.Split(',').Contains(RoleNames.Admin))
        {
            return false;
        }

        if (IsApproverOf(viewer, subject, date, db))
        {
            return true;
        }

        return IsDepartmentLeadOf(viewer, subject, db);
    }

    public static string MaskKind(string kind, bool canSee) =>
        kind == "sick" && !canSee ? "absent" : kind;

    private static bool IsApproverOf(UserEntity viewer, UserEntity subject, DateOnly date, AppDbContext db)
    {
        if (subject.ManagerId == viewer.Id && !IsUserAbsent(viewer.Id, date, db))
        {
            return true;
        }

        if (subject.ManagerId is null)
        {
            return false;
        }

        var deputy = db.Deputies.FirstOrDefault(d =>
            d.ManagerId == subject.ManagerId &&
            d.DeputyId == viewer.Id &&
            d.ValidFrom <= date &&
            (d.ValidTo == null || d.ValidTo >= date));
        if (deputy is not null)
        {
            return true;
        }

        return false;
    }

    private static bool IsDepartmentLeadOf(UserEntity viewer, UserEntity subject, AppDbContext db)
    {
        if (subject.TeamId is null)
        {
            return false;
        }

        var team = db.Teams.FirstOrDefault(t => t.Id == subject.TeamId);
        while (team is not null)
        {
            if (team.LeadUserId == viewer.Id)
            {
                return true;
            }

            team = team.ParentTeamId is null
                ? null
                : db.Teams.FirstOrDefault(t => t.Id == team.ParentTeamId);
        }

        return false;
    }

    private static bool IsUserAbsent(Guid userId, DateOnly date, AppDbContext db)
    {
        return db.Absences.Any(a =>
            a.UserId == userId &&
            a.StartDate <= date &&
            (a.EndDate == null || a.EndDate >= date) &&
            ((a.Type == AbsenceType.Sick && a.Status == AbsenceStatus.Registered && a.EndDate == null) ||
             (a.Status == AbsenceStatus.Approved && a.Type != AbsenceType.Sick)));
    }
}
