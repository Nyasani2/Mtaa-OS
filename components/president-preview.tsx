export default function PresidentPreview() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

      <h2 className="text-2xl font-bold mb-4">
        Presidential Command Center (Simulation)
      </h2>

      <p className="text-zinc-400 mb-6">
        Real-time national dashboard for governance, revenue, and infrastructure coordination.
      </p>

      <div className="grid md:grid-cols-3 gap-4">

        <div className="border border-white/10 rounded-2xl p-4">
          <h3 className="text-green-400 text-3xl font-bold">$4.2B</h3>
          <p className="text-sm text-zinc-400">National Revenue Flow</p>
        </div>

        <div className="border border-white/10 rounded-2xl p-4">
          <h3 className="text-orange-400 text-3xl font-bold">47</h3>
          <p className="text-sm text-zinc-400">Active Counties Online</p>
        </div>

        <div className="border border-white/10 rounded-2xl p-4">
          <h3 className="text-blue-400 text-3xl font-bold">1.2M</h3>
          <p className="text-sm text-zinc-400">Daily Civic Transactions</p>
        </div>

      </div>

      <div className="mt-6 text-xs text-zinc-500">
        Simulation Mode — Not connected to live government systems
      </div>

    </div>
  );
}
