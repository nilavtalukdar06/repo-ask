const UNITS: Array<[suffix: string, seconds: number]> = [
  ["y", 60 * 60 * 24 * 365],
  ["mo", 60 * 60 * 24 * 30],
  ["d", 60 * 60 * 24],
  ["h", 60 * 60],
  ["m", 60],
];

export function formatRelativeTime(date: Date, now: Date = new Date()) {
  const diffSeconds = Math.max(
    0,
    Math.round((now.getTime() - date.getTime()) / 1000),
  );

  for (const [suffix, secondsInUnit] of UNITS) {
    const value = Math.floor(diffSeconds / secondsInUnit);
    if (value >= 1) {
      return `${value}${suffix} ago`;
    }
  }

  return "just now";
}
