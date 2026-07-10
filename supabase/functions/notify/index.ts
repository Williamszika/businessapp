// ZKA — Edge Function "notify"
// Envoie une notification push aux destinataires quand un message est inséré.
// Déclenchée par un Database Webhook (Supabase) sur INSERT de public.messages.
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

Deno.serve(async (req) => {
  let payload: any = {};
  try { payload = await req.json(); } catch (_) { /* ignore */ }
  const m = payload.record;
  if (!m || !m.sender_id) return new Response("no record", { status: 200 });

  // Destinataires
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

  const { data: subs } = await supabase.from("push_subscriptions").select("*").in("user_id", targets);
  await Promise.all((subs || []).map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, tag: m.scope === "dm" ? "dm-" + m.sender_id : "public" }),
      );
    } catch (err: any) {
      if (err && (err.statusCode === 404 || err.statusCode === 410)) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
  }));

  return new Response("ok", { status: 200 });
});
