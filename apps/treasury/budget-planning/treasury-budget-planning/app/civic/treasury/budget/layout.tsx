import BudgetShell from '@/domains/civic/treasury/components/BudgetShell'

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  return <BudgetShell>{children}</BudgetShell>
}
