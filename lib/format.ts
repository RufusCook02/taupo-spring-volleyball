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

/** Division tag shown on game cards (navy and white theme – divisions are told apart by name, not colour). */
export const DIV_TAG: Record<Division, string> = { W: 'Women', S: 'Social', C: 'Comp' };

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
