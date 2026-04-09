// src/utils/distance.ts
export interface Coordinates {
	lat: number;
	lng: number;
}

export function calculateDistance(from: Coordinates, to: Coordinates): number {
	// Validate coordinates
	if (
		!Number.isFinite(from.lat) ||
		!Number.isFinite(from.lng) ||
		!Number.isFinite(to.lat) ||
		!Number.isFinite(to.lng)
	) {
		return NaN;
	}
	if (from.lat < -90 || from.lat > 90 || to.lat < -90 || to.lat > 90) {
		return NaN;
	}
	if (from.lng < -180 || from.lng > 180 || to.lng < -180 || to.lng > 180) {
		return NaN;
	}

	const R = 6371000; // Earth's radius in meters
	const lat1 = (from.lat * Math.PI) / 180;
	const lat2 = (to.lat * Math.PI) / 180;
	const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
	const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

	const a =
		Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
		Math.cos(lat1) *
			Math.cos(lat2) *
			Math.sin(deltaLng / 2) *
			Math.sin(deltaLng / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // Distance in meters
}

export function isWithinRadius(
	center: Coordinates,
	point: Coordinates,
	radiusMiles: number,
): boolean {
	const radiusMeters = radiusMiles * 1609.34;
	const distance = calculateDistance(center, point);
	return distance <= radiusMeters;
}
