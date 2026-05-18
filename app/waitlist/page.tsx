"use client";
import Navbar from "@/components/navbar";
import { useState } from "react";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-6 text-sm uppercase tracking-[0.3em] text-zinc-500">
          Early Access
        </p>

        <h1 className="text-5xl font-black md:text-7xl">
          Join The MTAA Waitlist
        </h1>

        <p className="mt-8 max-w-2xl text-lg text-zinc-400">
          Be among the first users to access the MTAA AFRIQ ecosystem.
        </p>

        <div className="mt-12 flex w-full max-w-xl flex-col gap-4 md:flex-row">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-4 outline-none"
          />

          <button className="rounded-2xl bg-white px-8 py-4 font-bold text-black">
            Join
          </button>
        </div>
      </section>
    </main>
  );
}
