/**
 * Formats a raw phone number into a standard international format.
 * @param phone The raw phone number input
 * @param defaultCountryCode The default country code to prepend (e.g., '+254')
 * @returns A properly formatted international phone number (e.g., '+254712345678')
 */
export function formatPhoneNumber(phone: string, defaultCountryCode: string = '+254'): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  
  // Already has a country code
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Starts with 0 (e.g., 0712345678) -> replace with +254712345678
  if (cleaned.startsWith('0')) {
    return defaultCountryCode + cleaned.substring(1);
  }
  
  // Starts with country code without '+' (e.g., 254712345678) -> add '+'
  if (cleaned.startsWith(defaultCountryCode.substring(1))) {
    return '+' + cleaned;
  }
  
  // Fallback: just prepend the default country code
  return defaultCountryCode + cleaned;
}

/**
 * Validates if a phone number is in a valid international format.
 * @param phone The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  // Regex: Must start with '+', followed by 1-3 digit country code, then 7-14 digits
  return /^\+[1-9]\d{7,14}$/.test(cleaned);
}
