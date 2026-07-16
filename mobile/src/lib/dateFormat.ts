// Formats a UTC-midnight boundary (e.g. a `nextReset` timestamp computed server-side via
// Date.UTC) using its UTC calendar date/weekday, not the device's local timezone.
// `toLocaleDateString()` converts to local time first, which can show a different
// calendar day than the actual UTC boundary depending on the participant's offset —
// this always reflects the real boundary the backend enforces.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatUtcMonthDay(date: Date): string {
    return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatUtcWeekday(date: Date): string {
    return WEEKDAYS[date.getUTCDay()];
}
