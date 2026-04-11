/**
 * Application-wide constants for EcoEats frontend.
 *
 * These constants define polling intervals, quantity limits, and other
 * configuration values used across the application.
 */

/** Polling interval for claims data in milliseconds (15 seconds). */
export const POLL_INTERVAL_CLAIMS_MS = 15000;

/** Polling interval for listings data in milliseconds (20 seconds). */
export const POLL_INTERVAL_LISTINGS_MS = 20000;

/** Maximum quantity allowed for listings and claims. */
export const MAX_QUANTITY = 100;

/** Minimum quantity allowed for listings and claims. */
export const MIN_QUANTITY = 1;
