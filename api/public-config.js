function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  response.end(JSON.stringify(body));
}

function cleanUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function tableName(value, fallback) {
  const table = String(value || fallback || "").trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(table) ? table : fallback;
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
    supabase: {
      url: cleanUrl(process.env.SUPABASE_URL),
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        || process.env.SUPABASE_ANON_KEY
        || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        || process.env.SUPABASE_PUBLISHABLE_KEY
        || "",
      messagesTable: tableName(process.env.SUPABASE_MESSAGES_TABLE, "messages"),
      presenceTable: tableName(process.env.SUPABASE_PRESENCE_TABLE, "message_presence")
    }
  });
};
