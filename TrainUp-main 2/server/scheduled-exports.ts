import { CronJob } from "cron";

// Simple export function without database dependencies for now
export async function runDailySheetExport() {
  console.info(`[export] ${new Date().toISOString()} → Daily export placeholder`);
}

/**
 * Starts a CronJob that runs once per day at 00:00 UTC.
 * In dev we default to no-op unless the env var FORCE_EXPORT_SCHEDULER is set.
 */
export function startScheduledExports() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd && !process.env.FORCE_EXPORT_SCHEDULER) return;

  // "0 0 * * *"  → at minute 0, hour 0 every day (UTC)
  const job = new CronJob("0 0 * * *", runDailySheetExport, null, true, "UTC");
  console.info("[export] Daily Google-Sheets export scheduler initialised");
  job.start();
}