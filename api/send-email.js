const { parseRequestBody, readDb, recordEmailLog, writeDb } = require("./_backend-core");
const { EmailTypes, sendEmail } = require("../src/lib/email");

// AI: legacy route retained for ops only. Requires BACKEND_SECRET; never reopen to public frontend.
function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function bearer(request) {
  const authorization = String(request.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function isInternalRequest(request, body = {}) {
  const secret = process.env.BACKEND_SECRET || "";
  if (!secret) {
    return false;
  }
  return bearer(request) === secret || request.headers["x-backend-secret"] === secret || body.secret === secret;
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Backend-Secret");

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Method not allowed." });
    return;
  }

  let body;
  try {
    body = await parseRequestBody(request);
  } catch (error) {
    sendJson(response, 400, { ok: false, error: error.message });
    return;
  }

  if (!isInternalRequest(request, body)) {
    sendJson(response, 401, { ok: false, error: "Unauthorized email request." });
    return;
  }

  const db = await readDb();
  const type = body.type || EmailTypes.ADMIN_ALERT;
  const result = await sendEmail(type, {
    to: body.to,
    subject: body.subject,
    message: body.text || body.message || body.html,
    attachments: body.attachments
  });
  recordEmailLog(db, type, body.to, result.subject || body.subject, result);
  await writeDb(db);

  sendJson(response, result.ok ? 200 : 502, result);
};
