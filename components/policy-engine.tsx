export default function PolicyEngine() {
  const policies = [
    "📉 Reduce VAT → boosts consumption, reduces treasury short-term",
    "📈 Increase infrastructure spend → improves trade flow",
    "🚓 Increase policing budget → lowers crime rate",
    "🏗️ Urban investment → raises property values",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-sm text-zinc-400 mb-4">
        Policy Impact Engine
      </h2>

      <div className="space-y-3 text-sm text-white/80">
        {policies.map((p, i) => (
          <div key={i}>{p}</div>
        ))}
      </div>
    </div>
  );
}
