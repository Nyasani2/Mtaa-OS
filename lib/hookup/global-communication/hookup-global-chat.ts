import {
  translateText,
} from "../translation/hookup-translation-engine";

export function globalChatMessage(
  message: string,
  sender_lang: string,
  receiver_lang: string
) {

  const translation =
    translateText(
      message,
      sender_lang,
      receiver_lang
    );

  return {
    delivered: true,
    original: message,
    translated:
      translation.translated,
    languages: {
      from: sender_lang,
      to: receiver_lang,
    },
  };
}
