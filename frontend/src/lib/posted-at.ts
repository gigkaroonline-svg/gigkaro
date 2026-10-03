const MS_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeekMonday(date: Date) {
  const day = startOfLocalDay(date);
  const weekday = day.getDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  day.setDate(day.getDate() - diff);
  return day;
}

function hashSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parsePostedAt(raw: string | undefined, now = new Date()): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(`${trimmed.slice(0, 10)}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : startOfLocalDay(d);
  }
  const lower = trimmed.toLowerCase();
  if (lower === "today") return startOfLocalDay(now);
  if (lower === "yesterday") {
    const d = startOfLocalDay(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  const match = lower.match(/^(\d+)\s+days?\s+ago$/);
  if (match) {
    const d = startOfLocalDay(now);
    d.setDate(d.getDate() - Number(match[1]));
    return d;
  }
  return null;
}

export function effectivePostedDate(
  seed: string,
  raw?: string,
  now = new Date(),
): Date {
  const today = startOfLocalDay(now);
  const parsed = parsePostedAt(raw, now);
  if (parsed) {
    const ageDays = Math.round(
      (today.getTime() - startOfLocalDay(parsed).getTime()) / MS_DAY,
    );
    if (ageDays >= 0 && ageDays < 7) return startOfLocalDay(parsed);
  }

  const weekStart = startOfWeekMonday(today);
  const daysIntoWeek = Math.max(
    0,
    Math.round((today.getTime() - weekStart.getTime()) / MS_DAY),
  );
  const offset = hashSeed(seed) % (daysIntoWeek + 1);
  const fresh = new Date(weekStart);
  fresh.setDate(weekStart.getDate() + offset);
  return fresh;
}

export function formatPostedLabel(date: Date, now = new Date()): string {
  const days = Math.round(
    (startOfLocalDay(now).getTime() - startOfLocalDay(date).getTime()) /
      MS_DAY,
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function resolvePostedAt(
  seed: string,
  raw?: string,
  now = new Date(),
): { iso: string; label: string; date: Date } {
  const date = effectivePostedDate(seed, raw, now);
  return { iso: toIsoDate(date), label: formatPostedLabel(date, now), date };
}
