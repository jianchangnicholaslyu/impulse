const EmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024 * 4) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    request.on("error", reject);
  });
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Method not allowed." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || process.env.RESEND_FROM;

  if (!apiKey || !from) {
    sendJson(response, 503, {
      ok: false,
      configured: false,
      error: "Email service is not configured."
    });
    return;
  }

  let body;
  try {
    body = await parseBody(request);
  } catch (error) {
    sendJson(response, 400, { ok: false, error: error.message });
    return;
  }

  const to = String(body.to || "").trim().toLowerCase();
  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();
  const html = String(body.html || "").trim();
  const attachments = Array.isArray(body.attachments) ? body.attachments.filter((attachment) => (
    attachment && attachment.filename && attachment.content
  )).map((attachment) => ({
    filename: String(attachment.filename),
    content: String(attachment.content),
    content_type: attachment.content_type ? String(attachment.content_type) : undefined
  })) : [];

  if (!EmailPattern.test(to)) {
    sendJson(response, 400, { ok: false, error: "Invalid recipient email." });
    return;
  }

  if (!subject || (!text && !html)) {
    sendJson(response, 400, { ok: false, error: "Subject and message are required." });
    return;
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "IMPULSE/1.0"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html: html || undefined,
        attachments: attachments.length ? attachments : undefined
      })
    });

    const result = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      sendJson(response, resendResponse.status, {
        ok: false,
        configured: true,
        error: result.message || result.name || "Email provider rejected the request."
      });
      return;
    }

    sendJson(response, 200, {
      ok: true,
      configured: true,
      id: result.id || ""
    });
  } catch (error) {
    sendJson(response, 502, {
      ok: false,
      configured: true,
      error: error.message || "Email provider request failed."
    });
  }
};
