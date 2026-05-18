function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  response.end(JSON.stringify(body));
}

function publicValue(name) {
  return String(process.env[name] || "").trim();
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

  sendJson(response, 200, {
    ok: true,
    NEXT_PUBLIC_TAWK_PROPERTY_ID: publicValue("NEXT_PUBLIC_TAWK_PROPERTY_ID"),
    NEXT_PUBLIC_TAWK_WIDGET_ID: publicValue("NEXT_PUBLIC_TAWK_WIDGET_ID")
  });
};
