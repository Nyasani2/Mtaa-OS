export default function PresidentialWarRoom() {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">

      <h2 className="text-sm text-blue-300 mb-4">
        Presidential Command Center
      </h2>

      <div className="grid md:grid-cols-3 gap-4">

        <div className="border border-white/10 p-4 rounded-xl">
          <p className="text-zinc-400 text-xs">National Stability</p>
          <p className="text-2xl font-bold text-green-400">Stable</p>
        </div>

        <div className="border border-white/10 p-4 rounded-xl">
          <p className="text-zinc-400 text-xs">Active Crises</p>
          <p className="text-2xl font-bold text-red-400">2</p>
        </div>

        <div className="border border-white/10 p-4 rounded-xl">
          <p className="text-zinc-400 text-xs">Revenue Flow</p>
          <p className="text-2xl font-bold">$12.4B</p>
        </div>

      </div>

    </div>
  );
}
