import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../supabase";

export async function submitVerification(
  user_id: string,
  verification_type:
    | "SELFIE"
    | "ID"
    | "PROFESSION"
) {

  const result =
    await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

  if (result.canceled) {
    return null;
  }

  const asset =
    result.assets[0];

  const response =
    await fetch(asset.uri);

  const blob =
    await response.blob();

  const fileName =
    `${user_id}-${Date.now()}.jpg`;

  const { error } = await supabase
    .storage
    .from("hookup-verification-media")
    .upload(fileName, blob);

  if (error) {
    throw error;
  }

  const { data } = supabase
    .storage
    .from("hookup-verification-media")
    .getPublicUrl(fileName);

  await supabase
    .from("hookup_verifications")
    .insert({
      user_id,
      verification_type,
      media_url: data.publicUrl,
    });

  return data.publicUrl;
}
