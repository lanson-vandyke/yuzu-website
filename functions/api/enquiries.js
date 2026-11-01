/*
 * POST /api/enquiries (Cloudflare Pages Function)
 *
 * Validates an enquiry from the "Say hi" form with the same rules as
 * yuzu-concepts/server/server.js, then forwards it to the Google Apps Script
 * web app in apps-script/Code.gs, which appends it to the "Website Enquiries"
 * Sheet and emails the team.
 *
 * Environment (Cloudflare Pages > Settings > Variables and secrets):
 *   ENQUIRY_WEBHOOK_URL     the Apps Script /exec URL
 *   ENQUIRY_WEBHOOK_SECRET  shared secret, must match SECRET in Code.gs
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TYPES = ["brand", "creator", "press"];
const MAX = { name: 120, email: 254, company: 160, handle: 100, budget: 60, message: 5000, site: 60 };
const MAX_BODY = 20 * 1024;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function validate(body) {
  const errors = {};
  const clean = {};
  for (const key of Object.keys(MAX)) {
    const v = body[key];
    if (v == null || v === "") continue;
    if (typeof v !== "string") { errors[key] = "That doesn't look right."; continue; }
    const s = v.trim();
    if (s.length > MAX[key]) errors[key] = `Keep it under ${MAX[key]} characters.`;
    clean[key] = s;
  }
  if (!clean.name || clean.name.length < 2) errors.name = errors.name || "Tell us your name.";
  if (!clean.email || !EMAIL_RE.test(clean.email)) errors.email = errors.email || "That email doesn't look right.";
  if (!TYPES.includes(body.type)) errors.type = "Pick who you are.";
  else clean.type = body.type;
  if (!clean.message || clean.message.length < 10) errors.message = errors.message || "A little more detail, please (10+ characters).";
  return { errors, clean };
}

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, errors: { form: "That's a bit long. Mind trimming it?" } });

  let body;
  try { body = JSON.parse(raw); } catch (_) { body = null; }
  if (!body || typeof body !== "object") return json(400, { ok: false, errors: { form: "Something went wrong. Mind trying again?" } });

  const id = crypto.randomUUID();
  const thanks = { ok: true, id, message: "Thanks! We'll be in touch soon." };

  // Honeypot: bots fill the hidden "website" field. Pretend it worked.
  if (typeof body.website === "string" && body.website.trim()) return json(201, thanks);

  const { errors, clean } = validate(body);
  if (Object.keys(errors).length) return json(400, { ok: false, errors });

  if (!env.ENQUIRY_WEBHOOK_URL || !env.ENQUIRY_WEBHOOK_SECRET) {
    console.error("enquiries: webhook env vars are not set");
    return json(503, { ok: false, errors: { form: "Our form is having a nap. Please email lanson@yuzutalent.com." } });
  }

  const record = {
    secret: env.ENQUIRY_WEBHOOK_SECRET,
    id,
    receivedAt: new Date().toISOString(),
    country: (request.cf && request.cf.country) || "",
    userAgent: (request.headers.get("user-agent") || "").slice(0, 300),
    ...clean
  };

  try {
    // Apps Script answers a POST with a 302 to the result; fetch follows it.
    const res = await fetch(env.ENQUIRY_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
      redirect: "follow"
    });
    const reply = await res.json().catch(() => null);
    if (reply && reply.ok) return json(201, thanks);
    console.error("enquiries: webhook replied", res.status, reply && reply.error);
  } catch (err) {
    console.error("enquiries: webhook failed", err && err.message);
  }
  return json(502, { ok: false, errors: { form: "We couldn't send that just now. Please email lanson@yuzutalent.com and we'll get back to you." } });
}

export function onRequest() {
  return json(405, { ok: false, errors: { form: "Use POST." } });
}
