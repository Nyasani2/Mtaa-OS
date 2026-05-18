import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-xl">MTAA AFRIQ</h1>
          <p className="text-xs text-zinc-400">
            Africa’s Operating System
          </p>
        </div>

        <nav className="hidden md:flex gap-6 text-sm text-zinc-300">
          <Link href="/social">Social</Link>
          <Link href="/commercial">Economy</Link>
          <Link href="/civic">Civic</Link>
          <Link href="/demo">Demo</Link>
        </nav>

        <button className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold">
          Coming Soon
        </button>
      </div>
    </header>
  );
}
