import { useWalletStore } from '@/lib/stores/wallet-store';

export function useAgent() {
  return useWalletStore((state) => ({
    agents: state.agents ?? [],
    selectedAgent: state.selected_agent ?? null,
    agentTransactions: state.agent_transactions ?? [],
    loadAgents: state.loadAgents,
    requestAgentTransaction: state.requestAgentTransaction,
    loading: state.loading,
    error: state.error,
  }));
}
