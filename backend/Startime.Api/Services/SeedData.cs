using Startime.Api.Data;
using Startime.Api.Domain;

namespace Startime.Api.Services;

public static class SeedData
{
    public static readonly Guid TeamItOps = Guid.Parse("11111111-1111-4111-8111-111111111101");
    public static readonly Guid UserJan = Guid.Parse("22222222-2222-4222-8222-222222222201");
    public static readonly Guid UserLars = Guid.Parse("22222222-2222-4222-8222-222222222202");
    public static readonly Guid UserAhmed = Guid.Parse("22222222-2222-4222-8222-222222222203");
    public static readonly Guid UserSofie = Guid.Parse("22222222-2222-4222-8222-222222222204");
    public static readonly Guid UserIda = Guid.Parse("22222222-2222-4222-8222-222222222205");
    public static readonly Guid UserMette = Guid.Parse("22222222-2222-4222-8222-222222222206");

    public static void Ensure(AppDbContext db)
    {
        if (db.Users.Any())
        {
            return;
        }

        db.Teams.Add(new Team { Id = TeamItOps, Name = "IT Operations", LeadUserId = UserJan });
        db.Users.AddRange(
            new UserEntity
            {
                Id = UserJan,
                KeycloakSub = "leder1",
                Username = "leder1",
                DisplayName = "Jan Vinding",
                Email = "leder1@star.dev.local",
                TeamId = TeamItOps,
                RolesCsv = $"{RoleNames.Employee},{RoleNames.Manager},{RoleNames.Admin}",
            },
            new UserEntity
            {
                Id = UserLars,
                KeycloakSub = "medarbejder1",
                Username = "medarbejder1",
                DisplayName = "Lars Bech",
                Email = "medarbejder1@star.dev.local",
                TeamId = TeamItOps,
                ManagerId = UserJan,
            },
            new UserEntity
            {
                Id = UserAhmed,
                KeycloakSub = "medarbejder2",
                Username = "medarbejder2",
                DisplayName = "Ahmed Nasser",
                Email = "medarbejder2@star.dev.local",
                TeamId = TeamItOps,
                ManagerId = UserJan,
            },
            new UserEntity
            {
                Id = UserSofie,
                KeycloakSub = "medarbejder3",
                Username = "medarbejder3",
                DisplayName = "Sofie Lund",
                Email = "medarbejder3@star.dev.local",
                TeamId = TeamItOps,
                ManagerId = UserJan,
            },
            new UserEntity
            {
                Id = UserIda,
                KeycloakSub = "medarbejder4",
                Username = "medarbejder4",
                DisplayName = "Ida Krogh",
                Email = "medarbejder4@star.dev.local",
                TeamId = TeamItOps,
                ManagerId = UserJan,
            },
            new UserEntity
            {
                Id = UserMette,
                KeycloakSub = "medarbejder5",
                Username = "medarbejder5",
                DisplayName = "Mette Holm",
                Email = "medarbejder5@star.dev.local",
                TeamId = TeamItOps,
                ManagerId = UserJan,
            });

        SeedHolidays2026(db);
        db.SaveChanges();
    }

    private static void SeedHolidays2026(AppDbContext db)
    {
        var holidays = new (DateOnly date, string name)[]
        {
            (new DateOnly(2026, 1, 1), "Nytårsdag"),
            (new DateOnly(2026, 4, 9), "Skærtorsdag"),
            (new DateOnly(2026, 4, 10), "Langfredag"),
            (new DateOnly(2026, 4, 12), "Påskedag"),
            (new DateOnly(2026, 4, 13), "2. påskedag"),
            (new DateOnly(2026, 5, 1), "Store bededag"),
            (new DateOnly(2026, 5, 5), "Grundlovsdag"),
            (new DateOnly(2026, 5, 14), "Kr. Himmelfartsdag"),
            (new DateOnly(2026, 5, 24), "Pinsedag"),
            (new DateOnly(2026, 5, 25), "2. pinsedag"),
            (new DateOnly(2026, 12, 24), "Juleaftensdag"),
            (new DateOnly(2026, 12, 25), "Juledag"),
            (new DateOnly(2026, 12, 26), "2. juledag"),
            (new DateOnly(2026, 12, 31), "Nytårsaftensdag"),
        };
        foreach (var (date, name) in holidays)
        {
            db.Holidays.Add(new Holiday { Date = date, Name = name, Kind = date.Month == 6 && date.Day == 5 ? "state_day_off" : "public" });
        }
    }
}
