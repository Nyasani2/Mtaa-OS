export default function EconomyFlow() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <h2 className="text-sm text-zinc-400 mb-4">
        National Economy Flow
      </h2>

      <div className="space-y-4 text-sm">

        <div>💰 Citizens → Taxes → Treasury</div>
        <div>🏛️ Treasury → Counties → Projects</div>
        <div>🚧 Projects → Contractors → Jobs</div>
        <div>📊 Jobs → Income → Consumption</div>
        <div>🔁 Cycle reinvestment loop active</div>

      </div>

    </div>
  );
}
