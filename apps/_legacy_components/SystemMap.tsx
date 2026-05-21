const items = [
  "Kernel Core",
  "Command Centre",
  "Wallet/Treasury",
  "AppStore Layer",
  "Economic Rail",
  "Civic Infrastructure",
];

export default function SystemMap() {
  return (
    <section className="py-24 px-6">
      <h2 className="text-4xl font-bold text-center mb-16">
        System Architecture
      </h2>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {items.map((item) => (
          <div
            key={item}
            className="bg-[#0b0f1a] border border-white/10 rounded-3xl p-8"
          >
            <h3 className="text-xl font-semibold">{item}</h3>

            <p className="mt-4 text-zinc-400">
              Core infrastructure layer powering the MTAA ecosystem.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
