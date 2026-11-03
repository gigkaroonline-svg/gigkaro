/**
 * Weekly synthetic postedAt bumps were removed — they looked like fake
 * freshness to Google Jobs. Keep this no-op so existing call sites compile.
 */
export function maybeRefreshPostedDates() {
  // intentionally empty
}
