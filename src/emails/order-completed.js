// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function orderCompleted(payload = {}) {
  const subject = "Your IMPULSE order was completed";
  const rows = [
    { label: "Order ID", value: payload.orderId || "" },
    { label: "Order", value: payload.orderName || payload.title || "" },
    { label: "Completed at", value: payload.completedAt || "" }
  ];
  const text = textFromLines([
    "Your IMPULSE order has been marked completed.",
    payload.orderId ? `Order ID: ${payload.orderId}` : "",
    payload.orderName ? `Order: ${payload.orderName}` : "",
    payload.completedAt ? `Completed at: ${payload.completedAt}` : ""
  ]);
  const html = renderEmail({
    title: "Order completed",
    preheader: "Your IMPULSE order has been completed.",
    intro: "Your order has been marked completed.",
    rows
  });
  return { subject, text, html };
};
