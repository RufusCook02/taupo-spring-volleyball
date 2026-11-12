import type { Division } from '@/data/draw';

/** '08:00' → '8:00am', '13:00' → '1:00pm' */
export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

export function fmtDiff(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export const DIV_STYLE: Record<Division, { badge: string; border: string; bg: string }> = {
  W: { badge: 'bg-pink-600 text-white', border: 'border-pink-400', bg: 'bg-pink-50' },
  S: { badge: 'bg-green-700 text-white', border: 'border-green-500', bg: 'bg-green-50' },
  C: { badge: 'bg-blue-700 text-white', border: 'border-blue-500', bg: 'bg-blue-50' },
};

export const DIV_BY_SLUG: Record<string, Division> = { women: 'W', social: 'S', comp: 'C' };

export function fmtNz(iso: string): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso));
}
