'use client'
import { ReactNode } from 'react'
import { useCommandStore } from '../state/commandStore'
import { LayoutDashboard, Wallet, FileText, Users, ShoppingCart, Shield, BarChart3, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/civic/treasury', icon: LayoutDashboard },
  { label: 'Budget', href: '/civic/treasury/budget', icon: Wallet },
  { label: 'Payments', href: '/civic/treasury/payments', icon: FileText },
  { label: 'Debt & Payroll', href: '/civic/treasury/debt-payroll', icon: Users },
  { label: 'Procurement', href: '/civic/treasury/procurement', icon: ShoppingCart },
  { label: 'Audit', href: '/civic/treasury/audit', icon: Shield },
  { label: 'Reports', href: '/civic/treasury/reports', icon: BarChart3 },
  { label: 'Feedback', href: '/civic/treasury/feedback', icon: MessageSquare }
]

export default function CommandShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { activeModule } = useCommandStore()

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-treasury-900 text-white flex flex-col">
        <div className="p-6 border-b border-treasury-800">
          <h1 className="text-xl font-bold">MTAA Treasury</h1>
          <p className="text-xs text-treasury-300 mt-1">Command Centre</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? 'bg-treasury-700 text-white' : 'text-treasury-200 hover:bg-treasury-800'
                }`}>
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-treasury-800">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-treasury-600 flex items-center justify-center text-sm font-bold">A</div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-treasury-300">Treasury Admin</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">{activeModule.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
