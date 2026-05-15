const { handleAction, parseRequestBody, verifyToken } = require("./_backend-core");

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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

  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : body.token;
  const user = token ? verifyToken(token) : null;

  try {
    const result = await handleAction(body.action, body.payload || {}, { user, request });
    sendJson(response, result.ok ? 200 : 400, result);
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      message: error.message || "Backend request failed."
    });
  }
};
