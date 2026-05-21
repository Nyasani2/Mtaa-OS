import CommandShell from '@/domains/civic/treasury/components/CommandShell'

export default function TreasuryLayout({ children }: { children: React.ReactNode }) {
  return <CommandShell>{children}</CommandShell>
}
