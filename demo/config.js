/* ZKA — Configuration du serveur partagé (Supabase).
 *
 * Renseignez ici les 2 valeurs PUBLIQUES de votre projet Supabase :
 *   Supabase → Project Settings → API
 *     • Project URL      → url
 *     • clé "anon public" → anonKey
 *
 * Ces deux valeurs sont conçues pour être publiques (protégées par les
 * règles de sécurité de la base). Ne mettez JAMAIS ici la clé "service_role".
 *
 * Tant qu'elles sont vides, l'application reste en mode démonstration local.
 */
window.ZKA_SUPABASE = {
  url: "https://cwfwzwiuhjuyiaaqmhmu.supabase.co",
  // Clé publique (nouveau format Supabase "publishable" ; équivaut à l'ancienne clé "anon").
  anonKey: "sb_publishable_cTkYyHvX9TPT7jMgDlLm4w_TvG5xGZp"
};
