// ZKA — Edge Function "notify" (déployée sous le nom "super-handler")
// Envoie une notification push aux destinataires quand :
//   • un message de chat est inséré (table "messages"), ou
//   • une notification métier est insérée (table "notifications" :
//     stock, demandes, ventes à crédit, versements, alertes…).
// Déclenchée par un trigger pg_net sur INSERT.
//
// Secrets à définir (Project Settings → Edge Functions → Secrets) :
//   VAPID_PUBLIC   = clé publique VAPID (même que demo/config.js → vapidPublic)
//   VAPID_PRIVATE  = clé privée VAPID
//   VAPID_SUBJECT  = mailto:vous@exemple.com   (optionnel)
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.)

import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@zka.app";
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Envoie le même payload à tous les abonnements des `targets`, en purgeant
// les abonnements expirés (404/410).
async function pushTo(targets: string[], payload: Record<string, unknown>) {
  targets = targets.filter((id) => !!id);
  if (!targets.length) return;
  const { data: subs } = await supabase.from("push_subscriptions").select("*").in("user_id", targets);
  await Promise.all((subs || []).map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
    } catch (err: any) {
      if (err && (err.statusCode === 404 || err.statusCode === 410)) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }));
}

Deno.serve(async (req) => {
  let payload: any = {};
  try { payload = await req.json(); } catch (_) { /* ignore */ }
  const table = payload.table;
  const rec = payload.record;
  if (!rec) return new Response("no record", { status: 200 });

  // ---- Notifications métier ----
  if (table === "notifications") {
    if (!rec.user_id) return new Response("no target", { status: 200 });
    await pushTo([rec.user_id], {
      title: rec.title || "ZKA",
      body: rec.body || "",
      tag: "notif-" + (rec.kind || "info"),
    });
    return new Response("ok", { status: 200 });
  }

  // ---- Messages du chat ----
  const m = rec;
  if (!m.sender_id) return new Response("no record", { status: 200 });

  let targets: string[] = [];
  if (m.scope === "dm" && m.recipient_id) {
    targets = [m.recipient_id];
  } else if (m.scope === "public") {
    const { data } = await supabase.from("profiles").select("id");
    targets = (data || []).map((p: any) => p.id);
  }
  targets = targets.filter((id) => id && id !== m.sender_id);
  if (!targets.length) return new Response("no targets", { status: 200 });

  const { data: sender } = await supabase.from("profiles").select("name").eq("id", m.sender_id).maybeSingle();
  const who = (sender && sender.name) || "Message";
  const title = m.scope === "public" ? `💬 ${who} (public)` : `🔒 ${who}`;
  const body = m.kind === "text" ? (m.body || "")
    : m.kind === "image" ? "📷 Photo"
    : m.kind === "audio" ? "🎤 Message vocal"
    : "📎 Document";

  await pushTo(targets, { title, body, tag: m.scope === "dm" ? "dm-" + m.sender_id : "public" });
  return new Response("ok", { status: 200 });
});
