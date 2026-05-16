// AI: no React Email build in this Vite app; templates are tiny CJS HTML funcs for Vercel API.
function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function textFromLines(lines) {
  return lines.filter(Boolean).join("\n");
}

function paragraph(value) {
  return `<p style="margin:0 0 14px;color:#344054;font-size:15px;line-height:1.6;">${escapeHtml(value)}</p>`;
}

function detailRows(rows = []) {
  const body = rows
    .filter((row) => row && row.label)
    .map((row) => `
      <tr>
        <td style="padding:9px 0;color:#667085;font-size:13px;">${escapeHtml(row.label)}</td>
        <td style="padding:9px 0;color:#101828;font-size:13px;text-align:right;font-weight:600;">${escapeHtml(row.value)}</td>
      </tr>
    `).join("");
  return body ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border-top:1px solid #eaecf0;border-bottom:1px solid #eaecf0;">
      ${body}
    </table>
  ` : "";
}

function renderEmail({ title, preheader, intro = [], code = "", action = null, rows = [], note = "" }) {
  const introHtml = (Array.isArray(intro) ? intro : [intro]).filter(Boolean).map(paragraph).join("");
  const codeHtml = code ? `
    <div style="margin:22px 0;padding:18px 22px;border-radius:12px;background:#f2f4ff;border:1px solid #dbe4ff;text-align:center;">
      <div style="font-size:30px;line-height:1.2;letter-spacing:4px;font-weight:800;color:#1d4ed8;">${escapeHtml(code)}</div>
    </div>
  ` : "";
  const actionHtml = action?.href && action?.label ? `
    <div style="margin:24px 0;">
      <a href="${escapeHtml(action.href)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">${escapeHtml(action.label)}</a>
    </div>
  ` : "";
  return `<!doctype html>
<html lang="en" translate="no">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body class="notranslate" translate="no" style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(preheader || title)}</div>
    <table class="notranslate" translate="no" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:22px 26px;background:#111827;color:#ffffff;">
                <div style="font-size:18px;font-weight:800;letter-spacing:0;">IMPULSE</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 26px;">
                <h1 style="margin:0 0 16px;color:#101828;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h1>
                ${introHtml}
                ${codeHtml}
                ${actionHtml}
                ${detailRows(rows)}
                ${note ? paragraph(note) : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 26px;background:#f9fafb;border-top:1px solid #eaecf0;color:#667085;font-size:12px;line-height:1.5;">
                This message was sent by IMPULSE. If you did not request it, you can safely ignore it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

module.exports = {
  escapeHtml,
  renderEmail,
  textFromLines
};
