export default function CrisisEngine() {
  const events = [
    "⚠️ Flood risk detected in coastal region",
    "🔥 Power grid instability in 2 cities",
    "🚨 Protest escalation flagged by AI models",
    "🚧 Major highway disruption detected",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-red-500/10 p-6">

      <h2 className="text-sm text-red-300 mb-4">
        National Event Engine
      </h2>

      <div className="space-y-3">
        {events.map((e, i) => (
          <div key={i} className="text-sm text-white/80">
            {e}
          </div>
        ))}
      </div>

    </div>
  );
}
