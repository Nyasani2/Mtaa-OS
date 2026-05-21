export default function GovernanceIntelligence() {
  const insights = [
    "📉 Tax compliance dropped 3% in informal sector",
    "🚧 Infrastructure delays detected in 2 counties",
    "💰 Revenue surge in digital payments sector",
    "⚖️ Court backlog increasing in urban centers",
    "🚓 Crime response time improved by 12%",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6">

      <h2 className="text-sm text-zinc-400 mb-4">
        Governance Intelligence AI
      </h2>

      <div className="space-y-3">
        {insights.map((i, idx) => (
          <div key={idx} className="text-sm text-white/80">
            {i}
          </div>
        ))}
      </div>

    </div>
  );
}
