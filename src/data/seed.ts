/**
 * ZKA — Données de démonstration.
 * Générées au premier lancement puis persistées. Représentent une boutique
 * ZKA type avec équipe, stock, conversations et ~45 jours de ventes.
 */
import { uid } from '@/lib/id';
import type {
  Conversation,
  Employee,
  Message,
  PaymentMethod,
  Product,
  Sale,
  Settings,
} from '@/types';

export const PATRON_ID = 'patron';

const DAY = 86400000;

export const seedEmployees: Employee[] = [
  { id: 'emp-awa', name: 'Awa Traoré', position: 'Vendeuse', phone: '+225 07 12 34 56', email: 'awa@zka.app', status: 'actif', hiredAt: '2023-03-14', monthlySalary: 165000, commissionRate: 0.04, emoji: '👩🏾‍💼' },
  { id: 'emp-marie', name: "Marie N'Guessan", position: 'Responsable boutique', phone: '+225 05 98 76 54', email: 'marie@zka.app', status: 'actif', hiredAt: '2022-06-01', monthlySalary: 320000, commissionRate: 0.03, emoji: '👩🏾‍🔧' },
  { id: 'emp-jean', name: 'Jean-Luc Kaboré', position: 'Commercial', phone: '+226 70 11 22 33', email: 'jeanluc@zka.app', status: 'actif', hiredAt: '2023-09-20', monthlySalary: 190000, commissionRate: 0.05, emoji: '🧑🏾‍💼' },
  { id: 'emp-fatou', name: 'Fatou Diop', position: 'Caissière', phone: '+221 77 44 55 66', email: 'fatou@zka.app', status: 'actif', hiredAt: '2024-01-08', monthlySalary: 140000, commissionRate: 0.02, emoji: '👩🏾‍💻' },
  { id: 'emp-koffi', name: 'Koffi Mensah', position: 'Magasinier', phone: '+233 24 77 88 99', email: 'koffi@zka.app', status: 'actif', hiredAt: '2023-11-15', monthlySalary: 150000, commissionRate: 0.01, emoji: '🧑🏿‍🏭' },
  { id: 'emp-ibrahim', name: 'Ibrahim Sow', position: 'Livreur', phone: '+223 66 33 22 11', email: 'ibrahim@zka.app', status: 'conge', hiredAt: '2024-04-02', monthlySalary: 120000, commissionRate: 0.01, emoji: '🧑🏾‍✈️' },
];

export const seedProducts: Product[] = [
  { id: 'prod-coca', name: 'Coca-Cola 33cl', sku: 'BOI-001', category: 'Boissons', price: 500, cost: 300, stock: 124, reorderLevel: 40, unit: 'pièce', emoji: '🥤' },
  { id: 'prod-eau', name: 'Eau minérale 1,5L', sku: 'BOI-002', category: 'Boissons', price: 400, cost: 250, stock: 78, reorderLevel: 30, unit: 'pièce', emoji: '💧' },
  { id: 'prod-riz', name: 'Riz parfumé 5kg', sku: 'EPI-001', category: 'Épicerie', price: 6500, cost: 5200, stock: 26, reorderLevel: 10, unit: 'sac', emoji: '🍚' },
  { id: 'prod-huile', name: 'Huile végétale 1L', sku: 'EPI-002', category: 'Épicerie', price: 1800, cost: 1400, stock: 8, reorderLevel: 15, unit: 'bouteille', emoji: '🛢️' },
  { id: 'prod-savon', name: 'Savon de Marseille', sku: 'HYG-001', category: 'Hygiène', price: 750, cost: 450, stock: 62, reorderLevel: 25, unit: 'pièce', emoji: '🧼' },
  { id: 'prod-dentifrice', name: 'Dentifrice menthe', sku: 'HYG-002', category: 'Hygiène', price: 1200, cost: 800, stock: 16, reorderLevel: 20, unit: 'pièce', emoji: '🪥' },
  { id: 'prod-cafe', name: 'Café soluble 200g', sku: 'EPI-003', category: 'Épicerie', price: 3500, cost: 2600, stock: 22, reorderLevel: 12, unit: 'pot', emoji: '☕' },
  { id: 'prod-lait', name: 'Lait en poudre 400g', sku: 'EPI-004', category: 'Épicerie', price: 2800, cost: 2100, stock: 5, reorderLevel: 10, unit: 'boîte', emoji: '🥛' },
  { id: 'prod-cable', name: 'Câble USB-C', sku: 'ACC-001', category: 'Accessoires', price: 3000, cost: 1200, stock: 41, reorderLevel: 15, unit: 'pièce', emoji: '🔌' },
  { id: 'prod-ecouteurs', name: 'Écouteurs sans fil', sku: 'ACC-002', category: 'Accessoires', price: 12500, cost: 7500, stock: 14, reorderLevel: 8, unit: 'pièce', emoji: '🎧' },
  { id: 'prod-tshirt', name: 'T-shirt coton', sku: 'VET-001', category: 'Vêtements', price: 4500, cost: 2500, stock: 37, reorderLevel: 12, unit: 'pièce', emoji: '👕' },
  { id: 'prod-casquette', name: 'Casquette ZKA', sku: 'VET-002', category: 'Vêtements', price: 3500, cost: 1500, stock: 6, reorderLevel: 10, unit: 'pièce', emoji: '🧢' },
  { id: 'prod-biscuits', name: 'Biscuits chocolat', sku: 'EPI-005', category: 'Épicerie', price: 900, cost: 600, stock: 96, reorderLevel: 30, unit: 'paquet', emoji: '🍪' },
  { id: 'prod-sucre', name: 'Sucre 1kg', sku: 'EPI-006', category: 'Épicerie', price: 1000, cost: 750, stock: 44, reorderLevel: 20, unit: 'paquet', emoji: '🧂' },
];

