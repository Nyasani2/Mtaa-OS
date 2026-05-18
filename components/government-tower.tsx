export default function GovernmentTower() {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">

      <h2 className="text-xl font-bold mb-3">
        National Control Tower
      </h2>

      <div className="grid md:grid-cols-3 gap-4 text-sm">

        <div className="border border-white/10 rounded-xl p-4">
          <p className="text-zinc-400">National Revenue</p>
          <p className="text-2xl font-bold">$4.8B</p>
        </div>

        <div className="border border-white/10 rounded-xl p-4">
          <p className="text-zinc-400">Active Institutions</p>
          <p className="text-2xl font-bold">12</p>
        </div>

        <div className="border border-white/10 rounded-xl p-4">
          <p className="text-zinc-400">System Health</p>
          <p className="text-2xl font-bold text-green-400">Stable</p>
        </div>

      </div>

    </div>
  );
}
