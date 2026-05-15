/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number as Malaysian Ringgit (RM).
 * @param n The number to format.
 * @returns A formatted string e.g., "RM 4.08".
 */
export function formatRM(n: number): string {
  return `RM ${n.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parses a string input into a number, handling units like 'g' or 'grams'.
 * @param input The raw input string from the user.
 * @returns The parsed number or 0 if invalid.
 */
export function parseAmount(input: string): number {
  if (!input) return 0;
  
  // Remove common units and whitespace
  const sanitized = input
    .toLowerCase()
    .replace(/[g|ml|unit|grams|milliliters|kg|l]/g, '')
    .trim();
    
  const value = parseFloat(sanitized);
  
  // Handle some basic conversions if needed (though the spec implies direct parsing)
  // For now, focus on the numeric part
  return isNaN(value) ? 0 : value;
}
