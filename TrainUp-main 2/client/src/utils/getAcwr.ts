/**
 * Calculate ACWR (Acute:Chronic Workload Ratio) with consistent handling
 * @param acute - Acute load (last 7 days total)
 * @param chronic - Chronic load (28-day average)
 * @returns ACWR ratio or null if either value is 0 or invalid
 */
export function getAcwr(acute: number, chronic: number): number | null {
  // Return null for invalid or zero values to display as "—"
  if (!acute || !chronic || acute <= 0 || chronic <= 0) {
    return null;
  }
  
  return acute / chronic;
}

/**
 * Format ACWR value for display
 * @param acwr - ACWR ratio or null
 * @returns Formatted string with 2 decimal places or em-dash
 */
export function formatAcwr(acwr: number | null): string {
  return acwr === null ? "—" : acwr.toFixed(2);
}