export default function AppWindow({ title, children }: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-zinc-400">{title}</span>

        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {children}
      </div>

    </div>
  );
}
