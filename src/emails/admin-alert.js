// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function adminAlert(payload = {}) {
  const subject = String(payload.subject || "IMPULSE admin alert");
  const message = String(payload.message || payload.body || "An IMPULSE administrative notification was generated.");
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const text = textFromLines([message]);
  const html = renderEmail({
    title: subject,
    preheader: "IMPULSE administrative notification.",
    intro: message,
    rows
  });
  return { subject, text, html };
};
