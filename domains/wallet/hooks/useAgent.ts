import { useWalletStore } from '@/lib/stores/wallet-store';

export function useAgent() {
  return useWalletStore((state) => ({
    agents: state.agents ?? [],
    selectedAgent: state.selectedAgent ?? null,
    agentTransactions: state.agentTransactions ?? [],
    loadAgents: state.loadAgents,
    requestAgentTransaction: state.requestAgentTransaction,
    loading: state.loading,
    error: state.error,
  }));
}
