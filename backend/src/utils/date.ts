// Study cohort is based in Sri Lanka (SLIIT); "resets at midnight" means Sri Lanka
// Standard Time (UTC+5:30), not UTC or the server process's ambient timezone. Fixed
// (no-DST) offset, so this is safe to use directly rather than a named IANA zone.
const APP_TZ_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** Shifts a UTC instant so its UTC getters read as Sri Lanka wall-clock fields. */
function toLocalWallClock(instant: Date): Date {
    return new Date(instant.getTime() + APP_TZ_OFFSET_MS);
}

/** Reverses toLocalWallClock: converts local wall-clock fields back to the real UTC instant. */
function toUtcInstant(localWallClock: Date): Date {
    return new Date(localWallClock.getTime() - APP_TZ_OFFSET_MS);
}

// ISO week number calculator (ISO 8601), grounded in Sri Lanka local time so the week
// boundary lines up with the participant's own calendar week regardless of server timezone.
export function getISOWeekNumber(d: Date): [number, number] {
    const local = toLocalWallClock(d);
    const date = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return [date.getUTCFullYear(), weekNo];
}

/** Start of today at Sri Lanka local midnight (UTC+5:30), returned as the real UTC instant. */
export function startOfToday(): Date {
    const local = toLocalWallClock(new Date());
    const localMidnight = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
    return toUtcInstant(localMidnight);
}

/** Start of next Monday at Sri Lanka local midnight — the weekly reset boundary. */
export function startOfNextLocalMonday(): Date {
    const todayLocalMidnightUtc = startOfToday();
    const localDow = toLocalWallClock(todayLocalMidnightUtc).getUTCDay(); // 0=Sun..6=Sat
    const daysUntilMonday = 8 - (localDow || 7); // 1..7
    return new Date(todayLocalMidnightUtc.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
}
