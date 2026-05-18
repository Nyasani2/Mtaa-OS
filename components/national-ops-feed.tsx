import { motion } from "framer-motion";

export default function NationalOpsFeed() {
  const events = [
    "🚨 Police response resolved in Nairobi West",
    "⚖️ Court case scheduled in Mombasa High Court",
    "🚢 Port clearance optimized in real-time",
    "💰 Treasury revenue batch processed",
    "🚧 Infrastructure delay flagged in Eldoret",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      <h2 className="text-sm text-zinc-400 mb-4">
        National Operations Feed
      </h2>

      <div className="space-y-3">
        {events.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 15 }}
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
