"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl font-black tracking-tight"
        >
          MTAA AFRIQ
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-zinc-400 text-lg leading-relaxed"
        >
          A City-Level Operating System powering transport,
          commerce, jobs, identity, finance, and civic
          infrastructure for Africa.
        </motion.p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button className="px-7 py-4 rounded-2xl bg-white text-black font-semibold">
            Explore System
          </button>

          <button className="px-7 py-4 rounded-2xl border border-white/20">
            View Architecture
          </button>
        </div>
      </div>
    </section>
  );
}
