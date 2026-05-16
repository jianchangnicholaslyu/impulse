const { parseRequestBody, readDb, recordEmailLog, writeDb } = require("../../_backend-core");
const { sendEmail } = require("../../../src/lib/email");

// AI: internal notification bridge; auth by BACKEND_SECRET only, no browser caller.
function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function bearer(request) {
  const authorization = String(request.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function authorized(request, body = {}) {
  const secret = process.env.BACKEND_SECRET || "";
  return Boolean(secret && (bearer(request) === secret || request.headers["x-backend-secret"] === secret || body.secret === secret));
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Backend-Secret");

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
    return;
  }

  let body;
  try {
    body = await parseRequestBody(request);
  } catch (error) {
    sendJson(response, 400, { ok: false, message: error.message });
    return;
  }
  if (!authorized(request, body)) {
    sendJson(response, 401, { ok: false, message: "Unauthorized." });
    return;
  }

  const db = await readDb();
  const result = await sendEmail(body.type, body.payload || {});
  recordEmailLog(db, body.type, body.payload?.to || body.payload?.email || body.payload?.recipient, result.subject || body.payload?.subject, result);
  await writeDb(db);
  sendJson(response, result.ok ? 200 : 502, result);
};
