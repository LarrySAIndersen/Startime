using Startime.Api.Domain;

namespace Startime.Api.Data;

public class Team
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public Guid? ParentTeamId { get; set; }
    public Guid? LeadUserId { get; set; }
}

public class UserEntity
{
    public Guid Id { get; set; }
    public string KeycloakSub { get; set; } = "";
    public string Username { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Email { get; set; } = "";
    public Guid? TeamId { get; set; }
    public Guid? ManagerId { get; set; }
    public bool Active { get; set; } = true;
    public DateTimeOffset? DeactivatedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string RolesCsv { get; set; } = RoleNames.Employee;
}

public class Deputy
{
    public Guid Id { get; set; }
    public Guid ManagerId { get; set; }
    public Guid DeputyId { get; set; }
    public DateOnly ValidFrom { get; set; }
    public DateOnly? ValidTo { get; set; }
}

public class Absence
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public AbsenceType Type { get; set; }
    public AbsenceStatus Status { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool HalfDay { get; set; }
    public Guid? ApproverId { get; set; }
    public Guid? DecidedBy { get; set; }
    public DateTimeOffset? DecidedAt { get; set; }
    public string? RejectionReason { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;
    public int Version { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class Holiday
{
    public DateOnly Date { get; set; }
    public string Name { get; set; } = "";
    public string Kind { get; set; } = "public";
}

public class NotificationOutbox
{
    public Guid Id { get; set; }
    public Guid RecipientUserId { get; set; }
    public string Template { get; set; } = "";
    public string LinkPath { get; set; } = "";
    public string Status { get; set; } = "queued";
    public int Attempts { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class AuditLogEntry
{
    public long Id { get; set; }
    public DateTimeOffset At { get; set; } = DateTimeOffset.UtcNow;
    public Guid? ActorId { get; set; }
    public string Action { get; set; } = "";
    public string Entity { get; set; } = "";
    public Guid? EntityId { get; set; }
    public Guid? SubjectUserId { get; set; }
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public byte[]? PrevHash { get; set; }
    public byte[] Hash { get; set; } = [];
}

public class AccessLogEntry
{
    public long Id { get; set; }
    public DateTimeOffset At { get; set; } = DateTimeOffset.UtcNow;
    public Guid ViewerId { get; set; }
    public Guid SubjectUserId { get; set; }
    public string Scope { get; set; } = "";
    public string RequestId { get; set; } = "";
}
