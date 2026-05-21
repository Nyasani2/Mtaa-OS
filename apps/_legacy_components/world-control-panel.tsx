export default function WorldControlPanel() {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">

      <h2 className="text-sm text-blue-300 mb-4">
        World Control Panel
      </h2>

      <div className="grid md:grid-cols-2 gap-4 text-sm">

        <div className="border border-white/10 p-4 rounded-xl">
          🌍 Africa Node Status: ACTIVE
        </div>

        <div className="border border-white/10 p-4 rounded-xl">
          🧠 AI Governance Layer: ONLINE
        </div>

        <div className="border border-white/10 p-4 rounded-xl">
          💰 Economic Simulation: RUNNING
        </div>

        <div className="border border-white/10 p-4 rounded-xl">
          ⚖️ Policy Engine: SYNCHRONIZED
        </div>

      </div>

    </div>
  );
}
