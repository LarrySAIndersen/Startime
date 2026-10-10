namespace Startime.Api.Domain;

public enum AbsenceType
{
    Sick,
    DayOff,
    Vacation,
}

public enum AbsenceStatus
{
    Registered,
    Pending,
    Approved,
    Rejected,
    Withdrawn,
    Cancelled,
}

public static class RoleNames
{
    public const string Employee = "employee";
    public const string Manager = "manager";
    public const string Admin = "admin";
    public const string DepartmentLead = "department_lead";
}
