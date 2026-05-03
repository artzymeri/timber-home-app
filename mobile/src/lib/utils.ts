type ClassInput = string | false | null | undefined;

/** Tiny clsx replacement — joins truthy class names with a space. */
export function cn(...inputs: ClassInput[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatMoney(n: number | string | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : n || 0;
  return `€${(v as number).toFixed(2)}`;
}

export function formatDate(s: string | Date | null | undefined): string {
  if (!s) return '—';
  const d = typeof s === 'string' ? new Date(s) : s;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
