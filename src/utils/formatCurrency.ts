/**
 * Formats minor units (paise) into standard Indian Rupee string formatting.
 * Uses 'en-IN' locale with ₹ currency symbol.
 */
export function formatPaiseToInr(
  paise: number,
  options?: { hideDecimals?: boolean; compact?: boolean }
): string {
  const rupees = paise / 100;
  
  if (options?.compact && Math.abs(rupees) >= 100000) {
    if (Math.abs(rupees) >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(rupees / 100000).toFixed(2)} L`;
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options?.hideDecimals ? 0 : 2,
    maximumFractionDigits: options?.hideDecimals ? 0 : 2,
  });

  return formatter.format(rupees);
}

/**
 * Converts rupees (number or input string) to integer paise.
 * Guards against floating-point issues using Math.round.
 */
export function inrToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  return Math.round(rupees * 100);
}

/**
 * Converts paise to a standard decimal number in INR.
 */
export function paiseToInr(paise: number): number {
  return paise / 100;
}

/**
 * Masks an account number, displaying only the last 4 digits.
 * e.g. "10029384756" -> "•••• •••• 4756"
 */
export function maskAccountNumber(accNumber: string): string {
  if (!accNumber) return '••••';
  const clean = accNumber.trim();
  if (clean.length <= 4) return clean;
  const lastFour = clean.slice(-4);
  return `•••• •••• ${lastFour}`;
}
