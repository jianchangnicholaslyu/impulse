// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function disputeUpdated(payload = {}) {
  const subject = "Your IMPULSE dispute was updated";
  const rows = [
    { label: "Order ID", value: payload.orderId || "" },
    { label: "Update", value: payload.update || payload.status || "" }
  ];
  const text = textFromLines([
    "A dispute on IMPULSE has been updated.",
    payload.orderId ? `Order ID: ${payload.orderId}` : "",
    payload.update ? `Update: ${payload.update}` : ""
  ]);
  const html = renderEmail({
    title: "Dispute updated",
    preheader: "A dispute status changed on IMPULSE.",
    intro: "A dispute related to your order has been updated.",
    rows
  });
  return { subject, text, html };
};
