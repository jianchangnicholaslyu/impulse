// AI: English transactional template; keep sparse, trusted, low-spam.
const { renderEmail, textFromLines } = require("./_layout");

module.exports = function withdrawalRejected(payload = {}) {
  const subject = "IMPULSE withdrawal rejected";
  const rows = [
    { label: "Request ID", value: payload.withdrawalId || payload.orderId || "" },
    { label: "Reason", value: payload.reason || "" }
  ];
  const text = textFromLines([
    "Your withdrawal request was rejected.",
    payload.withdrawalId ? `Request ID: ${payload.withdrawalId}` : "",
    payload.reason ? `Reason: ${payload.reason}` : ""
  ]);
  const html = renderEmail({
    title: "Withdrawal rejected",
    preheader: "Your IMPULSE withdrawal request was rejected.",
    intro: "Your withdrawal request was rejected.",
    rows
  });
  return { subject, text, html };
};
