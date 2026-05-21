
import { supabase } from "../../supabase";
import { walletExecutionService } from './walletExecutionService'

walletExecutionService.init()
export async function linkPaymentToHookup(
  user_id: string,
  amount: number,
  purpose: string
) {

  const { data, error } =
    await supabase
      .from("hookup_ecosystem_events")
      .insert({
        user_id,
        source_app: "WALLET",
        event_type: "PAYMENT",
        amount,
        metadata: {
          purpose,
        },
      });

  if (error) throw error;

  return data;
}
