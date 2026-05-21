import {
  translateText
} from "./hookup-translation-engine";

export function translateRoomMessage(
  message: string,
  user_lang: string,
  room_lang: string
) {

  if (user_lang === room_lang) {
    return {
      translated: message,
      needed: false,
    };
  }

  return {
    translated: translateText(
      message,
      user_lang,
      room_lang
    ).translated,
    needed: true,
  };
}
