import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
import EcosystemCard from "@/components/ecosystem-card";
import FloatingOrbs from "@/components/floating-orbs";

import PresidentPreview from "@/components/president-preview";

import AfricaMap from "@/components/africa-map";
import LiveFlows from "@/components/live-flows";
import GovernanceAI from "@/components/governance-ai";
import AppWindow from "@/components/app-window";

import RoleSwitcher from "@/components/role-switcher";
import NationMap from "@/components/nation-map";
import NationFeed from "@/components/nation-feed";
import MtaaAI from "@/components/mtaa-ai";

import { socialApps, commercialApps, civicApps } from "@/lib/apps";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      <FloatingOrbs />
      <Navbar />

      {/* HERO */}
      <section className="text-center px-6 py-28 relative z-10">

        <p className="text-xs tracking-[0.3em] text-blue-400 mb-6 uppercase">
          Civilization Scale Operating System
        </p>

        <h1 className="text-5xl md:text-7xl font-black leading-tight">
          Africa Runs Here.
        </h1>

        <p className="text-zinc-400 max-w-3xl mx-auto mt-6 text-lg leading-relaxed">
          Communication. Commerce. Infrastructure. Governance. Identity.
          <br />
          One unified digital operating system for the African century.
        </p>

        <div className="mt-10 flex gap-4 justify-center flex-wrap">

          <a
            href="/ecosystem"
            className="px-7 py-3 bg-white text-black rounded-full font-semibold hover:scale-105 transition"
          >
            Explore Ecosystem
          </a>

          <a
            href="/demo"
            className="px-7 py-3 border border-white/10 rounded-full hover:bg-white/10 transition"
          >
            Enter Simulation Demo
          </a>

          <a
            href="/waitlist"
            className="px-7 py-3 border border-blue-500/30 rounded-full text-blue-300 hover:bg-blue-500/10 transition"
          >
            Join Waitlist
          </a>

        </div>

      </section>

      {/* BIG IDEA */}
      <section className="px-6 py-16 max-w-5xl mx-auto relative z-10">

        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">

          <p className="text-xs tracking-[0.3em] text-zinc-500 mb-4 uppercase">
            THE BOTTOM LINE
          </p>

          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            MTAA AFRIQ is not a super app.
            <br />
            It is a digital nation-state operating system.
          </h2>

          <p className="text-zinc-400 mt-6 text-lg">
            It unifies communication, commerce, identity, finance, logistics,
            and governance into one continental infrastructure layer.
          </p>

        </div>

      </section>

      {/* SOCIAL */}
      <section className="px-6 py-20 max-w-7xl mx-auto relative z-10">

        <div className="mb-10">
          <p className="text-cyan-400 text-xs tracking-[0.3em] uppercase mb-3">
            Social Layer
          </p>

          <h2 className="text-4xl font-bold mb-3">
            People Connect Here
          </h2>

          <p className="text-zinc-400 max-w-2xl">
            Communication, culture, communities, creators, and real-time interaction.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {socialApps.map((a) => (
            <EcosystemCard key={a.title} {...a} />
          ))}
        </div>

      </section>

      {/* ECONOMY */}
      <section className="px-6 py-20 max-w-7xl mx-auto relative z-10">

        <div className="mb-10">
          <p className="text-green-400 text-xs tracking-[0.3em] uppercase mb-3">
            Economic Layer
          </p>

          <h2 className="text-4xl font-bold mb-3">
            People Work & Earn Here
          </h2>

          <p className="text-zinc-400 max-w-2xl">
            Jobs, payments, mobility, logistics, trade, and commerce infrastructure.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {commercialApps.map((a) => (
            <EcosystemCard key={a.title} {...a} />
          ))}
        </div>

      </section>

      {/* CIVIC */}
      <section className="px-6 py-20 max-w-7xl mx-auto relative z-10">

        <div className="mb-10">
          <p className="text-orange-400 text-xs tracking-[0.3em] uppercase mb-3">
            Civic Layer
          </p>

          <h2 className="text-4xl font-bold mb-3">
            Governments Operate Here
          </h2>

          <p className="text-zinc-400 max-w-2xl">
            Treasury, revenue, police, courts, ports, infrastructure, national systems.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {civicApps.map((a) => (
            <EcosystemCard key={a.title} {...a} />
          ))}
        </div>

      </section>

      {/* MAP */}
      <section className="px-6 py-20 max-w-6xl mx-auto relative z-10">
        <AfricaMap />
      </section>

      {/* LIVE SYSTEMS */}
      <section className="px-6 py-10 max-w-6xl mx-auto relative z-10">

        <div className="grid md:grid-cols-2 gap-6">
          <LiveFlows />
          <GovernanceAI />
        </div>

      </section>

      {/* APP WINDOW */}
      <section className="px-6 py-10 max-w-6xl mx-auto relative z-10">

        <AppWindow title="MTaxi — National Mobility System">

          <div className="text-sm text-zinc-400 space-y-2">
            <p>🚖 Driver allocation active</p>
            <p>📍 1,240 vehicles online</p>
            <p>📊 Demand spike detected</p>
            <p>⚡ Optimizing routes</p>
          </div>

        </AppWindow>

      </section>

      {/* COMMAND CENTER */}
      <section className="px-6 py-10 max-w-6xl mx-auto relative z-10">

        <RoleSwitcher />

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <NationMap />
          <NationFeed />
        </div>

        <div className="mt-6">
          <MtaaAI />
        </div>

      </section>

      {/* PRESIDENT */}
      <section className="px-6 py-20 max-w-6xl mx-auto relative z-10">
        <PresidentPreview />
      </section>

      {/* STATS */}
      <section className="px-6 py-20 max-w-6xl mx-auto relative z-10">

        <div className="grid md:grid-cols-4 gap-5">

          <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
            <h3 className="text-3xl font-bold">~700</h3>
            <p className="text-zinc-400 text-sm mt-2">Database tables</p>
          </div>

          <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
            <h3 className="text-3xl font-bold">60+</h3>
            <p className="text-zinc-400 text-sm mt-2">Modules</p>
          </div>

          <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
            <h3 className="text-3xl font-bold">1</h3>
            <p className="text-zinc-400 text-sm mt-2">Unified system</p>
          </div>

          <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
            <h3 className="text-3xl font-bold">∞</h3>
            <p className="text-zinc-400 text-sm mt-2">Scale</p>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="text-center py-28 px-6 relative z-10">

        <h2 className="text-5xl font-bold mb-5">
          Enter a Living Digital Nation
        </h2>

        <p className="text-zinc-400 max-w-2xl mx-auto mb-10">
          Governance, economy, and society operating as one system.
        </p>

        <a
          href="/demo"
          className="inline-block px-10 py-4 bg-white text-black rounded-full font-semibold hover:scale-105 transition"
        >
          Launch Simulation
        </a>

      </section>

      <Footer />

    </main>
  );
}
