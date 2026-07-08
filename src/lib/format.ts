/**
 * ZKA — Utilitaires de formatage (devise, nombres, dates) en français.
 * Implémentation manuelle pour éviter toute dépendance à Intl/locale sur Hermes.
 */
import type { CurrencyCode } from '@/types';

type CurrencyConfig = {
  code: CurrencyCode;
  symbol: string;
  label: string;
  position: 'before' | 'after';
  decimals: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  XOF: { code: 'XOF', symbol: 'FCFA', label: 'Franc CFA (FCFA)', position: 'after', decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro (€)', position: 'after', decimals: 2 },
  USD: { code: 'USD', symbol: '$', label: 'Dollar US ($)', position: 'before', decimals: 2 },
  MAD: { code: 'MAD', symbol: 'DH', label: 'Dirham (DH)', position: 'after', decimals: 2 },
};

/** Sépare les milliers par une espace insécable fine (style français). */
function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Formate un nombre avec `decimals` décimales et séparateur de milliers. */
export function formatNumber(value: number, decimals = 0): string {
  const neg = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  let out = groupThousands(intPart);
  if (decPart) out += ',' + decPart;
  return (neg ? '-' : '') + out;
}

/** Formate un montant monétaire selon la devise choisie. */
export function formatMoney(value: number, currency: CurrencyCode = 'XOF'): string {
  const c = CURRENCIES[currency];
  const num = formatNumber(value, c.decimals);
  return c.position === 'before' ? `${c.symbol} ${num}` : `${num} ${c.symbol}`;
}

/** Version compacte pour les grands montants (12 500 000 → « 12,5 M »). */
export function formatMoneyCompact(value: number, currency: CurrencyCode = 'XOF'): string {
  const c = CURRENCIES[currency];
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  let short: string;
  if (abs >= 1_000_000_000) short = formatNumber(value / 1_000_000_000, 1).replace(sign, '') + ' Md';
  else if (abs >= 1_000_000) short = formatNumber(value / 1_000_000, 1).replace(sign, '') + ' M';
  else if (abs >= 10_000) short = formatNumber(value / 1_000, 0).replace(sign, '') + ' k';
  else return formatMoney(value, currency);
  return c.position === 'before' ? `${sign}${c.symbol} ${short}` : `${sign}${short} ${c.symbol}`;
}

/** Formate un pourcentage : 0.42 → « +42 % » (avec signe optionnel). */
export function formatPercent(value: number, withSign = false): string {
  const pct = value * 100;
  const sign = withSign && pct > 0 ? '+' : '';
  return `${sign}${formatNumber(pct, Math.abs(pct) < 10 ? 1 : 0)} %`;
}

// ---------------------------------------------------------------------------
// Dates (français, sans dépendance externe)
// ---------------------------------------------------------------------------

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

const pad = (n: number) => (n < 10 ? '0' + n : String(n));

/** « 8 juil. » */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** « 8 juillet 2026 » */
export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** « lun. 8 juil. » */
export function formatDateWithDay(iso: string): string {
  const d = new Date(iso);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** « 14:30 » */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Nom du mois court à partir d'un index 0–11. */
export function monthShort(index: number): string {
  return MONTHS_SHORT[((index % 12) + 12) % 12];
}

export function dayName(index: number): string {
  return DAYS[((index % 7) + 7) % 7];
}

/** Temps relatif : « à l'instant », « il y a 5 min », « Hier », « 8 juil. ». */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24 && d.getDate() === now.getDate()) return `il y a ${diffH} h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) return 'Hier';
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${DAYS_SHORT[d.getDay()]}`;
  return formatDate(iso);
}

/** Salutation selon l'heure. */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/** Initiales à partir d'un nom (« Awa Traoré » → « AT »). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
