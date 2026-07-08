import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createSeed } from '@/data/seed';
import { saleRef, uid } from '@/lib/id';
import type {
  Conversation,
  Employee,
  EmployeeStatus,
  Message,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  Settings,
} from '@/types';

export interface NewSaleInput {
  employeeId: string;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  customer?: string;
  note?: string;
}

export interface NewEmployeeInput {
  name: string;
  position: string;
  phone: string;
  email?: string;
  monthlySalary: number;
  commissionRate: number;
  status?: EmployeeStatus;
  emoji?: string;
}

export interface NewProductInput {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  unit: string;
  emoji: string;
  sku?: string;
}

interface DataState {
  employees: Employee[];
  products: Product[];
  sales: Sale[];
  conversations: Conversation[];
  messages: Message[];
  settings: Settings;
  _hydrated: boolean;

  setHydrated: (v: boolean) => void;

  // Équipe
  addEmployee: (input: NewEmployeeInput) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;

  // Stock
  addProduct: (input: NewProductInput) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  adjustStock: (id: string, delta: number) => void;
  removeProduct: (id: string) => void;

  // Ventes
  addSale: (input: NewSaleInput) => Sale;

  // Messagerie
  sendMessage: (conversationId: string, senderId: string, senderName: string, text: string) => void;
  markConversationRead: (conversationId: string, viewerId: string) => void;
  /** Renvoie l'id d'une conversation directe entre deux participants, la créant au besoin. */
  getOrCreateDirectConversation: (participantAId: string, participantBId: string) => string;

  // Réglages
  updateSettings: (patch: Partial<Settings>) => void;

  resetDemo: () => void;
}

const seed = createSeed();

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      employees: seed.employees,
      products: seed.products,
      sales: seed.sales,
      conversations: seed.conversations,
      messages: seed.messages,
      settings: seed.settings,
      _hydrated: false,

      setHydrated: (v) => set({ _hydrated: v }),

      addEmployee: (input) => {
        const employee: Employee = {
          id: uid('emp-'),
          name: input.name.trim(),
          position: input.position.trim(),
          phone: input.phone.trim(),
          email: input.email?.trim() || undefined,
          status: input.status ?? 'actif',
          hiredAt: new Date().toISOString(),
          monthlySalary: input.monthlySalary,
          commissionRate: input.commissionRate,
          emoji: input.emoji,
        };
        set((s) => ({ employees: [...s.employees, employee] }));
        return employee;
      },

      updateEmployee: (id, patch) =>
        set((s) => ({
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      removeEmployee: (id) =>
        set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),

      addProduct: (input) => {
        const product: Product = {
          id: uid('prod-'),
          name: input.name.trim(),
          sku: input.sku?.trim() || 'ZKA-' + Math.floor(1000 + Math.random() * 9000),
          category: input.category.trim(),
          price: input.price,
          cost: input.cost,
          stock: input.stock,
          reorderLevel: input.reorderLevel,
          unit: input.unit.trim() || 'pièce',
          emoji: input.emoji || '📦',
        };
        set((s) => ({ products: [...s.products, product] }));
        return product;
      },

      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      adjustStock: (id, delta) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
          ),
        })),

      removeProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addSale: (input) => {
        const total = input.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
        const sale: Sale = {
          id: uid('sale-'),
          reference: saleRef(),
          employeeId: input.employeeId,
          items: input.items,
          total,
          paymentMethod: input.paymentMethod,
          customer: input.customer?.trim() || undefined,
          note: input.note?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        set((s) => {
          // Décrémenter le stock vendu
          const stockDelta = new Map<string, number>();
          for (const it of input.items) {
            stockDelta.set(it.productId, (stockDelta.get(it.productId) ?? 0) + it.quantity);
          }
          const products = s.products.map((p) =>
            stockDelta.has(p.id) ? { ...p, stock: Math.max(0, p.stock - stockDelta.get(p.id)!) } : p,
          );
          return { sales: [sale, ...s.sales], products };
        });
        return sale;
      },

      sendMessage: (conversationId, senderId, senderName, text) => {
        const message: Message = {
          id: uid('msg-'),
          conversationId,
          senderId,
          senderName,
          text: text.trim(),
          createdAt: new Date().toISOString(),
          read: true,
        };
        set((s) => ({ messages: [...s.messages, message] }));
      },

      markConversationRead: (conversationId, viewerId) => {
        const hasUnread = get().messages.some(
          (m) => m.conversationId === conversationId && m.senderId !== viewerId && !m.read,
        );
        if (!hasUnread) return;
        set((s) => ({
          messages: s.messages.map((m) =>
            m.conversationId === conversationId && m.senderId !== viewerId && !m.read
              ? { ...m, read: true }
              : m,
          ),
        }));
      },

      getOrCreateDirectConversation: (aId, bId) => {
        const existing = get().conversations.find(
          (c) => c.kind === 'direct' && c.participantIds.includes(aId) && c.participantIds.includes(bId),
        );
        if (existing) return existing.id;
        const other = get().employees.find((e) => e.id === bId) ?? get().employees.find((e) => e.id === aId);
        const conversation: Conversation = {
          id: uid('conv-'),
          kind: 'direct',
          title: other?.name ?? 'Discussion',
          participantIds: [aId, bId],
        };
        set((s) => ({ conversations: [...s.conversations, conversation] }));
        return conversation.id;
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetDemo: () => {
        const fresh = createSeed();
        set({
          employees: fresh.employees,
          products: fresh.products,
          sales: fresh.sales,
          conversations: fresh.conversations,
          messages: fresh.messages,
          settings: fresh.settings,
        });
      },
    }),
    {
      name: 'zka-data-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        employees: s.employees,
        products: s.products,
        sales: s.sales,
        conversations: s.conversations,
        messages: s.messages,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
