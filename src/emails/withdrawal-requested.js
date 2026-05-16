// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function withdrawalRequested(payload = {}) {
  const subject = "IMPULSE withdrawal requested";
  const rows = [
    { label: "Request ID", value: payload.withdrawalId || payload.orderId || "" },
    { label: "Amount", value: payload.amount ? `${payload.amount} points` : "" }
  ];
  const text = textFromLines([
    "A withdrawal request has been submitted.",
    payload.withdrawalId ? `Request ID: ${payload.withdrawalId}` : "",
    payload.amount ? `Amount: ${payload.amount} points` : ""
  ]);
  const html = renderEmail({
    title: "Withdrawal requested",
    preheader: "Your IMPULSE withdrawal request was received.",
    intro: "Your withdrawal request has been received.",
    rows
  });
  return { subject, text, html };
};
