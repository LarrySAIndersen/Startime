using Microsoft.EntityFrameworkCore;

namespace Startime.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<Deputy> Deputies => Set<Deputy>();
    public DbSet<Absence> Absences => Set<Absence>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<NotificationOutbox> NotificationOutbox => Set<NotificationOutbox>();
    public DbSet<AuditLogEntry> AuditLog => Set<AuditLogEntry>();
    public DbSet<AccessLogEntry> AccessLog => Set<AccessLogEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Team>().HasKey(t => t.Id);
        modelBuilder.Entity<UserEntity>().HasKey(u => u.Id);
        modelBuilder.Entity<UserEntity>().HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<Deputy>().HasKey(d => d.Id);
        modelBuilder.Entity<Absence>().HasKey(a => a.Id);
        modelBuilder.Entity<Holiday>().HasKey(h => h.Date);
        modelBuilder.Entity<NotificationOutbox>().HasKey(n => n.Id);
        modelBuilder.Entity<AuditLogEntry>().HasKey(a => a.Id);
        modelBuilder.Entity<AccessLogEntry>().HasKey(a => a.Id);
    }
}
