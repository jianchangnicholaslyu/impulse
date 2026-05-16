// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function orderCreated(payload = {}) {
  const subject = "Your IMPULSE order was created";
  const rows = [
    { label: "Order ID", value: payload.orderId || "" },
    { label: "Order", value: payload.orderName || payload.title || "" },
    { label: "Amount", value: payload.amount ? `${payload.amount} points` : "" }
  ];
  const text = textFromLines([
    "Your IMPULSE order has been created.",
    payload.orderId ? `Order ID: ${payload.orderId}` : "",
    payload.orderName ? `Order: ${payload.orderName}` : "",
    payload.amount ? `Amount: ${payload.amount} points` : ""
  ]);
  const html = renderEmail({
    title: "Order created",
    preheader: "Your IMPULSE order is waiting for a staff member.",
    intro: "Your order has been created and is waiting for a staff member.",
    rows
  });
  return { subject, text, html };
};
