/**
 * Scheduling helpers for week-based content unlocking.
 *
 * Effective unlock date precedence:
 *   1. lesson.available_from (explicit override)
 *   2. course.course_start_date + (week_number - 1) * 7 days
 *   3. null (always unlocked)
 */

export function effectiveUnlockDate(
  weekNumber: number | null | undefined,
  availableFrom: string | null | undefined,
  courseStart: string | null | undefined
): Date | null {
  if (availableFrom) {
    const d = new Date(`${availableFrom}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (!weekNumber || !courseStart) return null;
  const start = new Date(`${courseStart}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const result = new Date(start);
  result.setDate(start.getDate() + (Math.max(1, weekNumber) - 1) * 7);
  return result;
}

export function isScheduledLocked(unlockDate: Date | null, now: Date = new Date()): boolean {
  if (!unlockDate) return false;
  return unlockDate.getTime() > now.getTime();
}

/**
 * Friendly date label for the curriculum UI.
 * "May 12" if same year, "May 12, 2027" otherwise.
 */
export function fmtUnlockDate(d: Date | null): string {
  if (!d) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

/** Current week number relative to course_start_date (Mon-anchored). */
export function currentWeekNumber(courseStart: string | null | undefined, now: Date = new Date()): number | null {
  if (!courseStart) return null;
  const start = new Date(`${courseStart}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  return Math.floor(days / 7) + 1;
}
