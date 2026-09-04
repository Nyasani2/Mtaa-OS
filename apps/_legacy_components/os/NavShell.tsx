'use client'

import Link from 'next/link';

export default function NavShell() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-3 flex justify-around text-xs z-50">

      <Link href="/">
        <div className="text-center">
          <p>🏠</p>
          <p className="text-zinc-400">Home</p>
        </div>
      </Link>

      <Link href="/demo">
        <div className="text-center">
          <p>🏛️</p>
          <p className="text-zinc-400">Demo</p>
        </div>
      </Link>

      <div className="text-center">
        <p>🛣️</p>
        <p className="text-zinc-600">Streets</p>
      </div>

      <div className="text-center">
        <p>💳</p>
        <p className="text-zinc-600">Wallet</p>
      </div>

      <div className="text-center">
        <p>📡</p>
        <p className="text-zinc-600">Events</p>
      </div>

    </div>
  )
}
