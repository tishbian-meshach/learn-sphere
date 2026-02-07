import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const BADGE_THRESHOLDS = {
  NEWBIE: 20,
  EXPLORER: 40,
  ACHIEVER: 60,
  SPECIALIST: 80,
  EXPERT: 100,
  MASTER: 120,
} as const;

export function getBadgeLevel(points: number): keyof typeof BADGE_THRESHOLDS {
  if (points >= 120) return 'MASTER';
  if (points >= 100) return 'EXPERT';
  if (points >= 80) return 'SPECIALIST';
  if (points >= 60) return 'ACHIEVER';
  if (points >= 40) return 'EXPLORER';
  return 'NEWBIE';
}

export function getNextBadgeProgress(points: number): { current: string; next: string; progress: number } {
  const levels = Object.entries(BADGE_THRESHOLDS) as [keyof typeof BADGE_THRESHOLDS, number][];

  for (let i = 0; i < levels.length - 1; i++) {
    const [currentLevel, currentThreshold] = levels[i];
    const [nextLevel, nextThreshold] = levels[i + 1];

    if (points < nextThreshold) {
      return {
        current: currentLevel,
        next: nextLevel,
        progress: ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100,
      };
    }
  }

  return { current: 'MASTER', next: 'MASTER', progress: 100 };
}
