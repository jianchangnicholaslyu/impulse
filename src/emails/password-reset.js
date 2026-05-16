// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function passwordReset(payload = {}) {
  const code = String(payload.code || "");
  const resetLink = String(payload.resetLink || payload.url || "");
  const expiresInMinutes = Number(payload.expiresInMinutes || 5);
  const subject = "Reset your IMPULSE password";
  const text = textFromLines([
    "A password reset was requested for your IMPULSE account.",
    code ? `Verification code: ${code}` : "",
    resetLink ? `Reset link: ${resetLink}` : "",
    `This request expires in ${expiresInMinutes} minutes.`
  ]);
  const html = renderEmail({
    title: "Reset your password",
    preheader: "Password reset instructions for your IMPULSE account.",
    intro: [
      "A password reset was requested for your IMPULSE account.",
      `Use the code or secure link within ${expiresInMinutes} minutes.`
    ],
    code,
    action: resetLink ? { href: resetLink, label: "Reset password" } : null
  });
  return { subject, text, html };
};
