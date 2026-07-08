import { useAuth } from './useAuth';
import { useData } from './useData';

export { useAuth } from './useAuth';
export { useData } from './useData';
export type { NewEmployeeInput, NewProductInput, NewSaleInput } from './useData';

/** Devise active (code) pour le formatage monétaire. */
export function useCurrency() {
  return useData((s) => s.settings.currency);
}

/** Réglages de l'application. */
export function useSettings() {
  return useData((s) => s.settings);
}

/** Utilisateur connecté. */
export function useCurrentUser() {
  return useAuth((s) => s.user);
}

/** Vrai si l'utilisateur connecté est le patron. */
export function useIsPatron() {
  return useAuth((s) => s.user?.role === 'patron');
}

/** État d'hydratation combiné des deux stores persistés. */
export function useStoresHydrated() {
  const dataReady = useData((s) => s._hydrated);
  const authReady = useAuth((s) => s._hydrated);
  return dataReady && authReady;
}
