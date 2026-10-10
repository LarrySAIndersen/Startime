using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Startime.Api.Data;

namespace Startime.Api.Services;

public sealed class AuditService(AppDbContext db)
{
    public async Task RecordAsync(
        Guid? actorId,
        string action,
        string entity,
        Guid? entityId,
        Guid? subjectUserId,
        object? before,
        object? after,
        CancellationToken ct = default)
    {
        var prev = await db.AuditLog.OrderByDescending(a => a.Id).FirstOrDefaultAsync(ct);
        var entry = new AuditLogEntry
        {
            ActorId = actorId,
            Action = action,
            Entity = entity,
            EntityId = entityId,
            SubjectUserId = subjectUserId,
            BeforeJson = before is null ? null : JsonSerializer.Serialize(before),
            AfterJson = after is null ? null : JsonSerializer.Serialize(after),
            PrevHash = prev?.Hash,
        };
        entry.Hash = ComputeHash(entry);
        db.AuditLog.Add(entry);
        await db.SaveChangesAsync(ct);
    }

    private static byte[] ComputeHash(AuditLogEntry entry)
    {
        var payload = $"{entry.At:O}|{entry.ActorId}|{entry.Action}|{entry.Entity}|{entry.EntityId}|{entry.SubjectUserId}|{entry.BeforeJson}|{entry.AfterJson}|{Convert.ToHexString(entry.PrevHash ?? [])}";
        return SHA256.HashData(Encoding.UTF8.GetBytes(payload));
    }
}
