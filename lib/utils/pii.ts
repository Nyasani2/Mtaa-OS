/**
 * MTAA OS PII Masking Utility
 * Masks sensitive data for public display to protect user privacy.
 */

export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length < 6) return '***';
  // Keep first 4 chars (e.g., +254) and last 3 chars, mask the rest
  return `${cleaned.substring(0, 4)} *** *** ${cleaned.slice(-3)}`;
}

export function maskNationalId(id: string | null | undefined): string {
  if (!id) return '';
  if (id.length < 4) return '****';
  // Keep last 4 digits, mask the rest
  return '****' + id.slice(-4);
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return '***@***';
  // Keep first letter of name, mask the rest
  return `${name.charAt(0)}***@${domain}`;
}

export function maskLocation(lat: number, lng: number, precision: number = 2): { lat: number, lng: number } {
  // Reduces GPS precision to ~1km radius for public maps
  const factor = Math.pow(10, precision);
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
}
