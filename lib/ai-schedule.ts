export function amsterdamDateTime(value: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const get = (kind: string) => parts.find(p => p.type === kind)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
// Reject nonexistent DST times; choose the first occurrence when clocks fall back.
export function fromAmsterdamDateTime(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const wall = Date.parse(`${value}:00Z`);
  for (const offset of [2, 1]) {
    const candidate = new Date(wall - offset * 3600_000);
    if (Number.isFinite(candidate.getTime()) && amsterdamDateTime(candidate.toISOString()) === value) return candidate.toISOString();
  }
  return null;
}
export function nextAmsterdamWeek(value: string) {
  const wall = amsterdamDateTime(value);
  const next = new Date(`${wall}:00Z`);
  next.setUTCDate(next.getUTCDate() + 7);
  const candidate = next.toISOString().slice(0, 16);
  return fromAmsterdamDateTime(candidate) ?? fromAmsterdamDateTime(`${candidate.slice(0, 11)}03:00`)!;
}
