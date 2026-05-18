"use client";

import { motion } from "framer-motion";

const colors: any = {
  blue: "from-blue-500/20 to-blue-900/10 border-blue-500/20",
  green: "from-green-500/20 to-green-900/10 border-green-500/20",
  orange: "from-orange-500/20 to-orange-900/10 border-orange-500/20",
  red: "from-red-500/20 to-red-900/10 border-red-500/20",
  purple: "from-purple-500/20 to-purple-900/10 border-purple-500/20",
  cyan: "from-cyan-500/20 to-cyan-900/10 border-cyan-500/20",
  yellow: "from-yellow-500/20 to-yellow-900/10 border-yellow-500/20",
};

export default function EcosystemCard({
  icon,
  title,
  description,
  status,
  color,
}: any) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={`rounded-3xl border bg-gradient-to-br ${colors[color]} p-5`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-4xl">{icon}</div>
        <span className="text-[10px] px-2 py-1 border border-white/10 rounded-full text-zinc-300">
          {status}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>

      <div className="mt-5 h-24 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-zinc-500">
        Screenshot Space
      </div>
    </motion.div>
  );
}
