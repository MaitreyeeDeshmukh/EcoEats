/**
 * Backend constants for the EcoEats API.
 * Centralized magic numbers for maintainability.
 */

/** Number of minutes for a food claim reservation (20 minutes) */
export const RESERVATION_MINUTES = 20;

/** Default expiry time for new listings in minutes (90 minutes) */
export const DEFAULT_EXPIRY_MINUTES = 90;

/** Maximum number of listings returned per query (50) */
export const MAX_LISTINGS_QUERY = 50;

/** Maximum number of claims returned per query (20) */
export const MAX_CLAIMS_QUERY = 20;

/** Default port for the API server (3001) */
export const DEFAULT_PORT = 3001;
