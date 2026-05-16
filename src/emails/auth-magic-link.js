// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function authMagicLink(payload = {}) {
  const magicLink = String(payload.magicLink || payload.url || "");
  const expiresInMinutes = Number(payload.expiresInMinutes || 5);
  const subject = "Sign in to IMPULSE J";
  const text = textFromLines([
    "Use the secure link below to sign in to IMPULSE J.",
    magicLink,
    `This link expires in ${expiresInMinutes} minutes.`
  ]);
  const html = renderEmail({
    title: "Sign in to IMPULSE J",
    preheader: "Your secure IMPULSE J sign-in link.",
    intro: [
      "Use this secure link to sign in to your IMPULSE J account.",
      `The link expires in ${expiresInMinutes} minutes.`
    ],
    action: magicLink ? { href: magicLink, label: "Sign in" } : null
  });
  return { subject, text, html };
};
