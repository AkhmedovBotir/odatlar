const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const;

const WEEKDAYS_LONG = [
  'yakshanba',
  'dushanba',
  'seshanba',
  'chorshanba',
  'payshanba',
  'juma',
  'shanba',
] as const;

const WEEKDAYS_SHORT = [
  'yak.',
  'dush.',
  'sesh.',
  'chor.',
  'pay.',
  'jum.',
  'shan.',
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export type UzbekWeekdayStyle = 'long' | 'short' | false;

export function formatUzbekDate(
  date: Date,
  options?: { weekday?: UzbekWeekdayStyle }
): string {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const base = `${day}-${month}, ${year}`;

  const weekdayStyle = options?.weekday ?? 'long';
  if (weekdayStyle === false) return base;

  const weekday =
    weekdayStyle === 'short'
      ? WEEKDAYS_SHORT[date.getDay()]
      : WEEKDAYS_LONG[date.getDay()];

  return `${base}, ${weekday}`;
}

export function formatUzbekTime(date: Date, withSeconds = true): string {
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  if (!withSeconds) return `${hours}:${minutes}`;
  return `${hours}:${minutes}:${pad2(date.getSeconds())}`;
}

export function formatUzbekDateFromKey(
  dateKey: string,
  options?: { weekday?: UzbekWeekdayStyle }
): string {
  return formatUzbekDate(new Date(`${dateKey}T12:00:00`), options);
}

export function formatUzbekDateTime(
  value: string | Date,
  options?: { weekday?: UzbekWeekdayStyle; withSeconds?: boolean }
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const datePart = formatUzbekDate(date, { weekday: options?.weekday ?? 'short' });
  const timePart = formatUzbekTime(date, options?.withSeconds ?? true);
  return `${datePart} · ${timePart}`;
}

export function formatUzbekDateTimeCompact(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  return `${day}-${month} · ${formatUzbekTime(date, false)}`;
}
