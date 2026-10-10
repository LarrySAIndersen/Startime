using System.Collections.Concurrent;
using Startime.Api.Models;

namespace Startime.Api.Services;

public sealed class VacationRequestStore
{
    private readonly ConcurrentDictionary<Guid, VacationRequest> _items = new();

    public VacationRequest Add(string employeeName, DateOnly start, DateOnly end, int workingDays)
    {
        var item = new VacationRequest
        {
            EmployeeName = employeeName,
            StartDate = start,
            EndDate = end,
            WorkingDays = workingDays,
        };
        _items[item.Id] = item;
        return item;
    }

    public IReadOnlyList<VacationRequest> ListForEmployee(string employeeName) =>
        _items.Values
            .Where(v => v.EmployeeName == employeeName)
            .OrderByDescending(v => v.CreatedAt)
            .ToList();

    public bool TryWithdraw(Guid id, string employeeName, out VacationRequest? updated)
    {
        updated = null;
        if (!_items.TryGetValue(id, out var item) || item.EmployeeName != employeeName)
        {
            return false;
        }

        if (item.Status != VacationRequestStatus.Pending)
        {
            return false;
        }

        item.Status = VacationRequestStatus.Withdrawn;
        updated = item;
        return true;
    }
}
