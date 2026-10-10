namespace Startime.Api.Domain;

public static class WorkdayCalculator
{
    public static bool IsWorkingDay(DateOnly date, HashSet<DateOnly> holidays) =>
        date.DayOfWeek is not (DayOfWeek.Saturday or DayOfWeek.Sunday) && !holidays.Contains(date);

    public static decimal CountWorkingDays(DateOnly start, DateOnly end, HashSet<DateOnly> holidays, bool halfDay)
    {
        if (end < start)
        {
            return 0;
        }

        decimal total = 0;
        for (var d = start; d <= end; d = d.AddDays(1))
        {
            if (IsWorkingDay(d, holidays))
            {
                total += 1;
            }
        }

        if (halfDay && start == end && total > 0)
        {
            return 0.5m;
        }

        return total;
    }

    public static int CountWorkingDaysBack(DateOnly from, int maxBack, HashSet<DateOnly> holidays)
    {
        var count = 0;
        var d = from;
        while (count < maxBack)
        {
            d = d.AddDays(-1);
            if (IsWorkingDay(d, holidays))
            {
                count++;
            }
        }

        return count;
    }
}
