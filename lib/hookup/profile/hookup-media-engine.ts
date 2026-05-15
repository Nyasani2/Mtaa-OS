import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../supabase";

export async function pickProfileImage() {

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
}

export async function uploadProfileImage(
  user_id: string,
  file: any
) {

  const response =
    await fetch(file.uri);

  const blob =
    await response.blob();

  const fileName =
    `${user_id}-${Date.now()}.jpg`;

  const { error } = await supabase
    .storage
    .from("hookup-profile-media")
    .upload(fileName, blob);

  if (error) {
    throw error;
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