const SELLERS = ['emp-awa', 'emp-marie', 'emp-jean', 'emp-fatou'];
const PAYMENTS: PaymentMethod[] = ['espèces', 'espèces', 'mobile', 'mobile', 'carte', 'crédit'];
const CUSTOMERS = [
  'Client comptant', 'M. Diallo', 'Mme Koné', 'Boutique Chez Ada', 'Restaurant Le Baobab',
  'M. Ouédraogo', 'Pharmacie du Rond-Point', 'Mme Bamba', 'Kiosque Central', undefined,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Génère un historique de ventes réaliste sur `days` jours. */
export function generateSales(days = 45, now: Date = new Date()): Sale[] {
  const sales: Sale[] = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(today.getTime() - d * DAY);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const count = weekend ? randInt(3, 6) : randInt(1, 5);
    for (let n = 0; n < count; n++) {
      const itemCount = randInt(1, 4);
      const chosen = new Set<Product>();
      while (chosen.size < itemCount) chosen.add(pick(seedProducts));
      const items = [...chosen].map((p) => ({
        productId: p.id,
        name: p.name,
        quantity: randInt(1, 3),
        unitPrice: p.price,
      }));
      const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
      const when = new Date(date);
      when.setHours(randInt(8, 19), randInt(0, 59), 0, 0);
      sales.push({
        id: uid('sale-'),
        reference: 'ZKA-' + (10000 + sales.length).toString(),
        employeeId: pick(SELLERS),
        items,
        total,
        paymentMethod: pick(PAYMENTS),
        customer: pick(CUSTOMERS),
        createdAt: when.toISOString(),
      });
    }
  }
  return sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const seedConversations: Conversation[] = [
  { id: 'conv-equipe', kind: 'group', title: 'Équipe ZKA', participantIds: [PATRON_ID, 'emp-awa', 'emp-marie', 'emp-jean', 'emp-fatou', 'emp-koffi', 'emp-ibrahim'], emoji: '🏪' },
  { id: 'conv-awa', kind: 'direct', title: 'Awa Traoré', participantIds: [PATRON_ID, 'emp-awa'] },
  { id: 'conv-marie', kind: 'direct', title: "Marie N'Guessan", participantIds: [PATRON_ID, 'emp-marie'] },
  { id: 'conv-koffi', kind: 'direct', title: 'Koffi Mensah', participantIds: [PATRON_ID, 'emp-koffi'] },
];

export function generateMessages(now: Date = new Date()): Message[] {
  const t = now.getTime();
  const m = (conversationId: string, senderId: string, senderName: string, text: string, minsAgo: number, read = true): Message => ({
    id: uid('msg-'),
    conversationId,
    senderId,
    senderName,
    text,
    createdAt: new Date(t - minsAgo * 60000).toISOString(),
    read,
  });
  return [
    // Groupe Équipe ZKA
    m('conv-equipe', PATRON_ID, 'Direction', "Bonjour l'équipe 👋 Bonne semaine à tous, on vise un bon chiffre !", 60 * 26),
    m('conv-equipe', 'emp-marie', "Marie N'Guessan", "Bonjour patron ! On est motivés 💪", 60 * 25),
    m('conv-equipe', 'emp-koffi', 'Koffi Mensah', 'Attention, il ne reste plus beaucoup de lait en poudre et d\'huile.', 60 * 8),
    m('conv-equipe', PATRON_ID, 'Direction', 'Bien vu Koffi, je passe commande aujourd\'hui.', 60 * 7),
    m('conv-equipe', 'emp-awa', 'Awa Traoré', 'Grosse journée aujourd\'hui, beaucoup de passage 🎉', 42, false),
    // Direct Awa
    m('conv-awa', 'emp-awa', 'Awa Traoré', 'Patron, un client demande une remise sur 10 t-shirts, je fais quoi ?', 95),
    m('conv-awa', PATRON_ID, 'Direction', 'Tu peux accorder 10 % max pour cette quantité 👍', 90),
    m('conv-awa', 'emp-awa', 'Awa Traoré', 'Parfait, merci !', 88, false),
    // Direct Marie
    m('conv-marie', PATRON_ID, 'Direction', 'Marie, peux-tu me faire le point des ventes ce soir ?', 200),
    m('conv-marie', 'emp-marie', "Marie N'Guessan", 'Oui bien sûr, je t\'envoie le récap à 19h.', 195, false),
    // Direct Koffi
    m('conv-koffi', 'emp-koffi', 'Koffi Mensah', 'Le réassort de savon est arrivé, tout est rangé.', 320),
    m('conv-koffi', PATRON_ID, 'Direction', 'Super, merci Koffi 🙏', 315),
  ];
}

export const defaultSettings: Settings = {
  businessName: 'ZKA',
  currency: 'XOF',
  notificationsEnabled: true,
  lowStockAlerts: true,
};

export function createSeed(now: Date = new Date()) {
  return {
    employees: seedEmployees,
    products: seedProducts,
    sales: generateSales(45, now),
    conversations: seedConversations,
    messages: generateMessages(now),
    settings: defaultSettings,
  };
}
