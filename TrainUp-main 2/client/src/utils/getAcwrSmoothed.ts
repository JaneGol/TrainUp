/**
 * Unified ACWR calculation helper used across all widgets
 * @param acuteLoad - Acute load (last 7 days)
 * @param chronicLoad - Chronic load (28-day average)
 * @returns ACWR ratio or null if either value is 0 or invalid
 */
export function getAcwrSmoothed(acuteLoad: number, chronicLoad: number): number | null {
  // Return null for invalid or zero values to display as "—"
  if (!acuteLoad || !chronicLoad || acuteLoad <= 0 || chronicLoad <= 0) {
    return null;
  }
  
  return parseFloat((acuteLoad / chronicLoad).toFixed(2));
}

/**
 * Format ACWR value for display
 * @param acwr - ACWR ratio or null
 * @returns Formatted string with 2 decimal places or em-dash
 */
export function formatAcwrDisplay(acwr: number | null): string {
  return acwr === null ? "—" : acwr.toFixed(2);
}