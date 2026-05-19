import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <Link href="/">
          <div className="cursor-pointer">
            <h1 className="font-black text-xl tracking-wide">
              MTAA AFRIQ
            </h1>

            <p className="text-xs text-zinc-400">
              Africa’s Operating System
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex gap-6 text-sm text-zinc-300">

          <Link
            href="/"
            className="hover:text-white transition"
          >
            Home
          </Link>

          <Link
            href="/ecosystem"
            className="hover:text-white transition"
          >
            Ecosystem
          </Link>

          <Link
            href="/demo"
            className="hover:text-white transition"
          >
            Demo
          </Link>

          <Link
            href="/waitlist"
            className="hover:text-white transition"
          >
            Waitlist
          </Link>

        </nav>

        <a
          href="/demo"
          className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:scale-105 transition"
        >
          Launch OS
        </a>

      </div>

    </header>
  );
}
