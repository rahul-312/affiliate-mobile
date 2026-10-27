/** Display-only formatting; all money maths happens on the server in integer paise. */

export function formatPaise(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = String(Math.floor(abs / 100));
  const fraction = String(abs % 100).padStart(2, '0');
  // Indian grouping: 12,34,567
  const lastThree = rupees.slice(-3);
  const rest = rupees.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}₹${rest ? `${rest},${lastThree}` : lastThree}.${fraction}`;
}

export const formatBps = (bps: number) => `${Number((bps / 100).toFixed(2))}%`;

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
