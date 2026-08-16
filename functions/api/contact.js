/**
 * Contact form handler — Cloudflare Pages Function.
 * Contract: docs/CLAUDE.md § 9.2. Privacy model: § 9.1.
 *
 * Flow: honeypot → Turnstile (server-side, mandatory) → validate → send via Resend.
 *
 * Rate limiting is enforced AT THE EDGE by a Cloudflare WAF rate-limiting rule
 * on /api/contact (configured in the dashboard — see docs/CLAUDE.md § 12.5).
 * This Function is deliberately stateless: § 9.1 forbids KV/D1/Durable Objects,
 * and an in-isolate counter would be security theatre. Turnstile + the honeypot
 * are the in-function abuse controls.
 *
 * PRIVACY — hard rules (§ 9.1):
 *   - Never log the message body, the sender's email, or the sender's IP.
 *   - Log only: timestamp, outcome, and an error code. No PII in logs.
 *   - Nothing is stored anywhere. Submissions transit to email only.
 *
 * Env (Cloudflare Pages → Settings → Environment variables, encrypted):
 *   TURNSTILE_SECRET_KEY  (secret)  RESEND_API_KEY  (secret)
 *   CONTACT_TO_EMAIL      (config)  CONTACT_FROM_EMAIL (config, Resend-verified domain)
 */

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;
const NAME_MAX = 200;
const EMAIL_MAX = 254;
const BODY_MAX_BYTES = 32 * 1024; // reject oversized payloads before any further work

const GENERIC_OK = { ok: true, message: "Thanks — your message has been sent." };
const GENERIC_FAIL = {
  ok: false,
  message: "Sorry, your message could not be sent. Please try again in a few minutes.",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Outcome ∈ ok | turnstile_fail | honeypot | invalid | too_large | send_error | server_error
function logOutcome(outcome, code = "") {
  // Timestamp, outcome, error code ONLY (§ 9.1). Never add fields here.
  console.log(JSON.stringify({ t: new Date().toISOString(), outcome, code }));
}

function isPlausibleEmail(v) {
  return (
    typeof v === "string" &&
    v.length <= EMAIL_MAX &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
  );
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }
  return handlePost(context);
}

async function handlePost({ request, env }) {
  try {
    // 0. Size guard before parsing.
    const len = Number(request.headers.get("content-length") || 0);
    if (len > BODY_MAX_BYTES) {
      logOutcome("too_large");
      return json(GENERIC_FAIL, 400);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      logOutcome("invalid", "parse");
      return json(GENERIC_FAIL, 400);
    }

    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const message = (form.get("message") || "").toString().trim();
    const honeypot = (form.get("website") || "").toString(); // humans never fill this
    const token = (form.get("cf-turnstile-response") || "").toString();

    // 1. Honeypot — pretend success, send nothing, do not reveal the trap.
    if (honeypot !== "") {
      logOutcome("honeypot");
      return json(GENERIC_OK, 200);
    }

    // 2. Turnstile — server-side verification is the ONLY determination (§ 9.2).
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const verify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      }
    );
    const verdict = await verify.json().catch(() => ({ success: false }));
    if (!verdict.success) {
      logOutcome("turnstile_fail");
      return json(GENERIC_FAIL, 400);
    }

    // 3. Validate.
    if (
      !name || name.length > NAME_MAX ||
      !isPlausibleEmail(email) ||
      message.length < MESSAGE_MIN || message.length > MESSAGE_MAX
    ) {
      logOutcome("invalid", "fields");
      return json(GENERIC_FAIL, 400);
    }

    // 4. Rate limiting — handled by the Cloudflare WAF rule on this route (§ 12.5).

    // 5. Send via Resend. Plain text only; reply_to makes replying natural.
    const send = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: "Message from michaeldacre.com",
        text: `From: ${name} <${email}>\n\n${message}`,
      }),
    });

    if (!send.ok) {
      // 6. Never leak provider errors, key state, or internal detail (§ 9.2).
      logOutcome("send_error", String(send.status));
      return json(GENERIC_FAIL, 502);
    }

    logOutcome("ok");
    return json(GENERIC_OK, 200);
  } catch {
    logOutcome("server_error");
    return json(GENERIC_FAIL, 500);
  }
}
