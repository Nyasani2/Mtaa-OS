import { supabase } from "../../supabase";
import {
  encryptMessage,
} from "../encryption/hookup-encryption-engine";

export async function sendPrivateMessage(
  room_id: string,
  sender_id: string,
  message: string,
  key: string
) {

  const encrypted =
    encryptMessage(message, key);

  const { data, error } =
    await supabase
      .from("hookup_private_messages")
      .insert({
        room_id,
        sender_id,
        encrypted_content: encrypted,
      });

  if (error) throw error;

  return data;
}
