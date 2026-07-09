// ZKA — Fonction serveur : créer un compte (réservée à la direction).
// Déployée dans Supabase (Edge Functions). Le boss l'appelle depuis l'app ;
// elle vérifie que l'appelant est bien "boss", puis crée le compte (email +
// mot de passe) et son profil (rôle, rattachement) avec la clé d'administration
// — qui ne quitte jamais le serveur.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Identifier l'appelant à partir de son jeton, et vérifier qu'il est "boss".
    const authHeader = req.headers.get("Authorization") ?? "";
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: who } = await caller.auth.getUser();
    if (!who?.user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(url, service);
    const { data: prof } = await admin
      .from("profiles").select("role").eq("id", who.user.id).maybeSingle();
    if (!prof || prof.role !== "boss") {
      return json({ error: "Réservé à la direction" }, 403);
    }

    // 2) Lire les données du nouveau compte.
    const body = await req.json().catch(() => ({}));
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const name = (body.name ?? "").trim() || email.split("@")[0];
    const roleWanted = ["boss", "responsable", "commercial"].includes(body.role) ? body.role : "commercial";
    const mgr = body.mgr || null;

    if (!email || !password) return json({ error: "Email et mot de passe requis" }, 400);
    if (password.length < 6) return json({ error: "Mot de passe : au moins 6 caractères" }, 400);

    // 3) Créer le compte (confirmé d'office) puis renseigner son profil.
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (cErr) return json({ error: cErr.message }, 400);

    const { error: pErr } = await admin.from("profiles").upsert({
      id: created.user!.id, name, role: roleWanted, mgr,
    });
    if (pErr) return json({ error: pErr.message }, 400);

    return json({ ok: true, id: created.user!.id, email });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
