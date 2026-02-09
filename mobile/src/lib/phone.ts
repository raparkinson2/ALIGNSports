/**
 * Format a phone number to (XXX)XXX-XXXX format
 * Handles various input formats and strips non-numeric characters
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // If we have exactly 10 digits, format as (XXX)XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // If we have 11 digits starting with 1 (US country code), format without the 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const withoutCountry = cleaned.slice(1);
    return `(${withoutCountry.slice(0, 3)})${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
  }

  // For other lengths, return as-is (might be partial or international)
  return phone;
}

/**
 * Format phone input as user types
 * Returns formatted value for display
 */
export function formatPhoneInput(value: string): string {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');

  // Limit to 10 digits
  const limited = cleaned.slice(0, 10);

  // Format progressively as user types
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)})${limited.slice(3)}`;
  return `(${limited.slice(0, 3)})${limited.slice(3, 6)}-${limited.slice(6)}`;
}

/**
 * Extract raw digits from formatted phone number
 */
export function unformatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
