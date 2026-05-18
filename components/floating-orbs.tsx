"use client";

import { motion } from "framer-motion";

export default function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl"
        animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
        style={{ top: "10%", left: "15%" }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl"
        animate={{ x: [0, -100, 0], y: [0, 80, 0] }}
        transition={{ duration: 18, repeat: Infinity }}
        style={{ bottom: "10%", right: "10%" }}
      />

      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full bg-green-500/10 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, -60, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
        style={{ top: "50%", right: "30%" }}
      />
    </div>
  );
}
