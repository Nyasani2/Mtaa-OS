"use client";

import { motion } from "framer-motion";

const flows = [
  "💰 Revenue collected in Nairobi County",
  "🚚 Cargo cleared at Mombasa Port",
  "🏥 Hospital bed allocated in Kisumu",
  "👮 Security alert resolved in Eldoret",
  "💼 Job matched in Lagos network",
];

export default function LiveFlows() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 overflow-hidden">

      <h3 className="text-sm text-zinc-400 mb-4">
        Live System Activity (Simulation)
      </h3>

      <div className="space-y-3">
        {flows.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className="text-sm text-white/80"
          >
            {f}
          </motion.div>
        ))}
      </div>

    </div>
  );
}
