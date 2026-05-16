// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function disputeOpened(payload = {}) {
  const subject = "A dispute was opened on IMPULSE";
  const rows = [
    { label: "Order ID", value: payload.orderId || "" },
    { label: "Reason", value: payload.reason || "" }
  ];
  const text = textFromLines([
    "A dispute was opened on IMPULSE.",
    payload.orderId ? `Order ID: ${payload.orderId}` : "",
    payload.reason ? `Reason: ${payload.reason}` : ""
  ]);
  const html = renderEmail({
    title: "Dispute opened",
    preheader: "A dispute requires attention on IMPULSE.",
    intro: "A dispute was opened and may require your attention.",
    rows
  });
  return { subject, text, html };
};
