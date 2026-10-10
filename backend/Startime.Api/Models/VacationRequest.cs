namespace Startime.Api.Models;

public enum VacationRequestStatus
{
    Pending,
    Approved,
    Rejected,
    Withdrawn,
}

public sealed class VacationRequest
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string EmployeeName { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public int WorkingDays { get; init; }
    public VacationRequestStatus Status { get; set; } = VacationRequestStatus.Pending;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed record CreateVacationRequestBody(DateOnly StartDate, DateOnly EndDate);

public sealed record VacationPreviewBody(DateOnly StartDate, DateOnly EndDate);

public sealed record VacationRequestResponse(
    Guid Id,
    string EmployeeName,
    DateOnly StartDate,
    DateOnly EndDate,
    int WorkingDays,
    string Status,
    DateTimeOffset CreatedAt,
    string DateLabel);

public sealed record VacationPreviewResponse(int WorkingDays, string Message);
