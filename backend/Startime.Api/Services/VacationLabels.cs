using System.Globalization;
using Startime.Api.Models;

namespace Startime.Api.Services;

public static class VacationLabels
{
    private static readonly CultureInfo Da = CultureInfo.GetCultureInfo("da-DK");

    public static string FormatDateLabel(DateOnly start, DateOnly end, int workingDays)
    {
        if (start == end)
        {
            return $"{FormatShort(start)} · 1 arbejdsdag";
        }

        return $"{FormatShort(start)} – {FormatShort(end)} · {workingDays} arbejdsdage";
    }

    public static VacationRequestResponse ToResponse(VacationRequest r) =>
        new(
            r.Id,
            r.EmployeeName,
            r.StartDate,
            r.EndDate,
            r.WorkingDays,
            r.Status.ToString().ToLowerInvariant(),
            r.CreatedAt,
            FormatDateLabel(r.StartDate, r.EndDate, r.WorkingDays));

    private static string FormatShort(DateOnly d)
    {
        var dt = d.ToDateTime(TimeOnly.MinValue);
        var weekday = Da.DateTimeFormat.GetAbbreviatedDayName(dt.DayOfWeek);
        if (weekday.Length > 0)
        {
            weekday = char.ToUpper(weekday[0]) + weekday[1..];
        }

        return $"{weekday} {d.Day}. {Da.DateTimeFormat.GetMonthName(d.Month).ToLowerInvariant()}";
    }
}
