/**
 * ZKA — Fonctions d'analyse métier (pures) : chiffre d'affaires, marges,
 * classements, alertes de stock. Opèrent sur des tableaux, sans état.
 */
import type { Employee, PaymentMethod, Product, Sale } from '@/types';

import { monthShort } from './format';

const DAY = 86400000;

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function daysAgo(n: number, from: Date = new Date()): Date {
  return new Date(startOfDay(from).getTime() - n * DAY);
}

export function sumTotals(sales: Sale[]): number {
  return sales.reduce((s, x) => s + x.total, 0);
}

export function salesBetween(sales: Sale[], from: Date, to: Date): Sale[] {
  const a = from.getTime();
  const b = to.getTime();
  return sales.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    return t >= a && t < b;
  });
}

/** Chiffre d'affaires des N derniers jours (glissant). */
export function revenueLastDays(sales: Sale[], days: number, now: Date = new Date()): number {
  return sumTotals(salesBetween(sales, daysAgo(days - 1, now), new Date(now.getTime() + DAY)));
}

export type Delta = { value: number; ratio: number; positive: boolean };

/** Compare une période à la précédente de même durée. */
export function periodDelta(sales: Sale[], days: number, now: Date = new Date()): Delta {
  const end = new Date(startOfDay(now).getTime() + DAY);
  const midStart = new Date(end.getTime() - days * DAY);
  const prevStart = new Date(midStart.getTime() - days * DAY);
  const current = sumTotals(salesBetween(sales, midStart, end));
  const previous = sumTotals(salesBetween(sales, prevStart, midStart));
  const value = current - previous;
  const ratio = previous === 0 ? (current > 0 ? 1 : 0) : value / previous;
  return { value, ratio, positive: value >= 0 };
}

export type SeriesPoint = { label: string; value: number; key: string };

/** Série journalière du CA sur les N derniers jours. */
export function dailySeries(sales: Sale[], days: number, now: Date = new Date()): SeriesPoint[] {
  const today = startOfDay(now);
  const buckets: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today.getTime() - i * DAY);
    buckets.push({ key: day.toISOString(), label: String(day.getDate()), value: 0 });
  }
  const index = new Map(buckets.map((b, i) => [startOfDay(new Date(b.key)).getTime(), i]));
  for (const s of sales) {
    const t = startOfDay(new Date(s.createdAt)).getTime();
    const i = index.get(t);
    if (i !== undefined) buckets[i].value += s.total;
  }
  return buckets;
}

/** Série mensuelle du CA sur les N derniers mois. */
export function monthlySeries(sales: Sale[], months: number, now: Date = new Date()): SeriesPoint[] {
  const buckets: SeriesPoint[] = [];
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = months - 1; i >= 0; i--) {
    const m = new Date(base.getFullYear(), base.getMonth() - i, 1);
    buckets.push({ key: `${m.getFullYear()}-${m.getMonth()}`, label: monthShort(m.getMonth()), value: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const s of sales) {
    const d = new Date(s.createdAt);
    const i = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i !== undefined) buckets[i].value += s.total;
  }
  return buckets;
}

export type EmployeeSales = {
  employee: Employee;
  count: number;
  revenue: number;
  commission: number;
};

/** Ventes agrégées par employé, triées par CA décroissant. */
export function salesByEmployee(sales: Sale[], employees: Employee[]): EmployeeSales[] {
  const map = new Map<string, { count: number; revenue: number }>();
  for (const s of sales) {
    const cur = map.get(s.employeeId) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += s.total;
    map.set(s.employeeId, cur);
  }
  return employees
    .map((employee) => {
      const agg = map.get(employee.id) ?? { count: 0, revenue: 0 };
      return {
        employee,
        count: agg.count,
        revenue: agg.revenue,
        commission: Math.round(agg.revenue * employee.commissionRate),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function revenueForEmployee(sales: Sale[], employeeId: string): number {
  return sumTotals(sales.filter((s) => s.employeeId === employeeId));
}

export type ProductSales = { product: Product; quantity: number; revenue: number };

/** Meilleurs produits par CA. */
export function topProducts(sales: Sale[], products: Product[], limit = 5): ProductSales[] {
  const map = new Map<string, { quantity: number; revenue: number }>();
  for (const s of sales) {
    for (const it of s.items) {
      const cur = map.get(it.productId) ?? { quantity: 0, revenue: 0 };
      cur.quantity += it.quantity;
      cur.revenue += it.quantity * it.unitPrice;
      map.set(it.productId, cur);
    }
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  return [...map.entries()]
    .map(([id, agg]) => ({ product: byId.get(id), ...agg }))
    .filter((x): x is ProductSales => Boolean(x.product))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Produits dont le stock est au niveau de réappro ou en dessous. */
export function lowStockProducts(products: Product[]): Product[] {
  return products
    .filter((p) => p.stock <= p.reorderLevel)
    .sort((a, b) => a.stock - b.stock);
}

/** Valeur du stock (au prix de vente). */
export function stockRetailValue(products: Product[]): number {
  return products.reduce((s, p) => s + p.price * p.stock, 0);
}

/** Valeur du stock (au coût d'achat). */
export function stockCostValue(products: Product[]): number {
  return products.reduce((s, p) => s + p.cost * p.stock, 0);
}

/** Marge brute estimée sur les ventes. */
export function grossMargin(sales: Sale[], products: Product[]): number {
  const cost = new Map(products.map((p) => [p.id, p.cost]));
  let margin = 0;
  for (const s of sales) {
    for (const it of s.items) {
      const c = cost.get(it.productId) ?? 0;
      margin += (it.unitPrice - c) * it.quantity;
    }
  }
  return margin;
}

export type PaymentSlice = { method: PaymentMethod; total: number; count: number };

export function paymentBreakdown(sales: Sale[]): PaymentSlice[] {
  const methods: PaymentMethod[] = ['espèces', 'mobile', 'carte', 'crédit'];
  const map = new Map<PaymentMethod, { total: number; count: number }>();
  for (const s of sales) {
    const cur = map.get(s.paymentMethod) ?? { total: 0, count: 0 };
    cur.total += s.total;
    cur.count += 1;
    map.set(s.paymentMethod, cur);
  }
  return methods
    .map((method) => ({ method, ...(map.get(method) ?? { total: 0, count: 0 }) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.total - a.total);
}

/** Nombre de ventes du jour. */
export function salesToday(sales: Sale[], now: Date = new Date()): Sale[] {
  const start = startOfDay(now);
  const end = new Date(start.getTime() + DAY);
  return salesBetween(sales, start, end);
}
