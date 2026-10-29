import { kindOf, type TemplateKind } from '@otl/shared';

export function countLabel(kind: TemplateKind, n: number) {
  const unit = kindOf(kind).previewUnit;
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 7) return relative.format(Math.round(seconds / 86400), 'day');
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}
