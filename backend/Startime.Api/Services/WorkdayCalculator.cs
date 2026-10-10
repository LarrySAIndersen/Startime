namespace Startime.Api.Services;

public static class WorkdayCalculator
{
    /// <summary>Weekends excluded; public holidays can be added in a later task.</summary>
    public static int CountWorkingDays(DateOnly start, DateOnly end)
    {
        if (end < start)
        {
            return 0;
        }

        var count = 0;
        for (var d = start; d <= end; d = d.AddDays(1))
        {
            if (d.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            {
                continue;
            }

            count++;
        }

        return count;
    }
}
