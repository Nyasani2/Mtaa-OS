export default function InstitutionGrid() {
  const institutions = [
    { name: "Police Command", status: "Active" },
    { name: "Courts System", status: "Active" },
    { name: "Ports Authority", status: "Monitoring" },
    { name: "Treasury", status: "Stable" },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <h2 className="text-sm text-zinc-400 mb-4">
        Institutional Systems
      </h2>

      <div className="grid md:grid-cols-2 gap-3">
        {institutions.map((i) => (
          <div
            key={i.name}
            className="border border-white/10 rounded-xl p-4"
          >
            <p className="font-semibold">{i.name}</p>
            <p className="text-xs text-zinc-400">{i.status}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
