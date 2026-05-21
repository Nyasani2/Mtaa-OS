"use client";

import { motion } from "framer-motion";

export default function AfricaMap() {
  return (
    <div className="relative w-full h-[500px] rounded-3xl border border-white/10 bg-white/5 overflow-hidden">

      <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
        Africa Intelligence Map Layer (Simulation)
      </div>

      {/* NODE 1 */}
      <motion.div
        className="absolute w-4 h-4 bg-blue-400 rounded-full"
        style={{ top: "40%", left: "45%" }}
        animate={{ scale: [1, 1.8, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* NODE 2 */}
      <motion.div
        className="absolute w-3 h-3 bg-green-400 rounded-full"
        style={{ top: "55%", left: "60%" }}
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      {/* NODE 3 */}
      <motion.div
        className="absolute w-3 h-3 bg-orange-400 rounded-full"
        style={{ top: "60%", left: "35%" }}
        animate={{ scale: [1, 1.6, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* FLOW LINES (visual illusion of movement) */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[200px] h-[2px] bg-blue-500/20"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

    </div>
  );
}
