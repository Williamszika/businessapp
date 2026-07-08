/** Génère un identifiant unique court avec préfixe optionnel. */
export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Génère une référence de vente lisible, ex. « ZKA-4F2A ». */
export function saleRef(): string {
  return 'ZKA-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}
