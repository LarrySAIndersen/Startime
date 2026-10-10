using Startime.Api.Data;

namespace Startime.Api.Middleware;

public sealed class DemoAuthMiddleware(RequestDelegate next)
{
    public const string UserIdHeader = "X-Demo-User-Id";

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.Request.Path.StartsWithSegments("/api/v1") &&
            !context.Request.Path.StartsWithSegments("/api/v1/demo"))
        {
            if (!Guid.TryParse(context.Request.Headers[UserIdHeader], out var userId) ||
                !db.Users.Any(u => u.Id == userId && u.Active))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { detail = "Log ind (demo: vælg bruger)." });
                return;
            }

            context.Items["UserId"] = userId;
        }

        await next(context);
    }
}

public static class HttpContextUser
{
    public static Guid GetUserId(HttpContext ctx) => (Guid)ctx.Items["UserId"]!;
}
