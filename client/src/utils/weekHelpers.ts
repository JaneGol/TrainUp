import { getISOWeek, startOfISOWeek, endOfISOWeek, format, parseISO } from 'date-fns';

export const isoWeekInfo = (dateStr: string) => {
  const d = parseISO(dateStr);
  const week = getISOWeek(d);              // 1-53, ISO standard
  const start = startOfISOWeek(d);
  const end = endOfISOWeek(d);
  const range = `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`;
  return { week, range };
};

export const weekKey = (dateStr: string) => {
  const d = parseISO(dateStr);
  return `${d.getFullYear()}-W${String(getISOWeek(d)).padStart(2, "0")}`;
};

export const weekLabel = (key: string) => {
  // "2025-W21" -> "Week 21 (20 – 26 May)"
  const [year, wTag] = key.split("-W");
  const weekNo = +wTag;
  const start = startOfISOWeek(new Date(+year, 0, 4)); // ISO week 1 anchor
  start.setDate(start.getDate() + (weekNo - 1) * 7);
  const end = endOfISOWeek(start);
  return `Week ${weekNo} (${format(start, "d MMM")} – ${format(end, "d MMM")})`;
};

export const bucketByWeek = <T extends { date: string }>(sessions: T[]) => {
  return sessions.reduce((acc, s) => {
    const key = weekKey(s.date);
    (acc[key] ||= []).push(s);
    return acc;
  }, {} as Record<string, T[]>);
};