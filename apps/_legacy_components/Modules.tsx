const modules = [
  "MTaxi",
  "MTruck",
  "Marketplace",
  "Jobs",
  "Wallet",
  "Tribes",
  "Streets",
  "Identity",
];

export default function Modules() {
  return (
    <section className="py-24 px-6">
      <h2 className="text-4xl font-bold text-center mb-16">
        Core Modules
      </h2>

      <div className="grid md:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {modules.map((module) => (
          <div
            key={module}
            className="rounded-3xl bg-[#0b0f1a] border border-white/10 p-8 hover:border-white/30 transition"
          >
            <h3 className="text-xl font-semibold">{module}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
