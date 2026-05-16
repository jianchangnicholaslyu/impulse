const { emailHealth } = require("../_backend-core");

// AI: safe public health; expose config status/domains only, never keys/from full addresses.
function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
    return;
  }
  sendJson(response, 200, { ok: true, ...emailHealth() });
};
