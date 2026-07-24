import { supabase } from "@/lib/supabase";

export interface WalletExecutionPayload {
  action: "transfer" | "deposit" | "withdraw" | "escrow";
  amount: number;
  currency: string;
  recipient?: string;
  metadata?: Record<string, unknown>;
}

export async function executeWalletAction(payload: WalletExecutionPayload): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("wallet-execute", {
      body: payload,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      transactionId: data?.transactionId,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Wallet execution failed",
    };
  }
}

export default { executeWalletAction };
