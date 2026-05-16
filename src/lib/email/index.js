// AI: server-only mail core. User forbids secret leaks; Resend key lives only in Vercel env.
// AI: free Resend plan = one verified domain; all senders use auth.impulse.ccwu.cc until env swap.
const EmailTypes = Object.freeze({
  AUTH_VERIFICATION_CODE: "auth_verification_code",
  AUTH_MAGIC_LINK: "auth_magic_link",
  PASSWORD_RESET: "password_reset",
  ORDER_CREATED: "order_created",
  ORDER_COMPLETED: "order_completed",
  DISPUTE_OPENED: "dispute_opened",
  DISPUTE_UPDATED: "dispute_updated",
  WITHDRAWAL_REQUESTED: "withdrawal_requested",
  WITHDRAWAL_APPROVED: "withdrawal_approved",
  WITHDRAWAL_REJECTED: "withdrawal_rejected",
  ADMIN_ALERT: "admin_alert"
});

const Templates = {
  [EmailTypes.AUTH_VERIFICATION_CODE]: require("../../emails/auth-verification-code"),
  [EmailTypes.AUTH_MAGIC_LINK]: require("../../emails/auth-magic-link"),
  [EmailTypes.PASSWORD_RESET]: require("../../emails/password-reset"),
  [EmailTypes.ORDER_CREATED]: require("../../emails/order-created"),
  [EmailTypes.ORDER_COMPLETED]: require("../../emails/order-completed"),
  [EmailTypes.DISPUTE_OPENED]: require("../../emails/dispute-opened"),
  [EmailTypes.DISPUTE_UPDATED]: require("../../emails/dispute-updated"),
  [EmailTypes.WITHDRAWAL_REQUESTED]: require("../../emails/withdrawal-requested"),
  [EmailTypes.WITHDRAWAL_APPROVED]: require("../../emails/withdrawal-approved"),
  [EmailTypes.WITHDRAWAL_REJECTED]: require("../../emails/withdrawal-rejected"),
  [EmailTypes.ADMIN_ALERT]: require("../../emails/admin-alert")
};

let cachedResendClient = null;

function isProduction() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function env(name) {
  return String(process.env[name] || "").trim();
}

function extractEmailAddress(value) {
  const match = String(value || "").match(/<([^<>@\s]+@[^<>@\s]+)>/);
  return (match ? match[1] : String(value || "")).trim().toLowerCase();
}

function senderDomain(value) {
  const email = extractEmailAddress(value);
  return email.includes("@") ? email.split("@").pop() : "";
}

function senderForType(type) {
  // AI: keep logical froms split; upgrade path is env-only: notify/support domains later, no code rewrite.
  if ([EmailTypes.AUTH_VERIFICATION_CODE, EmailTypes.AUTH_MAGIC_LINK, EmailTypes.PASSWORD_RESET].includes(type)) {
    return env("RESEND_FROM_AUTH") || env("MAIL_FROM") || env("RESEND_FROM");
  }
  if (type === EmailTypes.ADMIN_ALERT) {
    return env("RESEND_FROM_SUPPORT") || env("RESEND_FROM_NOTIFY") || env("RESEND_FROM_AUTH") || env("MAIL_FROM") || env("RESEND_FROM");
  }
  return env("RESEND_FROM_NOTIFY") || env("RESEND_FROM_AUTH") || env("MAIL_FROM") || env("RESEND_FROM");
}

function emailHealth() {
  const senders = {
    auth: senderForType(EmailTypes.AUTH_VERIFICATION_CODE),
    notify: senderForType(EmailTypes.ORDER_CREATED),
    support: senderForType(EmailTypes.ADMIN_ALERT)
  };
  const domains = Object.fromEntries(Object.entries(senders).map(([key, value]) => [key, senderDomain(value)]));
  return {
    provider: "resend",
    configured: Boolean(env("RESEND_API_KEY") && senders.auth && senders.notify && senders.support),
    fromDomains: domains,
    production: isProduction()
  };
}

function validateEmailConfiguration(type) {
  const apiKey = env("RESEND_API_KEY");
  const from = senderForType(type);
  if (!apiKey || !from) {
    return { ok: false, configured: false, error: "Email service is not configured." };
  }
  const domain = senderDomain(from);
  // AI: fail closed in prod; never fall back to onboarding/resend.dev.
  if (isProduction() && (!domain || domain === "resend.dev" || domain.endsWith(".resend.dev"))) {
    return {
      ok: false,
      configured: true,
      error: "Production email sender must use a verified IMPULSE J domain."
    };
  }
  return { ok: true, configured: true, apiKey, from, domain };
}

function getResendClient(apiKey) {
  if (!cachedResendClient) {
    const { Resend } = require("resend");
    cachedResendClient = new Resend(apiKey);
  }
  return cachedResendClient;
}

function normalizeAttachments(attachments = []) {
  return (Array.isArray(attachments) ? attachments : [])
    .filter((attachment) => attachment && attachment.filename && (attachment.content || attachment.path))
    .map((attachment) => ({
      filename: String(attachment.filename),
      content: attachment.content ? String(attachment.content) : undefined,
      path: attachment.path ? String(attachment.path) : undefined
    }));
}

async function sendEmail(type, payload = {}) {
  // AI: one API for all mail; add future providers here, keep callers type+payload only.
  if (!Templates[type]) {
    return { ok: false, configured: false, error: `Unsupported email type: ${type}` };
  }
  const config = validateEmailConfiguration(type);
  if (!config.ok) {
    return { ok: false, configured: config.configured, error: config.error };
  }
  const to = payload.to || payload.email || payload.recipient;
  if (!to) {
    return { ok: false, configured: true, error: "Email recipient is required." };
  }
  let rendered;
  try {
    rendered = Templates[type](payload);
  } catch (error) {
    return { ok: false, configured: true, error: error.message || "Email template failed." };
  }
  try {
    const resend = getResendClient(config.apiKey);
    const { data, error } = await resend.emails.send({
      from: config.from,
      to: Array.isArray(to) ? to : [String(to)],
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      attachments: normalizeAttachments(payload.attachments),
      tags: [{ name: "email_type", value: String(type).replace(/[^a-zA-Z0-9_-]/g, "_") }]
    });
    if (error) {
      return {
        ok: false,
        configured: true,
        provider: "resend",
        subject: rendered.subject,
        error: error.message || error.name || "Email provider rejected the request."
      };
    }
    return {
      ok: true,
      configured: true,
      provider: "resend",
      id: data?.id || "",
      subject: rendered.subject
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      provider: "resend",
      subject: rendered.subject,
      error: error.message || "Email provider request failed."
    };
  }
}

module.exports = {
  EmailTypes,
  emailHealth,
  sendEmail
};
