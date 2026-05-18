import { socialApps, commercialApps, civicApps } from "@/lib/apps";
import EcosystemCard from "@/components/ecosystem-card";

export default function EcosystemPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white px-6 py-20">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-bold mb-4">
          MTAA Ecosystem
        </h1>

        <p className="text-zinc-400 mb-12 max-w-2xl">
          A unified digital operating system for society, economy, and governance.
        </p>

        {/* SOCIAL */}
        <h2 className="text-2xl font-semibold mb-6 text-cyan-400">
          Social Layer
        </h2>
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {socialApps.map((a) => (
            <EcosystemCard key={a.title} {...a} />
          ))}
        </div>

        {/* COMMERCIAL */}
        <h2 className="text-2xl font-semibold mb-6 text-green-400">
          Economic Layer
        </h2>
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {commercialApps.map((a) => (
            <EcosystemCard key={a.title} {...a} />
          ))}
        </div>

        {/* CIVIC */}
        <h2 className="text-2xl font-semibold mb-6 text-orange-400">
          Civic Layer
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {civicApps.map((a) => (
            <EcosystemCard key={a.title} {...a} />
          ))}
        </div>

      </div>
    </main>
  );
}
