import { supabase } from "../../supabase";

export async function getBalance(user_id: string) {

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_tokens"")
      .select("*")
      .eq("user_id", user_id)
      .single();

  if (error) throw error;

  return data;
}

export async function addTokens(
  user_id: string,
  amount: number
) {

  const current =
    await getBalance(user_id);

  const newBalance =
    (current?.balance || 0) + amount;

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_tokens"")
      .upsert({
        user_id,
        balance: newBalance,
        updated_at: new Date(),
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}

export async function deductTokens(
  user_id: string,
  amount: number
) {

  const current =
    await getBalance(user_id);

  const newBalance =
    Math.max(
      0,
      (current?.balance || 0) - amount
    );

  const { data, error } =
    await supabase
      .from("// STUB_REMOVED: "hookup_tokens"")
      .upsert({
        user_id,
        balance: newBalance,
        updated_at: new Date(),
      })
      .select()
      .single();

  if (error) throw error;

  return data;
}
