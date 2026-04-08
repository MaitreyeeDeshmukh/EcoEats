// src/utils/foodSafety.ts
export interface TimeRemaining {
  minutes: number;
  display: string;
}

export function getTimeRemaining(expiresAt: Date | null): TimeRemaining | null {
  if (!expiresAt) return null;

  const now = Date.now();
  const expiry = expiresAt.getTime();
  const diffMs = expiry - now;

  if (diffMs <= 0) {
    return { minutes: 0, display: 'Expired' };
  }

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  let display: string;
  if (hours > 0) {
    display = `${hours}h ${mins}m left`;
  } else if (mins > 0) {
    display = `${mins}m left`;
  } else {
    const seconds = Math.floor(diffMs / 1000);
    display = `${seconds}s left`;
  }

  return { minutes, display };
}

export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= Date.now();
}

export function isExpiringSoon(expiresAt: Date | null, thresholdMinutes: number = 15): boolean {
  if (!expiresAt) return false;
  const remaining = getTimeRemaining(expiresAt);
  return remaining ? remaining.minutes < thresholdMinutes : false;
}
