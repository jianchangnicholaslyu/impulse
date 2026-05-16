const { handleAction, parseRequestBody } = require("../_backend-core");

// AI: consumes hash-backed code; do not add raw-code reads/logs here.
function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
    return;
  }

  try {
    const body = await parseRequestBody(request);
    const result = await handleAction("verifyCode", {
      email: body.email,
      code: body.code,
      purpose: body.purpose || "login"
    }, { request });
    sendJson(response, result.ok ? 200 : 400, result);
  } catch (error) {
    sendJson(response, 500, { ok: false, message: error.message || "Request failed." });
  }
};
