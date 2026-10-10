export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-label="STAR Hub">
      <span
        className="inline-block h-6 w-1.5 rounded-sm"
        style={{ background: "var(--star-red)" }}
        aria-hidden
      />
      <span
        className="text-[1.05rem] font-bold tracking-[0.04em]"
        style={{ color: onDark ? "#fff" : "var(--star-blue)" }}
      >
        STAR
      </span>
      <span
        className="text-[1.05rem] font-medium"
        style={{
          color: onDark ? "rgba(255,255,255,0.85)" : "var(--muted)",
          opacity: 0.85,
        }}
      >
        Hub
      </span>
    </div>
  );
}
