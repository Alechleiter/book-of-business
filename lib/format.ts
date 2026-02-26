export function fmt(n: number | null | undefined): string {
  if (n == null || n === undefined) return '—';
  return Number(n).toLocaleString();
}

export function fmtCurrency(n: number | null | undefined): string {
  if (!n || n === 0) return '—';
  return '$' + Math.round(n).toLocaleString();
}

export function fmtPercent(n: number | null | undefined): string {
  if (!n || n === 0) return '—';
  return n.toFixed(1) + '%';
}

export function fmtPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
