export function translateText(
  text: string,
  from: string,
  to: string
) {

  // placeholder engine (later replace with AI API)

  return {
    original: text,
    translated:
      `[${to}] ${text}`,
    from,
    to,
  };
}

export function detectLanguage(
  text: string
) {

  if (
    /[a-zA-Z]/.test(text) &&
    text.length > 5
  ) {
    return "EN";
  }

  if (
    /[\u0600-\u06FF]/.test(text)
  ) {
    return "AR";
  }

  if (
    /[\u4e00-\u9fff]/.test(text)
  ) {
    return "ZH";
  }

  return "UNKNOWN";
}
