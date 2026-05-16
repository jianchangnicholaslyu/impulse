// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function authVerificationCode(payload = {}) {
  const code = String(payload.code || "");
  const expiresInMinutes = Number(payload.expiresInMinutes || 5);
  const subject = "Your IMPULSE verification code";
  const text = textFromLines([
    `Your IMPULSE verification code is ${code}.`,
    `It expires in ${expiresInMinutes} minutes.`,
    "If you did not request this code, you can ignore this email."
  ]);
  const html = renderEmail({
    title: "Your verification code",
    preheader: "Use this code to continue signing in to IMPULSE.",
    intro: [
      "Use the code below to verify your IMPULSE account.",
      `This code expires in ${expiresInMinutes} minutes.`
    ],
    code
  });
  return { subject, text, html };
};
