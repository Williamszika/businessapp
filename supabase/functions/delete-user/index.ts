// ZKA — Fonction serveur : supprimer un compte (réservée au PRÉSIDENT).
// Supprime l'utilisateur Auth (et son profil, en cascade). Le président ne
// peut pas se supprimer lui-même.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: who } = await caller.auth.getUser();
    if (!who?.user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(url, service);
    const { data: prof } = await admin.from("profiles").select("role, sup").eq("id", who.user.id).maybeSingle();
    if (!prof || prof.role !== "boss" || prof.sup !== true) return json({ error: "Réservé au président" }, 403);

    const body = await req.json().catch(() => ({}));
    const target = body.id ?? "";
    if (!target) return json({ error: "Compte cible manquant" }, 400);
    if (target === who.user.id) return json({ error: "Le président ne peut pas se supprimer lui-même" }, 400);

    const { error } = await admin.auth.admin.deleteUser(target);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
