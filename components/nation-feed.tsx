"use client";

import { motion } from "framer-motion";

const events = [
  "💰 Nairobi County revenue updated",
  "🚓 Police response dispatched in Mombasa",
  "🏥 Hospital capacity adjusted in Kisumu",
  "🚧 Road maintenance flagged in Eldoret",
  "📊 National tax flow updated",
  "⚡ Electricity grid balancing active",
];

export default function NationFeed() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <h3 className="text-sm text-zinc-400 mb-4">
        National Activity Stream
      </h3>

      <div className="space-y-3">
        {events.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="text-sm text-white/80"
          >
            {e}
          </motion.div>
        ))}
      </div>

    </div>
  );
}
