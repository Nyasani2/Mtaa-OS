'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/cases', label: 'Cases' },
  { href: '/hearings', label: 'Hearings' },
  { href: '/judgments', label: 'Judgments' },
  { href: '/appeals', label: 'Appeals' },
  { href: '/fines', label: 'Fines' },
  { href: '/bails', label: 'Bails' },
  { href: '/jury', label: 'Jury' },
  { href: '/payroll', label: 'Payroll' },
  { href: '/attendance', label: 'Attendance' },
  { href: '/procurement', label: 'Procurement' },
  { href: '/stats', label: 'Stats' },
];

export function CourtNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1 overflow-x-auto">
          <span className="font-bold mr-4 whitespace-nowrap">⚖️ CIVIC COURTS</span>
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
