/**
 * ZKA — Modèle de données du domaine métier.
 */

export type Role = 'patron' | 'employe';

export type EmployeeStatus = 'actif' | 'conge' | 'inactif';

export interface Employee {
  id: string;
  name: string;
  /** Poste occupé, ex. « Vendeuse », « Magasinier ». */
  position: string;
  phone: string;
  email?: string;
  status: EmployeeStatus;
  /** Date d'embauche (ISO). */
  hiredAt: string;
  /** Salaire mensuel de base. */
  monthlySalary: number;
  /** Taux de commission sur les ventes (0–1). */
  commissionRate: number;
  /** Emoji décoratif optionnel. */
  emoji?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  /** Prix de vente unitaire. */
  price: number;
  /** Coût d'achat unitaire (pour la marge). */
  cost: number;
  /** Quantité en stock. */
  stock: number;
  /** Seuil de réapprovisionnement (alerte stock bas). */
  reorderLevel: number;
  /** Unité, ex. « pièce », « kg ». */
  unit: string;
  emoji: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = 'espèces' | 'carte' | 'mobile' | 'crédit';

export interface Sale {
  id: string;
  reference: string;
  employeeId: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  customer?: string;
  /** Horodatage (ISO). */
  createdAt: string;
  note?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  /** Id de l'expéditeur : id employé ou 'patron'. */
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export type ConversationKind = 'direct' | 'group';

export interface Conversation {
  id: string;
  kind: ConversationKind;
  title: string;
  /** Ids des participants (employés et/ou 'patron'). */
  participantIds: string[];
  emoji?: string;
}

export type CurrencyCode = 'XOF' | 'EUR' | 'USD' | 'MAD';

export interface Settings {
  businessName: string;
  currency: CurrencyCode;
  notificationsEnabled: boolean;
  lowStockAlerts: boolean;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  /** Lien vers la fiche employé si role === 'employe'. */
  employeeId?: string;
  position?: string;
}
