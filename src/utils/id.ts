/**
 * Generates an alphanumeric random ID with optional prefix.
 */
export function generateId(prefix: string = 'id'): string {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Generates an official-looking transaction reference code:
 * Format: TXN-YYYYMMDD-XXXXXX
 */
export function generateTxnRef(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${year}${month}${day}-${rand}`;
}

/**
 * Generates a 6-digit numeric OTP.
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a mock IFSC code or account number.
 */
export function generateAccountNumber(prefix: string = '100'): string {
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${rand}`;
}
