export default function NationalKPI() {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-green-500/10 to-blue-500/10 p-6">

      <h2 className="text-sm text-zinc-400 mb-4">
        National Performance Core
      </h2>

      <div className="grid md:grid-cols-3 gap-4">

        <div>
          <p className="text-xs text-zinc-400">GDP Flow</p>
          <p className="text-2xl font-bold">$128B</p>
        </div>

        <div>
          <p className="text-xs text-zinc-400">Employment</p>
          <p className="text-2xl font-bold">72%</p>
        </div>

        <div>
          <p className="text-xs text-zinc-400">Crime Index</p>
          <p className="text-2xl font-bold">Low</p>
        </div>

      </div>
    </div>
  );
}
