'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/inmates', label: 'Inmates' },
  { href: '/cells', label: 'Cells' },
  { href: '/movements', label: 'Movements' },
  { href: '/visits', label: 'Visits' },
  { href: '/wardens', label: 'Wardens' },
  { href: '/incidents', label: 'Incidents' },
  { href: '/parole', label: 'Parole' },
  { href: '/attendance', label: 'Attendance' },
  { href: '/payroll', label: 'Payroll' },
  { href: '/procurement', label: 'Procurement' },
  { href: '/stats', label: 'Stats' },
];

export function PrisonNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1 overflow-x-auto">
          <span className="font-bold mr-4 whitespace-nowrap">🔒 CIVIC PRISONS</span>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap transition ${
                pathname === link.href ? 'bg-blue-600' : 'hover:bg-slate-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
