import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";

export async function pickProfileImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
  });

  if (result.canceled) return null;

  return result.assets[0];
}

export async function uploadProfileImage(
  user_id: string,
  file: any
) {
  const response = await fetch(file.uri);
  const blob = await response.blob();

  const fileName = `${user_id}-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase
    .storage
    .from("hookup-profile-media")
    .upload(fileName, blob);

  if (uploadError) {
    console.error("UPLOAD_FAILED", uploadError);
    throw uploadError;
  }

  const { data } = supabase
    .storage
    .from("hookup-profile-media")
    .getPublicUrl(fileName);

  await supabase
    .from("hookup_profile_media")
    .insert({
      user_id,
      media_url: data.publicUrl,
      media_type: "IMAGE",
      moderation_status: "PENDING",
    });

  return data.publicUrl;
}
