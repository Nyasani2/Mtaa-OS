"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight">
          MTAA AFRIQ
        </Link>

        <nav className="hidden gap-8 md:flex">
          <Link href="/" className="text-zinc-400 hover:text-white">
            Home
          </Link>

          <Link
            href="/ecosystem"
            className="text-zinc-400 hover:text-white"
          >
            Ecosystem
          </Link>

          <Link href="/download" className="text-zinc-400 hover:text-white">
            Download
          </Link>

          <Link href="/waitlist" className="text-zinc-400 hover:text-white">
            Waitlist
          </Link>
        </nav>

        <Link
          href="/download"
          className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:scale-105"
        >
          Get MTAA
        </Link>
      </div>
    </header>
  );
}
