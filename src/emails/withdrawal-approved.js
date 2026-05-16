// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function withdrawalApproved(payload = {}) {
  const subject = "IMPULSE withdrawal approved";
  const rows = [
    { label: "Request ID", value: payload.withdrawalId || payload.orderId || "" },
    { label: "Amount", value: payload.amount ? `${payload.amount} points` : "" }
  ];
  const text = textFromLines([
    "Your withdrawal request has been approved.",
    payload.withdrawalId ? `Request ID: ${payload.withdrawalId}` : "",
    payload.amount ? `Amount: ${payload.amount} points` : ""
  ]);
  const html = renderEmail({
    title: "Withdrawal approved",
    preheader: "Your IMPULSE withdrawal was approved.",
    intro: "Your withdrawal request has been approved.",
    rows
  });
  return { subject, text, html };
};
