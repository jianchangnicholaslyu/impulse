const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { EmailTypes, emailHealth, sendEmail: sendProviderEmail } = require("../src/lib/email");

// AI: additive-only backend. Preserve old localStorage/Supabase JSON data; never wipe users/orders/chats/logs on update.
const IsVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DataDir = process.env.IMPULSE_DATA_DIR || (IsVercel ? path.join(os.tmpdir(), "impulse-data") : path.join(process.cwd(), ".data"));
const DataFile = path.join(DataDir, "impulse-db.json");
const DbKey = process.env.BACKEND_DB_KEY || "impulse:db";
const DbStorageKey = "__impulseDbStorage";
const DbPrimaryErrorKey = "__impulsePrimaryStorageError";
const SupabaseTablePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const EmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SessionMaxAgeMs = 30 * 24 * 60 * 60 * 1000;
const VerificationMaxAgeMs = 5 * 60 * 1000;
const VerificationCooldownMs = 60 * 1000;
const VerificationIpWindowMs = 10 * 60 * 1000;
const VerificationIpLimit = 5;
const EmailPrivacyResponse = "If this email is valid, a message has been sent.";
const BrandName = "夕夕电竞";
const SystemSenderName = `${BrandName}系统`;
// AI: mail auth spec: hash-only codes, 5m TTL, 60s/email, 5/10m/IP, generic responses, no raw-code API responses.
const DayMs = 24 * 60 * 60 * 1000;
const ChatRetentionMs = 7 * DayMs;
const ArchiveRetentionMs = 30 * DayMs;
const AssetMaxBytes = Number(process.env.MAX_ASSET_BYTES || 5 * 1024 * 1024);
const BuiltInUsers = [
  { username: "ADMIN", email: "admin@impulse.local", password: "********", role: "admin" },
  { username: "EMPL001", email: "empl001@impulse.local", password: "12345678", role: "staff" }
];
const EmailNoticeSubjects = {
  rechargeSuccess: "充值成功",
  orderSuccess: "下单成功",
  orderAccepted: "接单成功",
  serviceReminder: "服务提醒",
  progressReminder: "进度更新",
  completionRequest: "结单请求",
  rushReply: "加急请求更新",
  completionSuccess: "订单已完成",
  returnSuccess: "退单已完成"
};
const MailboxNoticeCategories = {
  rechargeSuccess: "funds",
  orderSuccess: "orders",
  orderAccepted: "orders",
  serviceReminder: "system",
  progressReminder: "orders",
  completionRequest: "orders",
  rushReply: "orders",
  completionSuccess: "orders",
  returnSuccess: "orders"
};
const MailboxCategories = new Set(["system", "security", "orders", "funds", "chat"]);
const MailboxExpiryDays = {
  chat: 7,
  orders: 7,
  system: 30,
  security: 90,
  funds: 90
};
const MailboxCategoryLimit = 25;
const AdminMailboxSubjectMaxLength = 15;
const AdminMailboxBodyMaxLength = 150;
const AdminMailboxPreviewMaxLength = 120;
const AdminMailboxSendingDisabled = true;
const AdminMailboxSendingDisabledMessage = "管理员邮件发送暂时维护中。";
const PointsSystemPaused = true;
const PointsSystemPausedMessage = "充值和积分使用功能暂未开放。";
const VectorSupportChatLifecycle = "paused";
const ChatPausedActions = new Set(["addChatMessage", "listChatMessages", "markChatRead", "setChatTyping"]);
const VectorSupportChatPausedMessage = "暂未开放";
const SquadRoutingEmailCooldownMs = 180 * 1000;
const SquadRoutingMaxResends = 3;
const SquadGroupNumberPattern = /^\d+$/;
const SquadStatuses = new Set(["online", "offline", "working"]);

function nowIso() {
  return new Date().toISOString();
}

function squadNow() {
  const testNow = !isProductionRuntime() ? process.env.IMPULSE_SQUAD_TEST_NOW : "";
  const date = testNow ? new Date(testNow) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function isProductionRuntime() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isEmail(value) {
  return EmailPattern.test(normalizeEmail(value));
}

function vectorSupportChatPaused() {
  return VectorSupportChatLifecycle === "paused";
}

function vectorSupportChatPausedResponse() {
  return {
    ok: false,
    status: "paused",
    lifecycleStatus: "paused",
    message: VectorSupportChatPausedMessage
  };
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function secret() {
  // AI: BACKEND_SECRET must exist in prod; RESEND key fallback is legacy local compatibility only.
  return process.env.BACKEND_SECRET || process.env.RESEND_API_KEY || "impulse-local-development-secret";
}

function hmac(value) {
  return crypto.createHmac("sha256", secret()).update(String(value)).digest("hex");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) {
    return false;
  }
  if (!String(stored).startsWith("pbkdf2_sha256$")) {
    return String(password) === String(stored);
  }
  const [, rounds, salt, expected] = String(stored).split("$");
  const actual = crypto.pbkdf2Sync(String(password), salt, Number(rounds), 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, issuedAt: Date.now() })).toString("base64url");
  return `${body}.${hmac(body)}`;
}

function verifyToken(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature || hmac(body) !== signature) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.issuedAt || Date.now() - payload.issuedAt > SessionMaxAgeMs) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

function utc8Parts(value) {
  const date = value ? new Date(value) : new Date();
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const shifted = new Date(validDate.getTime() + 8 * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds()
  };
}

function pad(value, length) {
  return String(value).padStart(length, "0");
}

function utc8DayKey(value) {
  const parts = utc8Parts(value);
  return `${parts.year}-${pad(parts.month, 2)}-${pad(parts.day, 2)}`;
}

function publicUserId(createdAt, sequence) {
  const parts = utc8Parts(createdAt);
  return [
    pad(parts.month, 2),
    pad(parts.day, 2),
    pad(parts.year, 4),
    pad(parts.hour, 2),
    pad(parts.minute, 2),
    pad(parts.second, 2),
    pad(sequence, 4)
  ].join("");
}

function emptyDb() {
  return {
    version: 1,
    users: [],
    profiles: [],
    categories: [],
    games: {},
    products: {},
    orders: [],
    squads: [],
    squadRouting: {
      orderingPaused: false,
      pausedReason: "",
      pausedAt: "",
      lastDailyStopDate: "",
      restoredAt: "",
      restoredBy: ""
    },
    orderChats: {},
    chatTyping: {},
    mailboxMessages: {},
    ledger: [],
    adminLogs: [],
    systemSettings: {
      backupEmail: "",
      backupHistory: []
    },
    verifications: {},
    emailVerifications: [],
    emailLogs: []
  };
}

async function kvRequest(command, args = []) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return null;
  }
  const response = await fetch(`${url}/${command}/${args.map((item) => encodeURIComponent(item)).join("/")}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`KV ${command} failed: ${response.status}`);
  }
  return response.json();
}

function supabaseUrl() {
  return String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
}

function supabaseKey() {
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
}

function supabaseTable() {
  const table = process.env.SUPABASE_STATE_TABLE || "impulse_state";
  if (!SupabaseTablePattern.test(table)) {
    throw new Error("SUPABASE_STATE_TABLE must contain only letters, numbers, and underscores, and cannot start with a number.");
  }
  return table;
}

function supabaseConfiguredTable(envName, fallback) {
  const table = process.env[envName] || fallback;
  if (!SupabaseTablePattern.test(table)) {
    throw new Error(`${envName} must contain only letters, numbers, and underscores, and cannot start with a number.`);
  }
  return table;
}

function supabaseMessagesTable() {
  return supabaseConfiguredTable("SUPABASE_MESSAGES_TABLE", "messages");
}

function supabasePresenceTable() {
  return supabaseConfiguredTable("SUPABASE_PRESENCE_TABLE", "message_presence");
}

function supabaseAssetBucket() {
  return String(process.env.SUPABASE_STORAGE_BUCKET || "impulse-assets").trim();
}

function hasSupabaseStorage() {
  return Boolean(supabaseUrl() && supabaseKey());
}

function isSupabaseOpaqueApiKey(key) {
  return /^sb_(publishable|secret)_/i.test(String(key || ""));
}

function supabaseAuthHeaders() {
  const key = supabaseKey();
  const headers = { apikey: key };
  // New Supabase sb_* keys are opaque API keys, not JWTs. Sending them as
  // Bearer tokens makes PostgREST reject the request with an invalid JWT.
  if (!isSupabaseOpaqueApiKey(key)) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

function allowStorageFallback() {
  return process.env.DISABLE_STORAGE_FALLBACK !== "1";
}

function fallbackStorageType() {
  if (hasKvStorage()) {
    return "kv";
  }
  return IsVercel ? "temporary-file" : "file";
}

function fileFallbackStorageType() {
  return IsVercel ? "temporary-file" : "file";
}

function markDbStorage(db, storage, primaryError = "") {
  if (!db || typeof db !== "object") {
    return db;
  }
  Object.defineProperty(db, DbStorageKey, {
    value: storage,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(db, DbPrimaryErrorKey, {
    value: primaryError,
    enumerable: false,
    configurable: true
  });
  return db;
}

function dbStorage(db) {
  return db?.[DbStorageKey] || "";
}

function dbPrimaryStorageError(db) {
  return db?.[DbPrimaryErrorKey] || "";
}

function safeAssetSegment(value, fallback = "asset") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return cleaned || fallback;
}

function assetExtension(mimeType, filename = "") {
  const known = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
  };
  if (known[mimeType]) {
    return known[mimeType];
  }
  const match = String(filename).toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return match ? match[1] : "img";
}

function parseImageDataUrl(dataUrl, filename = "") {
  const match = String(dataUrl || "").match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    return { ok: false, message: "Invalid image data." };
  }
  const mimeType = match[1].toLowerCase();
  if (!mimeType.startsWith("image/")) {
    return { ok: false, message: "Only image uploads are supported." };
  }
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) {
    return { ok: false, message: "Image data is empty." };
  }
  if (buffer.length > AssetMaxBytes) {
    return { ok: false, message: `Image is larger than ${Math.round(AssetMaxBytes / 1024 / 1024)}MB.` };
  }
  return {
    ok: true,
    buffer,
    mimeType,
    extension: assetExtension(mimeType, filename)
  };
}

function encodeStoragePath(pathname) {
  return String(pathname)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function uploadSupabaseAsset(payload, actor) {
  if (!hasSupabaseStorage()) {
    return { ok: false, configured: false, message: "Supabase storage is not configured." };
  }
  const bucket = supabaseAssetBucket();
  if (!bucket) {
    return { ok: false, configured: false, message: "SUPABASE_STORAGE_BUCKET is not configured." };
  }
  const parsed = parseImageDataUrl(payload.dataUrl, payload.filename);
  if (!parsed.ok) {
    return parsed;
  }
  const scope = safeAssetSegment(payload.scope || "content", "content");
  const owner = safeAssetSegment(actor?.username || "system", "system");
  const basename = safeAssetSegment(payload.filename || "image", "image").replace(/\.[a-z0-9]{2,5}$/i, "");
  const objectPath = `${scope}/${owner}/${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}-${basename}.${parsed.extension}`;
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = encodeStoragePath(objectPath);
  await supabaseRequest(`/storage/v1/object/${encodedBucket}/${encodedPath}`, {
    method: "POST",
    headers: {
      "Content-Type": parsed.mimeType,
      "Cache-Control": "3600",
      "x-upsert": "true"
    },
    body: parsed.buffer
  });
  return {
    ok: true,
    bucket,
    path: objectPath,
    url: `${supabaseUrl()}/storage/v1/object/public/${encodedBucket}/${encodedPath}`
  };
}

async function supabaseRequest(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl()}${pathname}`, {
    ...options,
    headers: {
      ...supabaseAuthHeaders(),
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase request failed: ${response.status}${detail ? ` ${detail}` : ""}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json().catch(() => null);
}

function jsonOrFallback(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function supabaseMessageRow(orderId, message = {}) {
  const contentType = normalizeChatContentType(message.type || message.content_type, message);
  const messageType = normalizeChatMessageType({ ...message, type: contentType });
  const imageUrl = message.imageUrl || message.image_url || message.imageData || "";
  const createdAt = message.createdAt || message.created_at || nowIso();
  const metadata = message.metadata && typeof message.metadata === "object" && !Array.isArray(message.metadata) ? { ...message.metadata } : {};
  const catalogKey = normalizeChatCatalogKey({ ...message, metadata });
  const messageKey = chatCanonicalMessageKey(catalogKey);
  const messageParams = chatMessageParamsFrom({ ...message, metadata });
  const senderId = String(message.senderId || message.sender_id || metadata.senderId || metadata.sender_id || "").trim();
  const senderRole = normalizeChatSenderRole(message.role || message.sender_role || metadata.senderRole || metadata.sender_role);
  const actionStatus = chatActionStatus({ ...message, metadata }, catalogKey);
  if (messageKey) {
    metadata.catalogKey = catalogKey;
    metadata.catalog_key = catalogKey;
    metadata.messageKey = messageKey;
    metadata.message_key = messageKey;
    metadata.messageParams = messageParams;
    metadata.message_params = messageParams;
  }
  // Mirror routing/status fields so local fallback and Supabase rows stay compatible.
  metadata.senderId = senderId;
  metadata.sender_id = senderId;
  metadata.senderRole = senderRole;
  metadata.sender_role = senderRole;
  if (actionStatus) {
    metadata.actionStatus = actionStatus;
    metadata.action_status = actionStatus;
  }
  return {
    id: message.id || createId("msg"),
    order_id: orderId || message.orderId || message.order_id || "",
    sender_username: message.sender || message.sender_username || "SYSTEM",
    sender_id: senderId,
    sender_role: senderRole,
    message_type: messageType,
    content_type: contentType,
    message_key: messageKey,
    message_params: messageParams,
    action_status: actionStatus,
    body: String(chatTextForKey(messageKey, messageParams) || message.text || message.body || "").slice(0, 5000),
    image_url: imageUrl,
    metadata,
    read_by: Array.isArray(message.readBy) ? message.readBy : jsonOrFallback(message.read_by, []),
    read_at: message.readAt && typeof message.readAt === "object" && !Array.isArray(message.readAt) ? message.readAt : jsonOrFallback(message.read_at, {}),
    created_at: createdAt,
    updated_at: nowIso()
  };
}

function messageFromSupabaseRow(row = {}) {
  const contentType = normalizeChatContentType(row.content_type, row);
  const metadata = jsonOrFallback(row.metadata, {});
  const catalogKey = normalizeChatCatalogKey({ ...row, metadata });
  const messageKey = chatCanonicalMessageKey(catalogKey);
  const messageParams = chatMessageParamsFrom({ ...row, metadata });
  const senderId = String(row.sender_id || metadata.senderId || metadata.sender_id || "").trim();
  const senderRole = normalizeChatSenderRole(row.sender_role || metadata.senderRole || metadata.sender_role);
  const actionStatus = chatActionStatus({ ...row, metadata }, catalogKey);
  const nextMetadata = { ...metadata, catalogKey, catalog_key: catalogKey, senderId, sender_id: senderId, senderRole, sender_role: senderRole };
  if (actionStatus) {
    nextMetadata.actionStatus = actionStatus;
    nextMetadata.action_status = actionStatus;
  }
  const messageType = normalizeChatMessageType({
    message_type: row.message_type,
    type: contentType,
    role: senderRole
  });
  return {
    id: row.id || createId("msg"),
    orderId: row.order_id || "",
    sender: row.sender_username || "SYSTEM",
    senderId,
    sender_id: senderId,
    role: senderRole,
    senderRole,
    sender_role: senderRole,
    type: contentType,
    messageType,
    message_type: messageType,
    text: String(chatTextForKey(messageKey, messageParams) || row.body || "").slice(0, 5000),
    imageData: "",
    imageUrl: row.image_url || "",
    catalogKey,
    catalog_key: catalogKey,
    messageKey,
    message_key: messageKey,
    messageParams,
    message_params: messageParams,
    actionStatus,
    action_status: actionStatus,
    metadata: nextMetadata,
    readBy: Array.isArray(row.read_by) ? row.read_by : jsonOrFallback(row.read_by, []),
    readAt: row.read_at && typeof row.read_at === "object" && !Array.isArray(row.read_at) ? row.read_at : jsonOrFallback(row.read_at, {}),
    createdAt: row.created_at || nowIso()
  };
}

function mergeChatMessages(localMessages = [], remoteMessages = []) {
  const byId = new Map();
  [...localMessages, ...remoteMessages].forEach((message) => {
    if (!message) return;
    const id = message.id || `${message.sender || "SYSTEM"}:${message.createdAt || ""}:${message.text || ""}`;
    byId.set(id, { ...(byId.get(id) || {}), ...message, id });
  });
  return [...byId.values()].sort((a, b) => timestampMs(a.createdAt) - timestampMs(b.createdAt));
}

async function persistSupabaseMessage(orderId, message) {
  if (!hasSupabaseStorage() || !message) {
    return false;
  }
  try {
    await supabaseRequest(`/rest/v1/${supabaseMessagesTable()}?on_conflict=id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(supabaseMessageRow(orderId, message))
    });
    return true;
  } catch {
    return false;
  }
}

async function persistSupabaseMessages(orderId, messages = []) {
  if (!hasSupabaseStorage() || !Array.isArray(messages) || !messages.length) {
    return false;
  }
  await Promise.all(messages.map((message) => persistSupabaseMessage(orderId, message)));
  return true;
}

async function fetchSupabaseMessages(orderId) {
  if (!hasSupabaseStorage() || !orderId) {
    return null;
  }
  try {
    const rows = await supabaseRequest(`/rest/v1/${supabaseMessagesTable()}?order_id=eq.${encodeURIComponent(orderId)}&select=*&order=created_at.asc`, {
      headers: { Accept: "application/json" }
    });
    return Array.isArray(rows) ? rows.map(messageFromSupabaseRow) : [];
  } catch {
    return null;
  }
}

async function persistSupabasePresence(orderId, user, isTyping) {
  if (!hasSupabaseStorage() || !orderId || !user?.username) {
    return false;
  }
  try {
    const updatedAt = nowIso();
    await supabaseRequest(`/rest/v1/${supabasePresenceTable()}?on_conflict=order_id,username`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        order_id: orderId,
        username: user.username,
        role: user.role || "customer",
        is_typing: Boolean(isTyping),
        last_seen_at: updatedAt,
        updated_at: updatedAt
      })
    });
    return true;
  } catch {
    return false;
  }
}

async function fetchSupabasePresence(orderId) {
  if (!hasSupabaseStorage() || !orderId) {
    return null;
  }
  try {
    const rows = await supabaseRequest(`/rest/v1/${supabasePresenceTable()}?order_id=eq.${encodeURIComponent(orderId)}&select=*&order=updated_at.desc`, {
      headers: { Accept: "application/json" }
    });
    if (!Array.isArray(rows)) {
      return {};
    }
    return rows.reduce((presence, row) => {
      if (!row?.username) {
        return presence;
      }
      const updatedAt = row.updated_at || row.last_seen_at || nowIso();
      presence[row.username] = {
        username: row.username,
        role: row.role || "customer",
        isTyping: Boolean(row.is_typing),
        updatedAt,
        lastOnlineAt: row.last_seen_at || updatedAt
      };
      return presence;
    }, {});
  } catch {
    return null;
  }
}

async function pruneSupabaseChatRows(expiredOrderIds = []) {
  if (!hasSupabaseStorage()) {
    return false;
  }
  const stalePresenceCutoff = new Date(Date.now() - DayMs).toISOString();
  const orderIds = Array.from(new Set(expiredOrderIds.filter(Boolean)));
  try {
    for (const orderId of orderIds) {
      await supabaseRequest(`/rest/v1/${supabaseMessagesTable()}?order_id=eq.${encodeURIComponent(orderId)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
      await supabaseRequest(`/rest/v1/${supabasePresenceTable()}?order_id=eq.${encodeURIComponent(orderId)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    }
    await supabaseRequest(`/rest/v1/${supabasePresenceTable()}?updated_at=lt.${encodeURIComponent(stalePresenceCutoff)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
    return true;
  } catch {
    return false;
  }
}

async function readSupabaseDb() {
  const table = supabaseTable();
  const id = encodeURIComponent(DbKey);
  const rows = await supabaseRequest(`/rest/v1/${table}?id=eq.${id}&select=data`, {
    headers: { Accept: "application/json" }
  });
  const data = Array.isArray(rows) && rows[0]?.data ? rows[0].data : null;
  return data ? normalizeDb(data) : emptyDb();
}

async function writeSupabaseDb(db) {
  const table = supabaseTable();
  const normalized = normalizeDb(db);
  await supabaseRequest(`/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      id: DbKey,
      data: normalized,
      updated_at: nowIso()
    })
  });
  return normalized;
}

function hasKvStorage() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function storageType() {
  if (hasSupabaseStorage()) {
    return "supabase";
  }
  if (hasKvStorage()) {
    return "kv";
  }
  return IsVercel ? "temporary-file" : "file";
}

async function readFileDb(storage, primaryError = "") {
  try {
    const raw = await fs.readFile(DataFile, "utf8");
    return markDbStorage(normalizeDb(JSON.parse(raw)), storage, primaryError);
  } catch (error) {
    return markDbStorage(emptyDb(), storage, primaryError);
  }
}

async function readFallbackDb(primaryError = "") {
  const fallback = fallbackStorageType();
  if (fallback === "kv") {
    try {
      const kv = await kvRequest("get", [DbKey]);
      const db = kv?.result ? normalizeDb(JSON.parse(kv.result)) : emptyDb();
      return markDbStorage(db, "kv", primaryError);
    } catch (error) {
      if (!allowStorageFallback()) {
        throw error;
      }
      return readFileDb(fileFallbackStorageType(), primaryError || storageErrorCode(error));
    }
  }
  return readFileDb(fallback, primaryError);
}

async function writeFileDb(db, storage, primaryError = "") {
  const normalized = normalizeDb(db);
  await fs.mkdir(path.dirname(DataFile), { recursive: true });
  await fs.writeFile(DataFile, JSON.stringify(normalized, null, 2));
  return markDbStorage(normalized, storage, primaryError);
}

async function writeFallbackDb(db, storage = fallbackStorageType(), options = {}) {
  const allowFallback = options.allowFallback !== false;
  const primaryError = dbPrimaryStorageError(db);
  const normalized = normalizeDb(db);
  if (storage === "kv" && hasKvStorage()) {
    try {
      const kv = await kvRequest("set", [DbKey, JSON.stringify(normalized)]);
      if (kv) {
        return markDbStorage(normalized, "kv", primaryError);
      }
    } catch (error) {
      if (!allowFallback || !allowStorageFallback()) {
        throw error;
      }
      return writeFileDb(normalized, fileFallbackStorageType(), primaryError || storageErrorCode(error));
    }
  }
  const fileStorage = storage === "kv" ? fileFallbackStorageType() : storage;
  return writeFileDb(normalized, fileStorage, primaryError);
}

// AI: API facades depend on this shape to turn storage outages into 503/offline instead of generic 500s.
function storageErrorCode(error) {
  const message = String(error?.message || "");
  const supabaseStatus = message.match(/Supabase request failed:\s*(\d{3})/i);
  if (supabaseStatus) {
    return `supabase_http_${supabaseStatus[1]}`;
  }
  if (/invalid jwt/i.test(message)) {
    return "supabase_invalid_jwt";
  }
  if (/KV .* failed/i.test(message)) {
    return "kv_unavailable";
  }
  if (/fetch failed/i.test(message)) {
    return "storage_fetch_failed";
  }
  if (/Supabase request failed/i.test(message)) {
    return "storage_unavailable";
  }
  return "backend_unavailable";
}

function isStorageError(error) {
  const code = storageErrorCode(error);
  return code === "storage_unavailable"
    || code === "storage_fetch_failed"
    || code.startsWith("supabase_")
    || code.startsWith("kv_");
}

function storageUnavailableResponse(error) {
  return {
    ok: false,
    offline: true,
    status: 503,
    message: "后端存储暂不可用，请稍后重试。",
    backend: {
      storage: storageType(),
      unavailable: true,
      error: storageErrorCode(error)
    }
  };
}

function pointsSystemPausedResponse(message = PointsSystemPausedMessage) {
  return {
    ok: false,
    status: 423,
    reason: "feature-paused",
    lifecycle: "paused",
    feature: "points",
    message
  };
}

function backendStorageInfo(db = null) {
  const activeStorage = dbStorage(db) || storageType();
  const primaryError = dbPrimaryStorageError(db);
  return {
    storage: activeStorage,
    primaryStorage: storageType(),
    degraded: Boolean(primaryError),
    primaryError
  };
}

function canPersistVerificationState(db) {
  const activeStorage = dbStorage(db) || storageType();
  return !(IsVercel && activeStorage === "temporary-file");
}

function verificationStorageUnavailableResponse(db) {
  const primaryError = dbPrimaryStorageError(db);
  return {
    ok: false,
    offline: true,
    status: 503,
    message: "后端存储暂不可用，请稍后重试。",
    backend: {
      ...backendStorageInfo(db),
      unavailable: true,
      error: primaryError || "storage_unavailable"
    }
  };
}

function durableStorageUnavailableResponse(db, error = null) {
  const primaryError = dbPrimaryStorageError(db) || (error ? storageErrorCode(error) : "") || "storage_unavailable";
  return {
    ok: false,
    offline: true,
    status: 503,
    message: "后端存储暂不可用，请稍后重试。",
    backend: {
      ...backendStorageInfo(db),
      unavailable: true,
      error: primaryError
    }
  };
}

async function writeVerificationDb(db) {
  // AI: auth codes/tokens must stay in the same durable store; never fall back during issue/consume writes.
  return writeDb(db, { allowFallback: false });
}

function requiresPrimaryDurability(storage) {
  return storage === "supabase" || storage === "kv";
}

async function writeDurableDb(db) {
  if (!isProductionRuntime() && process.env.IMPULSE_SQUAD_TEST_DURABLE_FAIL_ONCE === "1") {
    process.env.IMPULSE_SQUAD_TEST_DURABLE_FAIL_ONCE = "";
    return { ok: false, response: durableStorageUnavailableResponse(db, new Error("Forced squad routing durable failure.")) };
  }
  const primaryStorage = storageType();
  const activeStorage = dbStorage(db) || primaryStorage;
  if (requiresPrimaryDurability(primaryStorage) && activeStorage !== primaryStorage) {
    return { ok: false, response: durableStorageUnavailableResponse(db) };
  }
  try {
    const written = await writeDb(db, { allowFallback: false });
    const writtenStorage = dbStorage(written) || primaryStorage;
    if (requiresPrimaryDurability(primaryStorage) && writtenStorage !== primaryStorage) {
      return { ok: false, response: durableStorageUnavailableResponse(written) };
    }
    return { ok: true, db: written };
  } catch (error) {
    return { ok: false, response: durableStorageUnavailableResponse(db, error) };
  }
}

function canUseClientSnapshot(db) {
  const activeStorage = dbStorage(db);
  if (activeStorage && activeStorage !== "supabase") {
    return true;
  }
  return !hasSupabaseStorage() && !hasKvStorage();
}

function hydrateTemporaryDb(db, snapshot, actor = "CLIENT") {
  if (!canUseClientSnapshot(db) || !snapshot || typeof snapshot !== "object") {
    return db;
  }
  const imported = importSnapshot(db, snapshot);
  log(imported, "临时状态同步", "从客户端快照补齐临时后端状态", actor);
  return imported;
}

async function readDb() {
  if (hasSupabaseStorage()) {
    try {
      return markDbStorage(await readSupabaseDb(), "supabase");
    } catch (error) {
      if (!allowStorageFallback()) {
        throw error;
      }
      return readFallbackDb(storageErrorCode(error));
    }
  }
  return readFallbackDb();
}

async function writeDb(db, options = {}) {
  const allowFallback = options.allowFallback !== false;
  const targetStorage = dbStorage(db);
  if (targetStorage && targetStorage !== "supabase") {
    return writeFallbackDb(db, targetStorage, { allowFallback });
  }
  if (hasSupabaseStorage()) {
    try {
      return markDbStorage(await writeSupabaseDb(db), "supabase");
    } catch (error) {
      if (!allowFallback || !allowStorageFallback()) {
        throw error;
      }
      const fallbackDb = markDbStorage(normalizeDb(db), fallbackStorageType(), dbPrimaryStorageError(db) || storageErrorCode(error));
      return writeFallbackDb(fallbackDb, dbStorage(fallbackDb), { allowFallback });
    }
  }
  return writeFallbackDb(db, fallbackStorageType(), { allowFallback });
}

function userEmail(user) {
  if (user?.email) {
    return normalizeEmail(user.email);
  }
  const legacyName = normalize(user?.username).replace(/[^a-z0-9._+-]/g, "");
  return legacyName ? `${legacyName}@impulse.local` : "";
}

function sanitizeUser(user) {
  const { password, passwordHash, ...safe } = user || {};
  return { ...safe, email: normalizeEmail(safe.email) };
}

function sanitizeSnapshot(db) {
  return {
    users: db.users.map(sanitizeUser),
    profiles: db.profiles,
    categories: db.categories,
    games: db.games,
    products: db.products,
    orders: db.orders,
    squads: db.squads,
    squadRouting: db.squadRouting,
    orderChats: db.orderChats,
    chatTyping: db.chatTyping,
    mailboxMessages: db.mailboxMessages,
    ledger: db.ledger,
    adminLogs: db.adminLogs,
    systemSettings: db.systemSettings
  };
}

function normalizeStringList(value, limit = 100) {
  return (Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, limit);
}

function booleanValue(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const normalized = normalize(value);
  return ["1", "true", "yes", "on", "online", "active"].includes(normalized);
}

function normalizeSquadRoutingState(value = {}) {
  const state = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    orderingPaused: Boolean(state.orderingPaused),
    pausedReason: String(state.pausedReason || ""),
    pausedAt: String(state.pausedAt || ""),
    lastDailyStopDate: String(state.lastDailyStopDate || ""),
    restoredAt: String(state.restoredAt || ""),
    restoredBy: String(state.restoredBy || "")
  };
}

function normalizeSquadRecord(raw = {}) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const members = normalizeStringList(source.members, 3);
  while (members.length < 3) {
    members.push("");
  }
  const status = SquadStatuses.has(source.status) ? source.status : "offline";
  const currentOrderId = String(source.currentOrderId || "");
  return {
    id: String(source.id || createId("squad")),
    name: String(source.name || "").trim(),
    members,
    captain: String(source.captain || members[0] || "").trim(),
    groupType: source.groupType === "wechat" ? "wechat" : "qq",
    groupNumber: String(source.groupNumber || "").trim(),
    businessProjects: normalizeStringList(source.businessProjects || source.supportedItemIds, 200),
    supportedItemIds: normalizeStringList(source.supportedItemIds || source.businessProjects, 200),
    activeTime: String(source.activeTime || "").trim(),
    activationEnabled: booleanValue(source.activationEnabled),
    status: currentOrderId ? "working" : status,
    currentOrderId,
    lastAssignedAt: String(source.lastAssignedAt || ""),
    lastStatusChangedAt: String(source.lastStatusChangedAt || ""),
    createdAt: String(source.createdAt || nowIso()),
    updatedAt: String(source.updatedAt || source.createdAt || nowIso()),
    createdBy: String(source.createdBy || ""),
    updatedBy: String(source.updatedBy || "")
  };
}

function normalizeDb(input) {
  const inputStorage = dbStorage(input);
  const inputPrimaryError = dbPrimaryStorageError(input);
  const db = { ...emptyDb(), ...(input || {}) };
  db.users = Array.isArray(db.users) ? db.users.map((user) => {
    const passwordHash = user.passwordHash || (user.password ? hashPassword(user.password) : "");
    const { password, ...rest } = user;
    return {
      ...rest,
      email: normalizeEmail(rest.email || userEmail(rest)),
      role: rest.role || "customer",
      createdAt: rest.createdAt || nowIso(),
      passwordHash
    };
  }) : [];
  db.profiles = Array.isArray(db.profiles) ? db.profiles : [];
  db.categories = Array.isArray(db.categories) ? db.categories : [];
  db.games = db.games && typeof db.games === "object" && !Array.isArray(db.games) ? db.games : {};
  db.products = db.products && typeof db.products === "object" && !Array.isArray(db.products) ? db.products : {};
  db.orders = Array.isArray(db.orders) ? db.orders : [];
  db.squads = Array.isArray(db.squads) ? db.squads.map(normalizeSquadRecord) : [];
  db.squadRouting = normalizeSquadRoutingState(db.squadRouting);
  db.orderChats = db.orderChats && typeof db.orderChats === "object" && !Array.isArray(db.orderChats) ? db.orderChats : {};
  db.chatTyping = db.chatTyping && typeof db.chatTyping === "object" && !Array.isArray(db.chatTyping) ? db.chatTyping : {};
  db.mailboxMessages = db.mailboxMessages && typeof db.mailboxMessages === "object" && !Array.isArray(db.mailboxMessages) ? db.mailboxMessages : {};
  db.ledger = Array.isArray(db.ledger) ? db.ledger : [];
  db.adminLogs = Array.isArray(db.adminLogs) ? db.adminLogs : [];
  db.systemSettings = db.systemSettings && typeof db.systemSettings === "object" && !Array.isArray(db.systemSettings) ? {
    backupEmail: normalizeEmail(db.systemSettings.backupEmail || ""),
    backupHistory: Array.isArray(db.systemSettings.backupHistory) ? db.systemSettings.backupHistory : []
  } : { backupEmail: "", backupHistory: [] };
  db.verifications = db.verifications && typeof db.verifications === "object" ? db.verifications : {};
  db.emailVerifications = Array.isArray(db.emailVerifications) ? db.emailVerifications.slice(0, 1000) : [];
  db.emailLogs = Array.isArray(db.emailLogs) ? db.emailLogs.slice(0, 5000) : [];
  ensureProfiles(db);
  if (inputStorage) {
    markDbStorage(db, inputStorage, inputPrimaryError);
  }
  return db;
}

function ensureProfiles(db) {
  const byUsername = new Map(db.profiles.map((profile) => [normalize(profile.username), profile]));
  const next = [];
  db.users.forEach((user) => {
    const current = byUsername.get(normalize(user.username));
    next.push({
      id: current?.id || "",
      username: user.username,
      role: user.role || "customer",
      funds: Number(current?.funds || 0),
      level: Number(current?.level || 0),
      countryRegion: current?.countryRegion || user.countryRegion || "",
      birthday: current?.birthday || user.birthday || "",
      gender: current?.gender || user.gender || "unset",
      avatar: current?.avatar || "",
      avatarImage: current?.avatarImage || user.avatarImage || "",
      avatarImageName: current?.avatarImageName || user.avatarImageName || "",
      notificationEmail: normalizeEmail(current?.notificationEmail || user.email || ""),
      emailNotices: current?.emailNotices || {},
      bannedUntil: current?.bannedUntil || "",
      deleted: Boolean(current?.deleted),
      createdAt: current?.createdAt || user.createdAt || nowIso(),
      lastOnlineAt: current?.lastOnlineAt || ""
    });
  });
  const grouped = new Map();
  next.forEach((profile) => {
    const dayKey = utc8DayKey(profile.createdAt);
    grouped.set(dayKey, [...(grouped.get(dayKey) || []), profile]);
  });
  grouped.forEach((profiles) => {
    profiles
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.username.localeCompare(b.username))
      .forEach((profile, index) => {
        if (!/^\d{18}$/.test(profile.id || "")) {
          profile.id = publicUserId(profile.createdAt, index + 1);
        }
      });
  });
  db.profiles = next;
}

function mergeArrayBy(existingItems = [], incomingItems = [], keyFn, mergeFn = (existing, incoming) => ({ ...existing, ...incoming })) {
  const merged = new Map();
  (Array.isArray(existingItems) ? existingItems : []).forEach((item) => {
    const key = keyFn(item);
    if (key) {
      merged.set(key, item);
    }
  });
  (Array.isArray(incomingItems) ? incomingItems : []).forEach((item) => {
    const key = keyFn(item);
    if (key) {
      merged.set(key, mergeFn(merged.get(key) || {}, item));
    }
  });
  return Array.from(merged.values());
}

const OrderEvidenceFields = [
  "handledBy",
  "handled_by",
  "acceptedAt",
  "accepted_at",
  "acceptedBy",
  "accepted_by",
  "employeeId",
  "employee_id",
  "assignedTo",
  "assigned_to",
  "assignedVectorId",
  "assigned_vector_id",
  "assignedVectorName",
  "assigned_vector_name",
  "vectorUsername",
  "vector_username",
  "staffUsername",
  "staff_username"
];
const OrderStatusRanks = {
  pending: 1,
  processing: 2,
  completed: 3,
  cancelled: 3,
  refunded: 3,
  closed: 4,
  settled: 4
};

function orderStatusRank(order = {}) {
  return OrderStatusRanks[String(order.status || "").toLowerCase()] || 0;
}

function orderEvidenceScore(order = {}) {
  return OrderEvidenceFields.reduce((score, field) => score + (String(order[field] || "").trim() ? 1 : 0), 0);
}

function orderMutationTime(order = {}) {
  return Math.max(
    timestampMs(order.updatedAt),
    timestampMs(order.updated_at),
    timestampMs(order.acceptedAt),
    timestampMs(order.accepted_at),
    timestampMs(order.completedAt),
    timestampMs(order.completed_at),
    timestampMs(order.refundedAt),
    timestampMs(order.refunded_at),
    timestampMs(order.returnRefundedAt),
    timestampMs(order.return_refunded_at),
    timestampMs(order.settledAt),
    timestampMs(order.settled_at),
    timestampMs(order.createdAt),
    timestampMs(order.created_at)
  );
}

function orderProgressScore(order = {}) {
  return orderStatusRank(order) * 100 + Math.min(50, orderEvidenceScore(order) * 5);
}

function preserveOrderEvidence(merged, ...sources) {
  OrderEvidenceFields.forEach((field) => {
    if (String(merged[field] || "").trim()) {
      return;
    }
    const source = sources.find((item) => String(item?.[field] || "").trim());
    if (source) {
      merged[field] = source[field];
    }
  });
  return merged;
}

function mergeOrder(existing = {}, incoming = {}) {
  if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
    return incoming;
  }
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return existing;
  }
  const existingProgress = orderProgressScore(existing);
  const incomingProgress = orderProgressScore(incoming);
  const existingTime = orderMutationTime(existing);
  const incomingTime = orderMutationTime(incoming);
  const incomingWins = incomingProgress > existingProgress
    || (incomingProgress === existingProgress && incomingTime >= existingTime);
  const merged = incomingWins
    ? { ...existing, ...incoming }
    : { ...incoming, ...existing };
  return preserveOrderEvidence(merged, existing, incoming);
}

function mergeOrders(existingOrders = [], incomingOrders = []) {
  return mergeArrayBy(existingOrders, incomingOrders, (order) => order?.id, mergeOrder);
}

function mergeRecordLists(existingRecord = {}, incomingRecord = {}, keyFn) {
  const result = { ...(existingRecord || {}) };
  Object.entries(incomingRecord || {}).forEach(([key, incomingItems]) => {
    result[key] = mergeArrayBy(result[key] || [], incomingItems, keyFn);
  });
  return result;
}

function mergeChatRecords(existingChats = {}, incomingChats = {}) {
  return mergeRecordLists(existingChats, incomingChats, (message) => (
    message?.id || `${message?.sender || ""}:${message?.createdAt || ""}:${message?.text || ""}`
  ));
}

function mergeSystemSettings(existing = {}, incoming = {}) {
  return {
    ...incoming,
    ...existing,
    backupEmail: normalizeEmail(existing.backupEmail || incoming.backupEmail || ""),
    backupHistory: mergeArrayBy(existing.backupHistory, incoming.backupHistory, (entry) => entry?.id || `${entry?.type || ""}:${entry?.createdAt || ""}:${entry?.subject || ""}`)
  };
}

const ProductSquadBindingFields = ["eligibleSquadIds", "availableSquadIds", "supportedSquadIds"];
const OrderSquadRoutingFields = [
  "assignedSquadId",
  "assignedSquadNameSnapshot",
  "groupTypeSnapshot",
  "groupNumberSnapshot",
  "assignedAt",
  "squadRoutingStatus",
  "squadEmailAttempts",
  "squadResendCount",
  "squadLastEmailAt",
  "squadNextEmailAt",
  "squadEmailStatus",
  "squadEmailFailure"
];

function stripProductSquadBinding(product = {}) {
  const next = { ...(product || {}) };
  ProductSquadBindingFields.forEach((field) => {
    delete next[field];
  });
  return next;
}

function stripProductSquadBindings(products = {}) {
  const result = {};
  Object.entries(products && typeof products === "object" && !Array.isArray(products) ? products : {}).forEach(([gameId, list]) => {
    result[gameId] = (Array.isArray(list) ? list : []).map(stripProductSquadBinding);
  });
  return result;
}

function stripOrderSquadRouting(order = {}) {
  const next = { ...(order || {}) };
  OrderSquadRoutingFields.forEach((field) => {
    delete next[field];
  });
  return next;
}

function shouldImportCatalogSnapshot(db = {}, snapshot = {}) {
  // Client catalog seed is allowed only for an empty, history-free store; after that, Admin catalog actions are authoritative.
  const hasServerCatalog = Boolean(
    (Array.isArray(db.categories) && db.categories.length)
      || Object.keys(db.games || {}).length
      || Object.keys(db.products || {}).length
  );
  const hasServerHistory = Boolean(
    (Array.isArray(db.orders) && db.orders.length)
      || (Array.isArray(db.adminLogs) && db.adminLogs.length)
      || (Array.isArray(db.users) && db.users.length)
  );
  const hasIncomingCatalog = Boolean(
    (Array.isArray(snapshot.categories) && snapshot.categories.length)
      || Object.keys(snapshot.games || {}).length
      || Object.keys(snapshot.products || {}).length
  );
  return hasIncomingCatalog && !hasServerCatalog && !hasServerHistory;
}

function importSnapshot(db, snapshot = {}) {
  const inputStorage = dbStorage(db);
  const inputPrimaryError = dbPrimaryStorageError(db);
  const importCatalog = shouldImportCatalogSnapshot(db, snapshot);
  const mergedUsers = mergeArrayBy(db.users, snapshot.users, (user) => normalize(user?.username || user?.email), (existing, user) => ({
    ...existing,
    ...user,
    passwordHash: user.passwordHash || existing.passwordHash || (user.password ? hashPassword(user.password) : "")
  }));
  const imported = normalizeDb({
    ...db,
    users: mergedUsers,
    profiles: mergeArrayBy(db.profiles, snapshot.profiles, (profile) => profile?.id || normalize(profile?.username)),
    categories: importCatalog ? mergeArrayBy(db.categories, snapshot.categories, (category) => category?.id) : db.categories,
    games: importCatalog ? mergeRecordLists(db.games, snapshot.games, (game) => game?.id) : db.games,
    products: importCatalog ? mergeRecordLists(db.products, stripProductSquadBindings(snapshot.products), (product) => product?.id) : db.products,
    orders: mergeOrders(db.orders, Array.isArray(snapshot.orders) ? snapshot.orders.map(stripOrderSquadRouting) : []),
    squads: db.squads,
    squadRouting: db.squadRouting,
    orderChats: mergeChatRecords(db.orderChats, snapshot.orderChats),
    chatTyping: snapshot.chatTyping && typeof snapshot.chatTyping === "object" && !Array.isArray(snapshot.chatTyping) ? snapshot.chatTyping : db.chatTyping,
    mailboxMessages: mergeChatRecords(db.mailboxMessages, snapshot.mailboxMessages),
    ledger: mergeArrayBy(db.ledger, snapshot.ledger, (entry) => entry?.id),
    adminLogs: mergeArrayBy(db.adminLogs, snapshot.adminLogs, (entry) => entry?.id),
    systemSettings: mergeSystemSettings(db.systemSettings, snapshot.systemSettings)
  });
  return inputStorage ? markDbStorage(imported, inputStorage, inputPrimaryError) : imported;
}

function findUser(db, username) {
  const key = normalize(username);
  return db.users.find((user) => normalize(user.username) === key)
    || BuiltInUsers.find((user) => normalize(user.username) === key);
}

function findUserByEmail(db, email) {
  const key = normalizeEmail(email);
  return db.users.find((user) => userEmail(user) === key)
    || BuiltInUsers.find((user) => userEmail(user) === key);
}

function profileByUsername(db, username) {
  return db.profiles.find((profile) => normalize(profile.username) === normalize(username));
}

function isBanned(profile) {
  return Boolean(profile?.bannedUntil && new Date(profile.bannedUntil) > new Date());
}

function ensureAvailable(db, user) {
  const profile = profileByUsername(db, user.username);
  if (profile?.deleted) {
    return { ok: false, message: "该账户已注销。" };
  }
  if (isBanned(profile)) {
    return { ok: false, message: `该账户已被封禁至 ${profile.bannedUntil}。` };
  }
  return { ok: true };
}

function verifyUserPassword(db, user, password) {
  const builtIn = BuiltInUsers.find((item) => normalize(item.username) === normalize(user.username));
  if (builtIn) {
    return builtIn.password === password;
  }
  return verifyPassword(password, user.passwordHash);
}

function makeSessionResponse(db, user) {
  const token = signToken({ username: user.username, role: user.role });
  const profile = profileByUsername(db, user.username);
  if (profile) {
    profile.lastOnlineAt = nowIso();
  }
  return {
    ok: true,
    token,
    user: { username: user.username, role: user.role },
    snapshot: sanitizeSnapshot(db)
  };
}

function verificationKey(purpose, email) {
  return `${purpose}:${normalizeEmail(email)}`;
}

function clientIp(request = {}) {
  const nodeRequest = request.request || request;
  const headers = nodeRequest?.headers || {};
  const forwarded = String(headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(headers["x-real-ip"] || nodeRequest?.socket?.remoteAddress || "").trim();
}

function userAgent(request = {}) {
  const nodeRequest = request.request || request;
  return String(nodeRequest?.headers?.["user-agent"] || "").trim();
}

function privacyHash(label, value) {
  return value ? hmac(`${label}:${value}`) : "";
}

function pruneEmailSecurityRecords(db) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  db.emailVerifications = (db.emailVerifications || [])
    .filter((record) => timestampMs(record.createdAt) >= cutoff || (!record.consumedAt && timestampMs(record.expiresAt) >= Date.now()))
    .slice(0, 1000);
  db.emailLogs = (db.emailLogs || []).slice(0, 5000);
}

function canRequestVerification(db, email, request) {
  pruneEmailSecurityRecords(db);
  const emailHash = privacyHash("email", normalizeEmail(email));
  const ipHash = privacyHash("ip", clientIp(request));
  const now = Date.now();
  const lastEmailRequest = (db.emailVerifications || []).find((record) => (
    record.emailHash === emailHash && timestampMs(record.createdAt) > now - VerificationCooldownMs
  ));
  if (lastEmailRequest) {
    return { ok: false, message: "Please wait before requesting another code." };
  }
  if (ipHash) {
    const ipRequests = (db.emailVerifications || []).filter((record) => (
      record.ipHash === ipHash && timestampMs(record.createdAt) > now - VerificationIpWindowMs
    ));
    if (ipRequests.length >= VerificationIpLimit) {
      return { ok: false, message: "Too many verification requests. Please try again later." };
    }
  }
  return { ok: true };
}

function storeVerification(db, purpose, email, code, request = {}) {
  // AI: never persist raw code/email/IP/UA; JSON state stores hashes until normalized DB migration.
  const createdAt = nowIso();
  const expiresAtMs = Date.now() + VerificationMaxAgeMs;
  const id = createId("emailv");
  const record = {
    id,
    emailHash: privacyHash("email", normalizeEmail(email)),
    codeHash: hmac(`${purpose}:${normalizeEmail(email)}:${code}`),
    purpose,
    expiresAt: new Date(expiresAtMs).toISOString(),
    consumedAt: "",
    ipHash: privacyHash("ip", clientIp(request)),
    userAgentHash: privacyHash("ua", userAgent(request)),
    createdAt
  };
  db.verifications[verificationKey(purpose, email)] = {
    id,
    hash: record.codeHash,
    expiresAt: expiresAtMs,
    createdAt
  };
  db.emailVerifications = [record, ...(db.emailVerifications || [])].slice(0, 1000);
  return record;
}

function verifyCode(db, purpose, email, code) {
  const key = verificationKey(purpose, email);
  const record = db.verifications[key];
  if (!record || Date.now() > record.expiresAt) {
    return { ok: false, message: "验证码已过期，请重新发送。" };
  }
  const actual = hmac(`${purpose}:${normalizeEmail(email)}:${String(code || "").trim()}`);
  if (actual !== record.hash) {
    return { ok: false, message: "验证码不正确。" };
  }
  const verification = (db.emailVerifications || []).find((item) => item.id === record.id);
  if (verification) {
    verification.consumedAt = nowIso();
  }
  delete db.verifications[key];
  return { ok: true };
}

function recordEmailLog(db, emailType, recipient, subject, result = {}) {
  // AI: log provider outcome, not recipient PII. Future normalized table: database/email-service.sql.
  db.emailLogs = [{
    id: createId("email"),
    provider: result.provider || "resend",
    emailType,
    recipientHash: privacyHash("email", normalizeEmail(recipient)),
    subject: subject || result.subject || "",
    status: result.ok ? "sent" : (result.configured === false ? "not_configured" : "failed"),
    providerMessageId: result.id || "",
    errorMessage: result.error || "",
    createdAt: nowIso()
  }, ...(db.emailLogs || [])].slice(0, 5000);
}

async function sendTrackedEmail(db, emailType, payload = {}) {
  const result = await sendProviderEmail(emailType, payload);
  recordEmailLog(db, emailType, payload.to || payload.email || payload.recipient, result.subject || payload.subject, result);
  return result;
}

function log(db, action, detail, actor = "SYSTEM") {
  db.adminLogs = [{
    id: createId("log"),
    actor,
    action,
    detail,
    createdAt: nowIso()
  }, ...db.adminLogs];
}

function timestampMs(value) {
  const time = new Date(value || "").getTime();
  return Number.isFinite(time) ? time : 0;
}

function mailboxCategoryId(category) {
  return MailboxCategories.has(category) ? category : "system";
}

function mailboxExpiryDays(category, customDays = null) {
  const requested = Number(customDays);
  if (Number.isFinite(requested) && requested > 0) {
    return Math.min(365, Math.max(1, Math.ceil(requested)));
  }
  return MailboxExpiryDays[mailboxCategoryId(category)] || 30;
}

function visibleTextLength(value) {
  return Array.from(String(value || "").trim()).length;
}

function clipVisibleText(value, maxLength) {
  return Array.from(String(value || "").trim()).slice(0, maxLength).join("");
}

function validateAdminMailboxPayload(payload = {}) {
  const target = payload.target === "user" ? "user" : "all";
  const username = String(payload.username || "").trim();
  const subject = String(payload.subject || "").trim();
  const body = String(payload.body || "").trim();
  const rawExpiresDays = payload.expiresDays === undefined || payload.expiresDays === null || payload.expiresDays === ""
    ? 30
    : payload.expiresDays;
  const expiresDays = Number(rawExpiresDays);
  if (target === "user" && !username) {
    return { ok: false, message: "请填写用户名。" };
  }
  if (!subject || !body) {
    return { ok: false, message: "请填写邮件标题和正文。" };
  }
  if (visibleTextLength(subject) > AdminMailboxSubjectMaxLength) {
    return { ok: false, message: `邮件标题最多 ${AdminMailboxSubjectMaxLength} 个字。` };
  }
  if (visibleTextLength(body) > AdminMailboxBodyMaxLength) {
    return { ok: false, message: `邮件正文最多 ${AdminMailboxBodyMaxLength} 个字。` };
  }
  if (!Number.isFinite(expiresDays) || expiresDays < 1 || expiresDays > 365) {
    return { ok: false, message: "过期天数需在 1 到 365 天之间。" };
  }
  return { ok: true, target, username, subject, body, expiresDays: Math.ceil(expiresDays) };
}

function canReceiveAdminMailbox(db, profile) {
  if (!profile || profile.deleted || !normalize(profile.username)) {
    return false;
  }
  const user = findUser(db, profile.username);
  return normalize(user?.role || profile.role || "customer") !== "admin";
}

function mailboxEntryReadable(db, entry) {
  if (!entry) {
    return false;
  }
  const key = normalize(entry.recipientUsername);
  const list = key && Array.isArray(db.mailboxMessages?.[key]) ? db.mailboxMessages[key] : [];
  return list.some((message) => message && typeof message === "object" && message.id === entry.id && !message.deletedAt);
}

function mailboxExpiresAt(category, createdAt, customDays = null) {
  const created = timestampMs(createdAt) || Date.now();
  return new Date(created + mailboxExpiryDays(category, customDays) * DayMs).toISOString();
}

function mailboxIsAdminSystemMessage(message) {
  return mailboxCategoryId(message?.category) === "system" && normalize(message?.source) === "admin";
}

function normalizeMailboxMessageForApi(message, index = 0) {
  const category = mailboxCategoryId(message?.category);
  const createdAt = message?.createdAt || new Date(0).toISOString();
  const body = String(message?.body || message?.preview || "");
  const source = String(message?.source || "system").trim() || "system";
  const normalized = {
    ...message,
    id: String(message?.id || `mail-${timestampMs(createdAt) || 0}-${index}`),
    category,
    subject: String(message?.subject || "System Notice").trim(),
    preview: String(message?.preview || body || "System Notice").trim(),
    body,
    sender: String(message?.sender || SystemSenderName).trim(),
    source,
    sourceId: String(message?.sourceId || "").trim(),
    orderId: String(message?.orderId || "").trim(),
    favoritedAt: message?.favoritedAt || "",
    expiresDays: message?.expiresDays || "",
    expiresAt: message?.expiresAt || mailboxExpiresAt(category, createdAt, message?.expiresDays),
    claim: message?.claim && typeof message.claim === "object" && !Array.isArray(message.claim) ? { ...message.claim } : null,
    readAt: message?.readAt || "",
    createdAt
  };
  return mailboxIsAdminSystemMessage(normalized) ? { ...normalized, sender: "管理员" } : normalized;
}

function mailboxMessageVisible(message, nowMs = Date.now()) {
  return Boolean(message && typeof message === "object" && !message.deletedAt && (message.favoritedAt || timestampMs(message.expiresAt) > nowMs));
}

function mailboxSortCompare(a, b) {
  const timeDelta = timestampMs(b.createdAt) - timestampMs(a.createdAt);
  if (timeDelta) {
    return timeDelta;
  }
  return Number(mailboxIsAdminSystemMessage(b)) - Number(mailboxIsAdminSystemMessage(a));
}

function mailboxCounts(messages = []) {
  const categoryCounts = {};
  const unreadCategoryCounts = {};
  Array.from(MailboxCategories).forEach((category) => {
    const categoryMessages = messages.filter((message) => mailboxCategoryId(message.category) === category);
    categoryCounts[category] = categoryMessages.length;
    unreadCategoryCounts[category] = categoryMessages.filter((message) => !message.readAt).length;
  });
  return {
    count: messages.length,
    unreadCount: messages.filter((message) => !message.readAt).length,
    categoryCounts,
    unreadCategoryCounts
  };
}

function mailboxPayloadForUser(db, username) {
  const user = findUser(db, username);
  const resolvedUsername = user?.username || username;
  const key = normalize(resolvedUsername);
  const raw = key && Array.isArray(db.mailboxMessages[key]) ? db.mailboxMessages[key] : [];
  const nowMs = Date.now();
  const messages = raw
    .filter((message) => message && typeof message === "object" && !Array.isArray(message))
    .map((message, index) => normalizeMailboxMessageForApi(message, index))
    .filter((message) => mailboxMessageVisible(message, nowMs))
    .sort(mailboxSortCompare);
  return {
    username: resolvedUsername,
    key,
    messages,
    mailboxMessages: { [key]: messages },
    ...mailboxCounts(messages)
  };
}

function pruneMailboxMessages(db, username) {
  const key = normalize(username);
  if (!key) {
    return false;
  }
  const list = Array.isArray(db.mailboxMessages[key]) ? db.mailboxMessages[key] : [];
  const now = nowIso();
  const nowTime = timestampMs(now);
  let changed = false;
  const next = list.map((message) => {
    if (!message || typeof message !== "object" || Array.isArray(message)) {
      return message;
    }
    const category = mailboxCategoryId(message.category);
    const expiresAt = message.expiresAt || mailboxExpiresAt(category, message.createdAt, message.expiresDays);
    let output = { ...message, category, expiresAt };
    if (category !== message.category || expiresAt !== message.expiresAt) {
      changed = true;
    }
    if (!output.deletedAt && !output.favoritedAt && timestampMs(expiresAt) <= nowTime) {
      output = { ...output, deletedAt: now };
      changed = true;
    }
    return output;
  });
  Array.from(MailboxCategories).forEach((category) => {
    const active = next
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => message && typeof message === "object" && !message.deletedAt && mailboxCategoryId(message.category) === category);
    while (active.filter(({ message }) => !message.deletedAt).length > MailboxCategoryLimit) {
      const candidates = active
        .filter(({ message }) => !message.deletedAt && !message.favoritedAt)
        .sort((a, b) => {
          const readDelta = (a.message.readAt ? 0 : 1) - (b.message.readAt ? 0 : 1);
          return readDelta || (timestampMs(a.message.createdAt) || 0) - (timestampMs(b.message.createdAt) || 0);
        });
      const target = candidates.find(({ message }) => message.readAt) || candidates[0];
      if (!target) {
        break;
      }
      next[target.index] = { ...target.message, deletedAt: now };
      target.message.deletedAt = now;
      changed = true;
    }
  });
  if (changed) {
    db.mailboxMessages[key] = next;
  }
  return changed;
}

function isoDateOnly(value) {
  const time = timestampMs(value);
  return time ? new Date(time).toISOString().slice(0, 10) : "unknown";
}

function dateRange(records, dateFn) {
  const times = records.map(dateFn).map(timestampMs).filter(Boolean).sort((a, b) => a - b);
  if (!times.length) {
    const today = nowIso();
    return { start: isoDateOnly(today), end: isoDateOnly(today) };
  }
  return {
    start: isoDateOnly(times[0]),
    end: isoDateOnly(times[times.length - 1])
  };
}

function archiveAttachment(filename, payload) {
  return {
    filename,
    content: Buffer.from(JSON.stringify(payload, null, 2), "utf8").toString("base64"),
    content_type: "application/json"
  };
}

function closedOrderArchiveDate(order) {
  if (!orderChatIsReadOnly(order)) {
    return "";
  }
  return order.completedAt || order.settledAt || order.refundedAt || order.returnRefundedAt || order.updatedAt || order.createdAt || "";
}

async function sendArchivePackage(db, kind, records, dateFn) {
  const backupEmail = normalizeEmail(db.systemSettings?.backupEmail || "");
  if (!isEmail(backupEmail) || !records.length) {
    return { ok: false, skipped: true };
  }
  const range = dateRange(records, dateFn);
  const kindLabel = kind === "logs" ? "System Logs" : "Order Records";
  const subject = `${BrandName} ${kindLabel} Backup ${range.start} to ${range.end}`;
  const filename = `impulse-${kind === "logs" ? "system-logs" : "order-records"}-${range.start}-to-${range.end}.json`;
  const payload = {
    exportedAt: nowIso(),
    type: kind,
    period: range,
    count: records.length,
    records
  };
  const body = [
    `${BrandName} ${kindLabel} backup package.`,
    `Period: ${range.start} to ${range.end}.`,
    `Record count: ${records.length}.`,
    "The JSON archive is attached to this email. Do not share it publicly."
  ].join("\n");
  const mail = await sendTrackedEmail(db, EmailTypes.ADMIN_ALERT, {
    to: backupEmail,
    subject,
    message: body,
    attachments: [archiveAttachment(filename, payload)]
  });
  if (mail.ok) {
    db.systemSettings.backupHistory = [{
      id: createId("backup"),
      type: kind,
      email: backupEmail,
      subject,
      filename,
      periodStart: range.start,
      periodEnd: range.end,
      count: records.length,
      providerId: mail.id || "",
      createdAt: nowIso()
    }, ...(db.systemSettings.backupHistory || [])].slice(0, 120);
  }
  return { ...mail, range, filename };
}

async function applyRetentionPolicies(db) {
  // AI: chat=7d after order end; logs/orders=30d purge only after backup mail succeeds.
  let changed = false;
  const now = Date.now();
  const chatCutoff = now - ChatRetentionMs;
  const archiveCutoff = now - ArchiveRetentionMs;
  const ordersById = new Map((db.orders || []).map((order) => [order.id, order]));
  const expiredChatOrderIds = [];

  Object.keys(db.orderChats || {}).forEach((orderId) => {
    const order = ordersById.get(orderId);
    const endedAt = closedOrderArchiveDate(order);
    const endedTime = timestampMs(endedAt);
    if (endedTime && endedTime < chatCutoff) {
      changed = true;
      expiredChatOrderIds.push(orderId);
      delete db.orderChats[orderId];
    }
  });
  await pruneSupabaseChatRows(expiredChatOrderIds);

  const expiredLogs = db.adminLogs.filter((entry) => timestampMs(entry.createdAt) && timestampMs(entry.createdAt) < archiveCutoff);
  if (expiredLogs.length) {
    const mail = await sendArchivePackage(db, "logs", expiredLogs, (entry) => entry.createdAt);
    if (mail.ok) {
      const expiredIds = new Set(expiredLogs.map((entry) => entry.id));
      db.adminLogs = db.adminLogs.filter((entry) => !expiredIds.has(entry.id));
      log(db, "系统日志备份", `${mail.range.start} 至 ${mail.range.end}，${expiredLogs.length} 条，已发送至 ${db.systemSettings.backupEmail}`);
      changed = true;
    } else if (!mail.skipped) {
      changed = true;
    }
  }

  const expiredOrders = db.orders.filter((order) => {
    const archivedAt = closedOrderArchiveDate(order);
    return archivedAt && timestampMs(archivedAt) < archiveCutoff;
  });
  if (expiredOrders.length) {
    const mail = await sendArchivePackage(db, "orders", expiredOrders, closedOrderArchiveDate);
    if (mail.ok) {
      const expiredIds = new Set(expiredOrders.map((order) => order.id));
      db.orders = db.orders.filter((order) => !expiredIds.has(order.id));
      expiredIds.forEach((orderId) => {
        delete db.orderChats[orderId];
      });
      log(db, "单号数据备份", `${mail.range.start} 至 ${mail.range.end}，${expiredOrders.length} 条，已发送至 ${db.systemSettings.backupEmail}`);
      changed = true;
    } else if (!mail.skipped) {
      changed = true;
    }
  }

  return { changed, expiredLogs: expiredLogs.length, expiredOrders: expiredOrders.length };
}

function addLedger(db, profile, delta, reason, meta = {}, actor = "SYSTEM") {
  const before = Number(profile.funds || 0);
  const after = before + Number(delta || 0);
  if (after < 0 && !meta.allowNegative) {
    return { ok: false, reason: "insufficient", before, after };
  }
  profile.funds = after;
  const entry = {
    id: createId("flow"),
    userId: profile.id,
    username: profile.username,
    role: profile.role,
    type: meta.type || "manual",
    title: reason,
    amountPoints: Number(delta || 0),
    amountMoney: Number(meta.amountMoney || 0),
    before,
    after,
    orderId: meta.orderId || "",
    itemName: meta.itemName || "",
    operator: actor,
    createdAt: nowIso()
  };
  db.ledger = [entry, ...db.ledger];
  log(db, "资金流水", `${profile.username} ${reason}: ${before} -> ${after}`, actor);
  return { ok: true, profile, entry };
}

function normalizeChatContentType(value, message = {}) {
  const raw = String(value || message.type || "").toLowerCase().replace(/-/g, "_");
  if (raw === "image" || message.imageData || message.imageUrl) return "image";
  if (raw === "system") return "system";
  if (raw === "action_card") return "action_card";
  return "text";
}

function normalizeChatMessageType(message = {}) {
  const raw = String(message.messageType || message.message_type || "").toLowerCase().replace(/-/g, "_");
  const catalogType = ChatQuickMessageCatalog[normalizeChatCatalogKey(message)]?.type || "";
  if (raw === "system" || message.type === "system" || message.role === "system") return "system";
  if (raw === "action_card" || message.type === "action_card" || catalogType === "action_card") return "action_card";
  if (raw === "quick_message" || catalogType === "quick_message") return "quick_message";
  return "user_message";
}

function normalizeChatSenderRole(role = "system") {
  const normalized = String(role || "system").toLowerCase().replace(/-/g, "_");
  if (normalized === "staff" || normalized === "employee") return "vector";
  if (normalized === "customer" || normalized === "user") return "gamer";
  if (["gamer", "vector", "admin", "system"].includes(normalized)) return normalized;
  return "system";
}

const ChatQuickMessageCatalog = Object.freeze({
  "quick.i_am_ready": { code: "BASIC_READY", type: "quick_message", en: "I am ready." },
  "quick.wait_moment": { code: "BASIC_WAIT", type: "quick_message", en: "Please wait {minutes} minute(s).", defaultParams: { minutes: 5 } },
  "quick.wait_5_minutes": { code: "BASIC_WAIT_5", type: "quick_message", en: "Please wait 5 minutes.", defaultParams: { minutes: 5 } },
  "quick.ask_game_id": { code: "BASIC_ASK_GAME_ID", type: "quick_message", en: "What is your game ID?" },
  "quick.share_game_id": { code: "BASIC_SHARE_GAME_ID", type: "quick_message", en: "My game ID is: {game_id}" },
  "quick.please_invite_me": { code: "BASIC_INVITE_ME", type: "quick_message", en: "Please invite me." },
  "quick.joined_lobby": { code: "BASIC_JOINED_LOBBY", type: "quick_message", en: "I have joined the lobby." },
  "quick.lets_start": { code: "BASIC_START_NOW", type: "quick_message", en: "Let's start." },
  "quick.good_game": { code: "BASIC_GOOD_GAME", type: "quick_message", en: "Good game." },
  "quick.thank_you": { code: "BASIC_THANK_YOU", type: "quick_message", en: "Thank you." },
  "quick.see_you_next_time": { code: "BASIC_SEE_YOU_NEXT_TIME", type: "quick_message", en: "See you next time." },
  "quick.ask_completion_eta": { code: "PROGRESS_ASK_TIME", type: "quick_message", en: "How much longer will it take to complete the order?" },
  "flow.completion.ready_now": { code: "PROGRESS_READY_TO_COMPLETE", type: "quick_message", en: "The completion requirements have been met. The order can be completed now." },
  "flow.completion.eta_days": { code: "PROGRESS_NEED_MORE_TIME", type: "quick_message", en: "Estimated time remaining: {days} day(s)." },
  "flow.completion.unknown": { code: "PROGRESS_NOT_SURE", type: "quick_message", en: "I am not sure yet and cannot provide an estimate." },
  "quick.ask_progress_status": { code: "PROGRESS_ASK_STATUS", type: "quick_message", en: "What is the current progress?" },
  "quick.progress_going_well": { code: "PROGRESS_GOING_WELL", type: "quick_message", en: "Progress is going well." },
  "quick.progress_issue_found": { code: "PROGRESS_ISSUE_FOUND", type: "quick_message", en: "There is an issue that may affect progress." },
  "quick.progress_almost_done": { code: "PROGRESS_ALMOST_DONE", type: "quick_message", en: "The order is almost complete." },
  "flow.customer.complete_now": { code: "COMPLETE_CONFIRM_NOW", type: "action_card", actionStatus: "pending", en: "I agree. Complete the order now." },
  "flow.customer.need_confirm": { code: "COMPLETE_NEED_CHECK", type: "quick_message", en: "I need to check again before completing the order." },
  "action.complete.vector_request": { code: "COMPLETE_VECTOR_REQUEST", type: "action_card", actionStatus: "pending", en: "Vector marked the service as ready for completion." },
  "system.complete.done": { code: "COMPLETE_SYSTEM_DONE", type: "system", systemOnly: true, en: "Order completed successfully." },
  "action.expedite.request": { code: "EXPEDITE_REQUEST", type: "action_card", actionStatus: "pending", en: "Gamer requested expedited service. Extra reward: {amount} credits." },
  "action.expedite.accept": { code: "EXPEDITE_ACCEPT", type: "action_card", actionStatus: "accepted", en: "Vector accepted the expedite request." },
  "action.expedite.decline": { code: "EXPEDITE_DECLINE", type: "action_card", actionStatus: "declined", en: "Vector declined the expedite request." },
  "system.expedite.active": { code: "EXPEDITE_SYSTEM_ACTIVE", type: "system", systemOnly: true, en: "This order is now expedited." },
  "action.tip.send": { code: "TIP_SEND", type: "action_card", actionStatus: "accepted", en: "Gamer sent a tip of {amount} credits to Vector." },
  "quick.tip_thanks": { code: "TIP_THANKS", type: "quick_message", en: "Thank you for the tip." },
  "action.refund.request": { code: "REFUND_REQUEST", type: "action_card", actionStatus: "pending", en: "Gamer requested a refund or cancellation. Reason: {reason}." },
  "action.refund.accept": { code: "REFUND_ACCEPT", type: "action_card", actionStatus: "accepted", en: "Vector accepted the refund request." },
  "action.refund.dispute": { code: "REFUND_DISPUTE", type: "action_card", actionStatus: "disputed", en: "Vector disputed the refund request. Admin review is required." },
  "action.cancel.request": { code: "CANCEL_REQUEST", type: "action_card", actionStatus: "pending", en: "Gamer requested to cancel the order." },
  "action.cancel.accept": { code: "CANCEL_ACCEPT", type: "action_card", actionStatus: "accepted", en: "Vector accepted the cancellation request." },
  "action.cancel.dispute": { code: "CANCEL_DISPUTE", type: "action_card", actionStatus: "disputed", en: "Vector disputed the cancellation request. Admin review is required." },
  "action.report.submit": { code: "REPORT_SUBMIT", type: "action_card", actionStatus: "pending", en: "A report has been submitted for this order. Admin review is required." },
  "system.admin.joined": { code: "ADMIN_JOINED", type: "system", systemOnly: true, en: "An admin has joined the order." },
  "system.admin.reviewing": { code: "ADMIN_REVIEWING", type: "system", systemOnly: true, en: "Admin is reviewing this order." },
  "system.admin.resolved": { code: "ADMIN_RESOLVED", type: "system", systemOnly: true, en: "Admin has resolved this issue." },
  "quick.lobby_send_invite": { code: "LOBBY_SEND_INVITE", type: "quick_message", en: "Please send the lobby invite." },
  "quick.lobby_invite_sent": { code: "LOBBY_INVITE_SENT", type: "quick_message", en: "The invite has been sent." },
  "quick.lobby_invite_not_received": { code: "LOBBY_INVITE_NOT_RECEIVED", type: "quick_message", en: "I did not receive the invite." },
  "quick.lobby_resend_invite": { code: "LOBBY_RESEND_INVITE", type: "quick_message", en: "I will resend the invite." },
  "quick.lobby_check_game_id": { code: "LOBBY_CHECK_GAME_ID", type: "quick_message", en: "Please check the game ID." },
  "quick.connection_issue": { code: "CONNECTION_ISSUE", type: "quick_message", en: "There is a connection issue." },
  "quick.need_help": { code: "SUPPORT_NEED_HELP", type: "quick_message", en: "I need support." },
  "quick.contact_support": { code: "SUPPORT_CONTACT_ADMIN", type: "quick_message", en: "Please contact admin support." },
  "system.support.notified": { code: "SUPPORT_SYSTEM_NOTIFIED", type: "system", systemOnly: true, en: "Support has been notified." },
  "system.vector.assigned": { code: "SYS_VECTOR_ASSIGNED", type: "system", systemOnly: true, en: "A Vector has accepted this order." },
  "system.order.started": { code: "SYS_ORDER_STARTED", type: "system", systemOnly: true, en: "The order has started." },
  "system.order.paused": { code: "SYS_ORDER_PAUSED", type: "system", systemOnly: true, en: "The order has been paused." },
  "system.order.resumed": { code: "SYS_ORDER_RESUMED", type: "system", systemOnly: true, en: "The order has resumed." },
  "system.order.expired": { code: "SYS_ORDER_EXPIRED", type: "system", systemOnly: true, en: "This order action has expired." },
  "system.action.accepted": { code: "SYS_ACTION_ACCEPTED", type: "system", systemOnly: true, en: "The action has been accepted." },
  "system.action.declined": { code: "SYS_ACTION_DECLINED", type: "system", systemOnly: true, en: "The action has been declined." }
});

const ChatQuickCodeToCatalogKey = Object.freeze(
  Object.fromEntries(Object.entries(ChatQuickMessageCatalog).map(([key, value]) => [value.code || key, key]))
);

const ChatQuickActionStates = Object.freeze(["pending", "accepted", "declined", "expired", "disputed"]);

const ChatQuickParamRules = Object.freeze({
  "quick.wait_moment": { minutes: { type: "integer", min: 1, max: 60, defaultValue: 5 } },
  "flow.completion.eta_days": { days: { type: "integer", min: 1, max: 30, defaultValue: 1 } },
  "quick.share_game_id": { game_id: { type: "text", minLength: 1, maxLength: 40 } },
  "action.expedite.request": { amount: { type: "number", min: 1, max: 99999 } },
  "action.tip.send": { amount: { type: "number", min: 1, max: 99999 } },
  "action.refund.request": { reason: { type: "text", minLength: 2, maxLength: 160 } }
});

function chatMetadataObject(message = {}) {
  return message.metadata && typeof message.metadata === "object" && !Array.isArray(message.metadata) ? message.metadata : {};
}

function normalizeChatCatalogKey(message = {}) {
  const metadata = chatMetadataObject(message);
  const candidates = [
    message.catalogKey,
    message.catalog_key,
    message.messageKey,
    message.message_key,
    message.key,
    metadata.catalogKey,
    metadata.catalog_key,
    metadata.messageKey,
    metadata.message_key,
    metadata.key
  ];
  for (const candidate of candidates) {
    const key = String(candidate || "").trim();
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(ChatQuickMessageCatalog, key)) return key;
    if (ChatQuickCodeToCatalogKey[key]) return ChatQuickCodeToCatalogKey[key];
  }
  return "";
}

function chatCanonicalMessageKey(catalogKey = "") {
  const key = normalizeChatCatalogKey({ catalogKey });
  return key ? (ChatQuickMessageCatalog[key]?.code || key) : "";
}

function normalizeChatMessageKey(message = {}) {
  return chatCanonicalMessageKey(normalizeChatCatalogKey(message));
}

function chatMessageParamsFrom(message = {}) {
  const metadata = chatMetadataObject(message);
  const params =
    (message.messageParams && typeof message.messageParams === "object" && !Array.isArray(message.messageParams) ? message.messageParams : null) ||
    (message.message_params && typeof message.message_params === "object" && !Array.isArray(message.message_params) ? message.message_params : null) ||
    (metadata.messageParams && typeof metadata.messageParams === "object" && !Array.isArray(metadata.messageParams) ? metadata.messageParams : null) ||
    (metadata.message_params && typeof metadata.message_params === "object" && !Array.isArray(metadata.message_params) ? metadata.message_params : null) ||
    {};
  return { ...params };
}

function chatActionStatus(message = {}, catalogKey = "") {
  const metadata = chatMetadataObject(message);
  const normalizedKey = normalizeChatCatalogKey({ catalogKey }) || normalizeChatCatalogKey(message);
  const raw = String(
    message.actionStatus ||
    message.action_status ||
    metadata.actionStatus ||
    metadata.action_status ||
    ""
  ).trim().toLowerCase();
  if (ChatQuickActionStates.includes(raw)) return raw;
  const configured = normalizedKey ? ChatQuickMessageCatalog[normalizedKey]?.actionStatus || "" : "";
  if (configured && ChatQuickActionStates.includes(configured)) return configured;
  const key = String(chatCanonicalMessageKey(normalizedKey) || "").toUpperCase();
  return key.includes("REQUEST") || key.includes("REPORT") ? "pending" : "";
}

function chatTextForKey(key, params = {}) {
  const catalogKey = normalizeChatCatalogKey({ messageKey: key });
  const item = catalogKey ? ChatQuickMessageCatalog[catalogKey] : null;
  const template = item?.en || "";
  if (!template) {
    return "";
  }
  const resolvedParams = { ...(item.defaultParams || {}), ...(params || {}) };
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => String(resolvedParams?.[name] ?? ""));
}

function sanitizeChatParam(value, limit = 80) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function chatParamAliasValue(params = {}, name = "") {
  if (Object.prototype.hasOwnProperty.call(params, name)) return params[name];
  const camel = name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  return Object.prototype.hasOwnProperty.call(params, camel) ? params[camel] : undefined;
}

function normalizeChatParamsForKey(catalogKey = "", params = {}) {
  const item = ChatQuickMessageCatalog[catalogKey] || {};
  const rules = ChatQuickParamRules[catalogKey] || {};
  const normalized = { ...(item.defaultParams || {}) };
  for (const [name, rule] of Object.entries(rules)) {
    let raw = chatParamAliasValue(params, name);
    if ((raw === undefined || raw === null || raw === "") && rule.defaultValue !== undefined) {
      raw = rule.defaultValue;
    }
    if (raw === undefined || raw === null || raw === "") {
      return { ok: false, message: "请补全快捷消息参数。" };
    }
    if (rule.type === "integer") {
      const value = Number(raw);
      if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
        return { ok: false, message: `参数 ${name} 必须在 ${rule.min} 到 ${rule.max} 之间。` };
      }
      normalized[name] = value;
      continue;
    }
    if (rule.type === "number") {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
        return { ok: false, message: `参数 ${name} 必须在 ${rule.min} 到 ${rule.max} 之间。` };
      }
      normalized[name] = value;
      continue;
    }
    const value = sanitizeChatParam(raw, rule.maxLength || 80);
    if (value.length < (rule.minLength || 0)) {
      return { ok: false, message: "请补全快捷消息参数。" };
    }
    normalized[name] = value;
  }
  return { ok: true, params: normalized };
}

function normalizeClientChatPayload(payload = {}) {
  const contentType = normalizeChatContentType(payload.type, payload);
  if (contentType === "image" || payload.imageData || payload.imageUrl) {
    return { ok: false, message: "图片上传暂未开放。" };
  }
  const requestedType = normalizeChatMessageType(payload);
  if (requestedType === "system") {
    return { ok: false, message: "系统消息只能由平台生成。" };
  }

  const metadata = chatMetadataObject(payload);
  const catalogKey = normalizeChatCatalogKey(payload);
  const catalogItem = ChatQuickMessageCatalog[catalogKey] || {};
  if (!catalogKey) {
    return { ok: false, message: "请选择一条快捷消息。" };
  }
  if (catalogItem.systemOnly || catalogItem.type === "system") {
    return { ok: false, message: "系统消息只能由平台生成。" };
  }
  const messageKey = chatCanonicalMessageKey(catalogKey);
  const messageType = catalogItem.type === "action_card" ? "action_card" : "quick_message";
  const nextContentType = messageType === "action_card" ? "action_card" : "text";
  if (!["user_message", "quick_message", "action_card"].includes(requestedType)) {
    return { ok: false, message: "不支持的快捷消息类型。" };
  }
  const params = chatMessageParamsFrom(payload);
  const normalizedParams = normalizeChatParamsForKey(catalogKey, params);
  if (!normalizedParams.ok) return normalizedParams;
  const actionStatus = chatActionStatus(payload, catalogKey);

  return {
    ok: true,
    message: {
      id: payload.id,
      type: nextContentType,
      messageType,
      message_type: messageType,
      text: chatTextForKey(messageKey, normalizedParams.params),
      catalogKey,
      catalog_key: catalogKey,
      messageKey,
      message_key: messageKey,
      messageParams: normalizedParams.params,
      message_params: normalizedParams.params,
      actionStatus,
      action_status: actionStatus,
      createdAt: payload.createdAt,
      metadata: {
        ...metadata,
        catalogKey,
        catalog_key: catalogKey,
        messageKey,
        message_key: messageKey,
        messageParams: normalizedParams.params,
        message_params: normalizedParams.params,
        messageType,
        message_type: messageType,
        actionStatus,
        action_status: actionStatus,
        replyTo: sanitizeChatParam(metadata.replyTo || metadata.reply_to, 80),
        reply_to: sanitizeChatParam(metadata.replyTo || metadata.reply_to, 80)
      }
    }
  };
}

function orderTextField(order, ...names) {
  for (const name of names) {
    const value = order?.[name];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function orderCustomerParticipants(order) {
  return [
    orderTextField(order, "customerUsername", "customer_username"),
    orderTextField(order, "customerId", "customer_id", "userId", "user_id")
  ].filter(Boolean);
}

function orderStaffParticipants(order) {
  return [
    orderTextField(order, "handledBy", "handled_by"),
    orderTextField(order, "acceptedBy", "accepted_by"),
    orderTextField(order, "employeeId", "employee_id"),
    orderTextField(order, "assignedTo", "assigned_to"),
    orderTextField(order, "assignedVectorId", "assigned_vector_id"),
    orderTextField(order, "assignedVectorName", "assigned_vector_name"),
    orderTextField(order, "vectorUsername", "vector_username"),
    orderTextField(order, "staffUsername", "staff_username")
  ].filter(Boolean);
}

function orderChatAvailable(order) {
  if (!order) {
    return false;
  }
  return Boolean(
    orderStaffParticipants(order).length
    || orderTextField(order, "acceptedAt", "accepted_at")
  );
}

function chatActorKeys(db, user) {
  const profile = profileByUsername(db, user?.username);
  return [
    user?.username,
    user?.id,
    user?.userId,
    user?.user_id,
    profile?.username,
    profile?.id,
    profile?.userId,
    profile?.user_id
  ].filter(Boolean).map(normalize);
}

function chatAccess(db, orderId, user) {
  if (!user) {
    return { ok: false, message: "请先登录" };
  }
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) {
    return { ok: false, message: "订单不存在" };
  }
  if (!orderChatAvailable(order)) {
    return { ok: false, message: "Vector 接单后即可打开聊天框。" };
  }
  const allowed = [
    ...orderCustomerParticipants(order),
    ...orderStaffParticipants(order)
  ].filter(Boolean).map(normalize);
  const actorKeys = chatActorKeys(db, user);
  if (!actorKeys.some((key) => allowed.includes(key)) && user.role !== "admin") {
    return { ok: false, message: "无权查看" };
  }
  return { ok: true, order };
}

function orderChatIsReadOnly(order) {
  return ["completed", "cancelled", "refunded", "closed", "settled"].includes(String(order?.status || "").toLowerCase());
}

function pruneChatTyping(db) {
  const cutoff = Date.now() - 10000;
  Object.entries(db.chatTyping || {}).forEach(([orderId, entries]) => {
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
      delete db.chatTyping[orderId];
      return;
    }
    Object.entries(entries).forEach(([username, entry]) => {
      const updatedAt = Date.parse(entry?.updatedAt || "");
      if (!Number.isFinite(updatedAt) || updatedAt < cutoff) {
        delete entries[username];
      }
    });
    if (!Object.keys(entries).length) {
      delete db.chatTyping[orderId];
    }
  });
}

function addChatMessage(db, orderId, message, actor = "SYSTEM") {
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) {
    return { ok: false, message: "订单不存在" };
  }
  const contentType = normalizeChatContentType(message.type, message);
  const messageType = normalizeChatMessageType({ ...message, type: contentType });
  const sender = message.sender || actor;
  const createdAt = message.createdAt || nowIso();
  const metadata = message.metadata && typeof message.metadata === "object" && !Array.isArray(message.metadata) ? { ...message.metadata } : {};
  const catalogKey = normalizeChatCatalogKey({ ...message, metadata });
  const messageKey = chatCanonicalMessageKey(catalogKey);
  const messageParams = chatMessageParamsFrom({ ...message, metadata });
  const senderId = String(message.senderId || message.sender_id || metadata.senderId || metadata.sender_id || "").trim();
  const senderRole = normalizeChatSenderRole(message.role || message.senderRole || message.sender_role || metadata.senderRole || metadata.sender_role);
  const actionStatus = chatActionStatus({ ...message, metadata }, catalogKey);
  if (messageKey) {
    metadata.catalogKey = catalogKey;
    metadata.catalog_key = catalogKey;
    metadata.messageKey = messageKey;
    metadata.message_key = messageKey;
    metadata.messageParams = messageParams;
    metadata.message_params = messageParams;
  }
  // Keep identity and action state together with the message for local and realtime paths.
  metadata.senderId = senderId;
  metadata.sender_id = senderId;
  metadata.senderRole = senderRole;
  metadata.sender_role = senderRole;
  if (actionStatus) {
    metadata.actionStatus = actionStatus;
    metadata.action_status = actionStatus;
  }
  const next = {
    id: message.id || createId("msg"),
    orderId,
    sender,
    senderId,
    sender_id: senderId,
    role: senderRole,
    senderRole,
    sender_role: senderRole,
    type: contentType,
    messageType,
    message_type: messageType,
    text: String(chatTextForKey(messageKey, messageParams) || message.text || "").slice(0, 5000),
    imageData: message.imageData || "",
    imageUrl: message.imageUrl || "",
    catalogKey,
    catalog_key: catalogKey,
    messageKey,
    message_key: messageKey,
    messageParams,
    message_params: messageParams,
    actionStatus,
    action_status: actionStatus,
    metadata,
    readBy: [sender],
    readAt: { [sender]: createdAt },
    createdAt
  };
  db.orderChats[orderId] = [...(db.orderChats[orderId] || []), next];
  addChatMailboxNotifications(db, order, next);
  return { ok: true, message: next };
}

function createOrderOnBackend(db, payload, actor) {
  if (PointsSystemPaused) {
    return pointsSystemPausedResponse("订单和积分使用功能暂未开放。");
  }
  const profile = profileByUsername(db, actor.username);
  if (!profile || profile.deleted || isBanned(profile)) {
    return { ok: false, reason: "profile-unavailable", message: "账户不可用" };
  }
  const price = Math.max(0, Number(payload.price || 0));
  if ((Number(profile.funds) || 0) < price) {
    return { ok: false, reason: "insufficient", balance: Number(profile.funds) || 0, required: price, message: "余额不足，请先充值。" };
  }
  const order = {
    id: createId("order"),
    status: "pending",
    createdAt: nowIso(),
    completedAt: "",
    handledBy: "",
    acceptedAt: "",
    autoCancelMinutes: Number(payload.autoCancelMinutes || 0),
    autoCancelAt: payload.autoCancelAt || "",
    refundedAt: "",
    refundReason: "",
    returnRefundedAt: "",
    returnRefundAmount: 0,
    rush: null,
    reports: [],
    settledAt: "",
    settlement: null,
    ...payload,
    customerUsername: actor.username,
    contact: String(payload.contact || "").trim(),
    price
  };
  db.orders = [order, ...db.orders];
  const deduction = addLedger(db, profile, -price, `${order.type === "reservation" ? "预约" : "订单"}消费`, {
    type: "consume",
    amountMoney: price,
    orderId: order.id,
    itemName: order.productTitle
  }, actor.username);
  if (!deduction.ok) {
    db.orders = db.orders.filter((item) => item.id !== order.id);
    return { ok: false, reason: deduction.reason, balance: deduction.before, required: price, message: "余额不足，请先充值。" };
  }
  log(db, "创建订单", `${actor.username} 提交 ${order.productTitle}`, actor.username);
  return { ok: true, order };
}

function notificationEmailForUsername(db, username) {
  const user = findUser(db, username);
  const profile = profileByUsername(db, username);
  return normalizeEmail(profile?.notificationEmail || userEmail(user));
}

function emailNoticeEnabled(db, username, key) {
  const profile = profileByUsername(db, username);
  return !profile || profile.emailNotices?.[key] !== false;
}

function mailboxNoticeBody(profile, noticeKey, context = {}) {
  return [
    `Hello ${profile?.username || "there"},`,
    context.orderId ? `Order ID: ${context.orderId}.` : "",
    context.itemName ? `Item: ${context.itemName}.` : "",
    context.amount ? `Amount: ${context.amount}.` : "",
    `此通知也会保存在你的${BrandName}系统记录中，发送后无法撤回。`
  ].filter(Boolean).join(" ");
}

function addMailboxMessage(db, username, payload = {}) {
  const recipient = findUser(db, username);
  const recipientUsername = recipient?.username || username;
  const key = normalize(recipientUsername);
  if (!key) {
    return null;
  }
  const body = String(payload.body || payload.preview || "").trim();
  const category = mailboxCategoryId(payload.category);
  const createdAt = payload.createdAt || nowIso();
  const entry = {
    id: payload.id || createId("mail"),
    recipientUsername,
    category,
    subject: String(payload.subject || "System Notice").trim(),
    preview: String(payload.preview || body.slice(0, 120) || "System Notice").trim(),
    body,
    sender: String(payload.sender || SystemSenderName).trim(),
    source: String(payload.source || "system").trim(),
    sourceId: String(payload.sourceId || "").trim(),
    orderId: String(payload.orderId || "").trim(),
    favoritedAt: payload.favoritedAt || "",
    expiresDays: payload.expiresDays || "",
    expiresAt: payload.expiresAt || mailboxExpiresAt(category, createdAt, payload.expiresDays),
    claim: payload.claim && typeof payload.claim === "object" && !Array.isArray(payload.claim) ? { ...payload.claim } : null,
    readAt: payload.readAt || "",
    createdAt
  };
  const list = Array.isArray(db.mailboxMessages[key]) ? db.mailboxMessages[key] : [];
  db.mailboxMessages[key] = [entry, ...list.filter((item) => !item || typeof item !== "object" || item.id !== entry.id)];
  pruneMailboxMessages(db, recipientUsername);
  return entry;
}

function addNoticeMailboxMessage(db, username, noticeKey, context = {}) {
  const profile = profileByUsername(db, username);
  if (!profile || profile.deleted) {
    return null;
  }
  const subject = EmailNoticeSubjects[noticeKey];
  if (!subject) {
    return null;
  }
  return addMailboxMessage(db, profile.username, {
    category: MailboxNoticeCategories[noticeKey] || "system",
    subject,
    preview: [context.itemName, context.amount, context.orderId].filter(Boolean).join(" / ") || subject,
    body: mailboxNoticeBody(profile, noticeKey, context),
    sender: SystemSenderName,
    source: "notice",
    sourceId: noticeKey,
    orderId: context.orderId || ""
  });
}

function chatMailboxBody(order, message) {
  const quickText = chatTextForKey(normalizeChatMessageKey(message), chatMessageParamsFrom(message));
  const content = quickText || (message.text
    ? message.text
    : (message.imageData || message.imageUrl)
      ? "[Image attachment]"
      : "[No text content]");
  return [
    `Order ID: ${order?.id || "unknown"}.`,
    `From: ${message.sender || "SYSTEM"}.`,
    `Message: ${content}`
  ].join(" ");
}

function chatMailboxRecipients(order, message) {
  if (!order) {
    return [];
  }
  const participants = [
    order.customerUsername,
    order.handledBy,
    order.assignedVectorId,
    order.assigned_vector_id,
    order.assignedVectorName,
    order.vectorUsername,
    order.staffUsername
  ].filter(Boolean).filter((name, index, list) => list.findIndex((item) => normalize(item) === normalize(name)) === index);
  if (!participants.length) {
    return [];
  }
  if (message.sender === "SYSTEM" || message.role === "system" || message.type === "system" || normalizeChatMessageType(message) === "system") {
    return participants;
  }
  const senderKey = normalize(message.sender);
  return participants.filter((name) => normalize(name) !== senderKey);
}

function addChatMailboxNotifications(db, order, message) {
  chatMailboxRecipients(order, message).forEach((username) => {
    const systemLike = message.sender === "SYSTEM" || message.type === "system" || normalizeChatMessageType(message) === "system";
    const previewText = chatTextForKey(normalizeChatMessageKey(message), chatMessageParamsFrom(message))
      || message.text
      || ((message.imageData || message.imageUrl) ? "[Image attachment]" : "Order Chat Update");
    addMailboxMessage(db, username, {
      category: "chat",
      subject: systemLike ? "Order Chat Update" : "New Chat Message",
      preview: previewText,
      body: chatMailboxBody(order, message),
      sender: message.sender || "SYSTEM",
      source: "chat",
      sourceId: message.id,
      orderId: order?.id || ""
    });
  });
}

async function notifyOrderCreated(db, order) {
  // AI: notification opt-outs live on profile.emailNotices; all user-facing mail content stays English.
  addNoticeMailboxMessage(db, order.customerUsername, "orderSuccess", {
    orderId: order.id,
    itemName: order.productTitle,
    amount: `${order.price} points`
  });
  const to = notificationEmailForUsername(db, order.customerUsername);
  if (!isEmail(to) || !emailNoticeEnabled(db, order.customerUsername, "orderSuccess")) {
    return null;
  }
  return sendTrackedEmail(db, EmailTypes.ORDER_CREATED, {
    to,
    orderId: order.id,
    orderName: order.productTitle,
    amount: order.price
  });
}

async function notifyOrderCompleted(db, order) {
  addNoticeMailboxMessage(db, order.customerUsername, "completionSuccess", {
    orderId: order.id,
    itemName: order.productTitle,
    amount: `${order.price} points`
  });
  const to = notificationEmailForUsername(db, order.customerUsername);
  if (!isEmail(to) || !emailNoticeEnabled(db, order.customerUsername, "completionSuccess")) {
    return null;
  }
  return sendTrackedEmail(db, EmailTypes.ORDER_COMPLETED, {
    to,
    orderId: order.id,
    orderName: order.productTitle,
    completedAt: order.completedAt || nowIso()
  });
}

function orderStatusWouldWritePoints(order, status) {
  if (!order || !status || Number(order.price || 0) <= 0) {
    return false;
  }
  if (status === "completed") {
    return order.status === "processing" && Boolean(order.handledBy) && !order.settlement;
  }
  if (status === "cancelled") {
    return ["pending", "processing"].includes(order.status) && !order.refundedAt;
  }
  return false;
}

function updateOrderStatusOnBackend(db, orderId, status, actor) {
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) {
    return { ok: false, message: "订单不存在" };
  }
  const role = actor.role || "customer";
  if (!["staff", "admin"].includes(role) && !(status === "cancelled" && order.customerUsername === actor.username && order.status === "pending")) {
    return { ok: false, message: "无权操作订单。" };
  }
  if (PointsSystemPaused && orderStatusWouldWritePoints(order, status)) {
    return pointsSystemPausedResponse("订单资金结算功能暂未开放。");
  }
  const updatedAt = nowIso();
  const actorProfile = profileByUsername(db, actor.username);
  if (actorProfile) {
    actorProfile.lastOnlineAt = updatedAt;
  }
  if (status === "processing") {
    if (order.status !== "pending") {
      return { ok: false, message: "该订单已不在待处理状态。" };
    }
    order.status = "processing";
    order.handledBy = order.handledBy || actor.username;
    order.acceptedAt = order.acceptedAt || updatedAt;
    // Chat is paused across the user boundary: accepting the order may proceed, but must not create new chat records or claim chat is available.
    if (!vectorSupportChatPaused()) {
      addChatMessage(db, order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: `${order.handledBy} accepted the order.`
      });
    }
    addNoticeMailboxMessage(db, order.customerUsername, "orderAccepted", {
      orderId: order.id,
      itemName: order.productTitle,
      amount: `Accepted by ${order.handledBy}`
    });
  } else if (status === "completed") {
    if (order.status !== "processing" || !order.handledBy) {
      return { ok: false, message: "订单需要先由员工接单。" };
    }
    order.status = "completed";
    order.completedAt = order.completedAt || updatedAt;
    order.settledAt = order.settledAt || updatedAt;
    const staff = profileByUsername(db, order.handledBy);
    if (staff && !order.settlement) {
      const payout = Number(order.price || 0);
      addLedger(db, staff, payout, "订单结算收入", {
        type: "settlement",
        amountMoney: payout,
        orderId: order.id,
        itemName: order.productTitle
      }, actor.username);
      order.settlement = { staffPayout: payout, customerRefund: 0, note: "正常结算", settledAt: updatedAt };
    }
  } else if (status === "cancelled") {
    if (!["pending", "processing"].includes(order.status)) {
      return { ok: false, message: "该订单无法取消。" };
    }
    order.status = "cancelled";
    order.completedAt = order.completedAt || updatedAt;
    if (!order.refundedAt && Number(order.price || 0) > 0) {
      const customer = profileByUsername(db, order.customerUsername);
      if (customer) {
        addLedger(db, customer, Number(order.price || 0), "订单取消退款", {
          type: "refund",
          amountMoney: Number(order.price || 0),
          orderId: order.id,
          itemName: order.productTitle
        }, actor.username);
        order.refundedAt = updatedAt;
        order.refundReason = "订单取消退款";
        addNoticeMailboxMessage(db, order.customerUsername, "returnSuccess", {
          orderId: order.id,
          itemName: order.productTitle,
          amount: `${Number(order.price || 0)} points`
        });
      }
    }
  } else {
    order.status = status;
  }
  order.updatedAt = updatedAt;
  log(db, "更新订单", `${orderId} -> ${status}`, actor.username);
  return { ok: true, order };
}

function requireAdmin(user) {
  return user && user.role === "admin" ? { ok: true } : { ok: false, status: 403, message: "需要管理员权限。" };
}

function shanghaiAfterDailyStop(now = squadNow()) {
  const parts = utc8Parts(now);
  return parts.hour >= 2;
}

function ensureSquadRoutingState(db) {
  db.squadRouting = normalizeSquadRoutingState(db.squadRouting);
  return db.squadRouting;
}

function applySquadDailyStop(db, actor = "SYSTEM", now = squadNow()) {
  const routing = ensureSquadRoutingState(db);
  const dayKey = utc8DayKey(now);
  if (!shanghaiAfterDailyStop(now) || routing.lastDailyStopDate === dayKey) {
    return { changed: false, routing };
  }
  const stoppedAt = now.toISOString();
  let offlineCount = 0;
  db.squads = db.squads.map((squad) => {
    if (squad.status !== "online") {
      return squad;
    }
    offlineCount += 1;
    return {
      ...squad,
      status: "offline",
      lastStatusChangedAt: stoppedAt,
      updatedAt: stoppedAt,
      updatedBy: actor
    };
  });
  db.squadRouting = {
    ...routing,
    orderingPaused: true,
    pausedReason: "daily-stop-02:00",
    pausedAt: stoppedAt,
    lastDailyStopDate: dayKey,
    restoredAt: "",
    restoredBy: ""
  };
  log(db, "小队每日停单", `${dayKey} 02:00 后停单，${offlineCount} 个 online 小队已转 offline`, actor);
  return { changed: true, routing: db.squadRouting, offlineCount };
}

function validateSquadInput(payload = {}, existing = null) {
  const name = String(payload.name ?? existing?.name ?? "").trim();
  const members = [
    payload.member1,
    payload.member2,
    payload.member3
  ].some((item) => item !== undefined)
    ? [payload.member1, payload.member2, payload.member3].map((item) => String(item || "").trim())
    : normalizeStringList(payload.members ?? existing?.members, 3);
  while (members.length < 3) {
    members.push("");
  }
  const groupType = payload.groupType === "wechat" ? "wechat" : "qq";
  const groupNumber = String(payload.groupNumber ?? existing?.groupNumber ?? "").trim();
  if (!name) {
    return { ok: false, message: "请填写小队名称。" };
  }
  if (members.length !== 3 || members.some((member) => !member)) {
    return { ok: false, message: "请填写三名小队成员，第一名为队长。" };
  }
  if (!SquadGroupNumberPattern.test(groupNumber)) {
    return { ok: false, message: "群号必须为数字。" };
  }
  return {
    ok: true,
    squad: {
      id: String(payload.id || existing?.id || createId("squad")),
      name,
      members,
      captain: members[0],
      groupType,
      groupNumber,
      businessProjects: normalizeStringList(payload.businessProjects ?? existing?.businessProjects, 200),
      supportedItemIds: normalizeStringList(payload.supportedItemIds ?? existing?.supportedItemIds, 200),
      activeTime: String(payload.activeTime ?? existing?.activeTime ?? "").trim(),
      activationEnabled: booleanValue(payload.activationEnabled),
      currentOrderId: String(existing?.currentOrderId || ""),
      lastAssignedAt: String(existing?.lastAssignedAt || ""),
      createdAt: String(existing?.createdAt || nowIso()),
      createdBy: String(existing?.createdBy || "")
    }
  };
}

function squadStatusFor(squad, routing) {
  if (squad.currentOrderId) {
    return "working";
  }
  return squad.activationEnabled && !routing.orderingPaused ? "online" : "offline";
}

function saveSquadOnBackend(db, payload = {}, actor) {
  const existing = payload.id ? db.squads.find((squad) => squad.id === payload.id) : null;
  const validated = validateSquadInput(payload, existing);
  if (!validated.ok) {
    return validated;
  }
  const now = nowIso();
  const routing = ensureSquadRoutingState(db);
  const next = normalizeSquadRecord({
    ...existing,
    ...validated.squad,
    status: squadStatusFor(validated.squad, routing),
    lastStatusChangedAt: existing?.status === squadStatusFor(validated.squad, routing)
      ? existing?.lastStatusChangedAt
      : now,
    updatedAt: now,
    updatedBy: actor.username,
    createdBy: validated.squad.createdBy || actor.username
  });
  db.squads = existing
    ? db.squads.map((squad) => (squad.id === next.id ? next : squad))
    : [next, ...db.squads];
  log(db, existing ? "更新小队" : "新增小队", `${next.name} / ${next.groupType} ${next.groupNumber} / ${next.status}`, actor.username);
  return { ok: true, squad: next };
}

function toggleSquadOnBackend(db, squadId, activationEnabled, actor) {
  const squad = db.squads.find((item) => item.id === squadId);
  if (!squad) {
    return { ok: false, message: "小队不存在。" };
  }
  const now = nowIso();
  const routing = ensureSquadRoutingState(db);
  const enabled = booleanValue(activationEnabled);
  const next = normalizeSquadRecord({
    ...squad,
    activationEnabled: enabled,
    status: squadStatusFor({ ...squad, activationEnabled: enabled }, routing),
    lastStatusChangedAt: now,
    updatedAt: now,
    updatedBy: actor.username
  });
  db.squads = db.squads.map((item) => (item.id === next.id ? next : item));
  log(db, "切换小队状态", `${next.name} -> ${next.status}`, actor.username);
  return { ok: true, squad: next };
}

function restoreSquadOrderingOnBackend(db, actor) {
  const now = nowIso();
  db.squadRouting = {
    ...ensureSquadRoutingState(db),
    orderingPaused: false,
    pausedReason: "",
    restoredAt: now,
    restoredBy: actor.username
  };
  let onlineCount = 0;
  db.squads = db.squads.map((squad) => {
    if (squad.currentOrderId) {
      return normalizeSquadRecord({ ...squad, status: "working", updatedAt: now, updatedBy: actor.username });
    }
    const status = squad.activationEnabled ? "online" : "offline";
    if (status === "online") {
      onlineCount += 1;
    }
    return normalizeSquadRecord({
      ...squad,
      status,
      lastStatusChangedAt: now,
      updatedAt: now,
      updatedBy: actor.username
    });
  });
  log(db, "恢复小队下单", `管理员手动恢复，${onlineCount} 个激活小队 online`, actor.username);
  return { ok: true, routing: db.squadRouting, squads: db.squads };
}

function allProductsWithMeta(db) {
  const items = [];
  Object.entries(db.products || {}).forEach(([gameId, products]) => {
    (Array.isArray(products) ? products : []).forEach((product) => {
      items.push({ product, gameId });
    });
  });
  return items;
}

function findProductInDb(db, productId) {
  for (const [gameId, products] of Object.entries(db.products || {})) {
    const product = (Array.isArray(products) ? products : []).find((item) => item.id === productId);
    if (product) {
      let game = null;
      let category = null;
      for (const item of db.categories || []) {
        const foundGame = (db.games[item.id] || []).find((candidate) => candidate.id === gameId);
        if (foundGame) {
          game = foundGame;
          category = item;
          break;
        }
      }
      return { product, gameId, game, category };
    }
  }
  return null;
}

function productEligibleSquadIds(product = {}) {
  return normalizeStringList(product.eligibleSquadIds || product.availableSquadIds || product.supportedSquadIds, 200);
}

function saveProductSquadsOnBackend(db, payload = {}, actor) {
  const productId = String(payload.productId || "").trim();
  const found = findProductInDb(db, productId);
  if (!found) {
    return { ok: false, status: 404, message: "商品不存在。" };
  }
  const requestedIds = normalizeStringList(payload.eligibleSquadIds || payload.squadIds, 200);
  const validIds = new Set(db.squads.map((squad) => squad.id));
  const invalidIds = requestedIds.filter((id) => !validIds.has(id));
  if (invalidIds.length) {
    return { ok: false, message: `小队不存在：${invalidIds.join(", ")}` };
  }
  const now = nowIso();
  const nextProduct = {
    ...found.product,
    eligibleSquadIds: requestedIds,
    updatedAt: now,
    updatedBy: actor.username
  };
  db.products[found.gameId] = (db.products[found.gameId] || []).map((product) => (
    product.id === productId ? nextProduct : product
  ));
  log(db, "绑定商品可接单小队", `${productId} -> ${requestedIds.join(", ") || "none"}`, actor.username);
  return { ok: true, product: nextProduct, products: db.products };
}

function saveCatalogItemOnBackend(db, payload = {}, actor) {
  const type = String(payload.type || "").trim();
  const item = payload.item && typeof payload.item === "object" && !Array.isArray(payload.item) ? payload.item : null;
  const categoryId = String(payload.categoryId || "").trim();
  const gameId = String(payload.gameId || "").trim();
  if (!item || !item.id || !["category", "game", "product"].includes(type)) {
    return { ok: false, status: 400, message: "保存参数无效。" };
  }
  const now = nowIso();
  const nextItem = {
    ...item,
    updatedAt: now,
    updatedBy: actor.username
  };
  if (type === "category") {
    const exists = db.categories.some((category) => category.id === nextItem.id);
    db.categories = exists
      ? db.categories.map((category) => (category.id === nextItem.id ? nextItem : category))
      : [...db.categories, { ...nextItem, createdAt: nextItem.createdAt || now, createdBy: nextItem.createdBy || actor.username }];
    db.games[nextItem.id] = Array.isArray(db.games[nextItem.id]) ? db.games[nextItem.id] : [];
    log(db, exists ? "编辑分类" : "新增分类", `${nextItem.title || nextItem.id}`, actor.username);
    return { ok: true, item: nextItem };
  }
  if (type === "game") {
    if (!categoryId || !db.categories.some((category) => category.id === categoryId)) {
      return { ok: false, status: 404, message: "分类不存在。" };
    }
    const list = Array.isArray(db.games[categoryId]) ? db.games[categoryId] : [];
    const exists = list.some((game) => game.id === nextItem.id);
    db.games[categoryId] = exists
      ? list.map((game) => (game.id === nextItem.id ? nextItem : game))
      : [...list, { ...nextItem, createdAt: nextItem.createdAt || now, createdBy: nextItem.createdBy || actor.username }];
    db.products[nextItem.id] = Array.isArray(db.products[nextItem.id]) ? db.products[nextItem.id] : [];
    log(db, exists ? "编辑游戏分区" : "新增游戏分区", `${nextItem.title || nextItem.id} / ${categoryId}`, actor.username);
    return { ok: true, item: nextItem };
  }
  if (!gameId) {
    return { ok: false, status: 400, message: "缺少分区参数。" };
  }
  const gameExists = Object.values(db.games || {}).some((list) => (
    Array.isArray(list) && list.some((game) => game.id === gameId)
  ));
  if (!gameExists) {
    return { ok: false, status: 404, message: "游戏分区不存在。" };
  }
  const list = Array.isArray(db.products[gameId]) ? db.products[gameId] : [];
  const exists = list.some((product) => product.id === nextItem.id);
  db.products[gameId] = exists
    ? list.map((product) => (product.id === nextItem.id ? nextItem : product))
    : [...list, { ...nextItem, createdAt: nextItem.createdAt || now, createdBy: nextItem.createdBy || actor.username }];
  log(db, exists ? "编辑商品" : "新增商品", `${nextItem.title || nextItem.id} / ${gameId}`, actor.username);
  return { ok: true, item: nextItem };
}

function deleteCatalogItemOnBackend(db, payload = {}, actor) {
  const type = String(payload.type || "").trim();
  const id = String(payload.id || "").trim();
  const categoryId = String(payload.categoryId || "").trim();
  const gameId = String(payload.gameId || "").trim();
  if (!id || !["category", "game", "product"].includes(type)) {
    return { ok: false, status: 400, message: "删除参数无效。" };
  }
  if (type === "category") {
    const category = db.categories.find((item) => item.id === id);
    if (!category) {
      return { ok: false, status: 404, message: "分类不存在。" };
    }
    const removedGames = Array.isArray(db.games[id]) ? db.games[id] : [];
    removedGames.forEach((game) => {
      delete db.products[game.id];
    });
    delete db.games[id];
    db.categories = db.categories.filter((item) => item.id !== id);
    log(db, "删除分类", `${category.title || id} / 分区 ${removedGames.length} 个`, actor.username);
    return { ok: true };
  }
  if (type === "game") {
    if (!categoryId) {
      return { ok: false, status: 400, message: "缺少分类参数。" };
    }
    const list = Array.isArray(db.games[categoryId]) ? db.games[categoryId] : [];
    const game = list.find((item) => item.id === id);
    if (!game) {
      return { ok: false, status: 404, message: "游戏分区不存在。" };
    }
    db.games[categoryId] = list.filter((item) => item.id !== id);
    delete db.products[id];
    log(db, "删除游戏分区", `${game.title || id} / ${categoryId}`, actor.username);
    return { ok: true };
  }
  if (!gameId) {
    return { ok: false, status: 400, message: "缺少分区参数。" };
  }
  const list = Array.isArray(db.products[gameId]) ? db.products[gameId] : [];
  const product = list.find((item) => item.id === id);
  if (!product) {
    return { ok: false, status: 404, message: "商品不存在。" };
  }
  db.products[gameId] = list.filter((item) => item.id !== id);
  log(db, "删除商品", `${product.title || id} / ${gameId}`, actor.username);
  return { ok: true };
}

function eligibleSquadIdsForProduct(db, product = {}) {
  return productEligibleSquadIds(product);
}

function selectEligibleSquad(db, product = {}) {
  const ids = new Set(eligibleSquadIdsForProduct(db, product));
  if (!ids.size) {
    return null;
  }
  return db.squads
    .filter((squad) => ids.has(squad.id) && squad.activationEnabled && squad.status === "online" && !squad.currentOrderId)
    .sort((a, b) => (
      timestampMs(a.lastAssignedAt) - timestampMs(b.lastAssignedAt)
      || timestampMs(a.createdAt) - timestampMs(b.createdAt)
      || a.name.localeCompare(b.name)
    ))[0] || null;
}

function routedOrderEmailPayload(db, order, squad, kind = "initial") {
  const to = notificationEmailForUsername(db, order.customerUsername);
  const groupLabel = squad.groupType === "wechat" ? "微信群" : "QQ群";
  const message = [
    `你的${BrandName}订单已由外部服务小队接单。`,
    `订单号：${order.id}`,
    `服务项目：${order.productTitle}`,
    `接单小队：${squad.name}`,
    `${groupLabel}号：${squad.groupNumber}`,
    "请截图本邮件，并在入群后发送到群中。"
  ].join("\n");
  return {
    to,
    subject: kind === "resend" ? `${BrandName}接单小队信息已重发` : `${BrandName}接单小队已分配`,
    message,
    rows: [
      { label: "订单号", value: order.id },
      { label: "服务项目", value: order.productTitle || "" },
      { label: "接单小队", value: squad.name },
      { label: "群类型", value: groupLabel },
      { label: "群号", value: squad.groupNumber },
      { label: "入群说明", value: "请截图本邮件并发送到群中。" }
    ]
  };
}

function recordSquadRoutingTestEmailCall(order, squad, kind, payload, testMode) {
  if (isProductionRuntime() || !testMode) {
    return;
  }
  if (!Array.isArray(globalThis.__IMPULSE_SQUAD_TEST_EMAILS)) {
    globalThis.__IMPULSE_SQUAD_TEST_EMAILS = [];
  }
  globalThis.__IMPULSE_SQUAD_TEST_EMAILS.push({
    orderId: order?.id || "",
    squadId: squad?.id || "",
    kind,
    mode: testMode,
    recipientHash: privacyHash("email", normalizeEmail(payload?.to || "")),
    subject: payload?.subject || "",
    createdAt: nowIso()
  });
}

async function sendSquadRoutingEmail(db, order, squad, kind = "initial") {
  const payload = routedOrderEmailPayload(db, order, squad, kind);
  const testMode = !isProductionRuntime() ? String(process.env.IMPULSE_SQUAD_EMAIL_TEST_MODE || "").toLowerCase() : "";
  recordSquadRoutingTestEmailCall(order, squad, kind, payload, testMode);
  if (!isEmail(payload.to)) {
    const result = { ok: false, configured: true, provider: "internal", subject: payload.subject, error: "Customer registered email is missing." };
    recordEmailLog(db, "squad_routing_assignment", payload.to, payload.subject, result);
    return result;
  }
  if (!isProductionRuntime() && process.env.IMPULSE_SQUAD_EMAIL_THROW_IF_CALLED === "1") {
    throw new Error("Squad routing email should not be called before durable persistence.");
  }
  if (testMode === "success" || testMode === "fail") {
    const result = testMode === "success"
      ? { ok: true, configured: true, provider: "test", id: createId("test-mail"), subject: payload.subject }
      : { ok: false, configured: true, provider: "test", subject: payload.subject, error: "Forced squad email failure." };
    recordEmailLog(db, "squad_routing_assignment", payload.to, payload.subject, result);
    return result;
  }
  return sendTrackedEmail(db, EmailTypes.ADMIN_ALERT, payload);
}

function appendSquadEmailAttempt(order, result, kind, actor) {
  const nowDate = squadNow();
  const now = nowDate.toISOString();
  const attempt = {
    id: createId("squad-mail"),
    kind,
    status: result.ok ? "sent" : "failed",
    provider: result.provider || "",
    providerMessageId: result.id || "",
    error: result.error || "",
    requestedBy: actor,
    createdAt: now
  };
  order.squadEmailAttempts = [attempt, ...(Array.isArray(order.squadEmailAttempts) ? order.squadEmailAttempts : [])].slice(0, 20);
  order.squadEmailStatus = result.ok ? "sent" : "failed";
  order.squadEmailFailure = result.ok ? "" : (result.error || "Email failed.");
  if (result.ok) {
    order.squadLastEmailAt = now;
    order.squadNextEmailAt = new Date(nowDate.getTime() + SquadRoutingEmailCooldownMs).toISOString();
  }
  return attempt;
}

function releaseSquadForOrder(db, order, actor, status = "online") {
  const squad = db.squads.find((item) => item.id === order.assignedSquadId);
  if (!squad) {
    return null;
  }
  const now = nowIso();
  const next = normalizeSquadRecord({
    ...squad,
    currentOrderId: "",
    status,
    activationEnabled: status === "online" ? true : squad.activationEnabled,
    lastStatusChangedAt: now,
    updatedAt: now,
    updatedBy: actor
  });
  db.squads = db.squads.map((item) => (item.id === next.id ? next : item));
  return next;
}

function cancelRoutedOrder(db, order, actor, reason) {
  const now = nowIso();
  order.status = "cancelled";
  order.cancelledAt = order.cancelledAt || now;
  order.completedAt = order.completedAt || now;
  order.squadRoutingStatus = "cancelled";
  order.cancelReason = reason;
  order.updatedAt = now;
  const squad = releaseSquadForOrder(db, order, actor, "online");
  log(db, "小队订单取消", `${order.id} ${reason}${squad ? ` / ${squad.name} 回到 online` : ""}`, actor);
  return { ok: true, order, squad };
}

function routedOrderResponse(db, order = null, extra = {}) {
  return { ok: true, order, squads: db.squads, squadRouting: db.squadRouting, snapshot: sanitizeSnapshot(db), ...extra };
}

function createRoutedOrderOnBackend(db, payload, actor) {
  const profile = profileByUsername(db, actor.username);
  if (!profile || profile.deleted || isBanned(profile)) {
    return { ok: false, reason: "profile-unavailable", message: "账户不可用" };
  }
  const found = findProductInDb(db, payload.productId);
  if (!found) {
    return { ok: false, reason: "product-missing", message: "商品不存在。" };
  }
  const routing = ensureSquadRoutingState(db);
  if (routing.orderingPaused) {
    return { ok: false, reason: "ordering-paused", message: "小队下单已暂停，请等待管理员恢复。" };
  }
  const squad = selectEligibleSquad(db, found.product);
  if (!squad) {
    return { ok: false, reason: "no-online-squad", message: "暂无空闲小队" };
  }
  const assignedAt = nowIso();
  const order = {
    id: createId("order"),
    type: payload.type === "reservation" ? "reservation" : "order",
    status: "processing",
    createdAt: assignedAt,
    updatedAt: assignedAt,
    completedAt: "",
    handledBy: "",
    acceptedAt: assignedAt,
    autoCancelMinutes: 0,
    autoCancelAt: "",
    refundedAt: "",
    refundReason: "",
    returnRefundedAt: "",
    returnRefundAmount: 0,
    rush: null,
    reports: [],
    settledAt: "",
    settlement: null,
    categoryId: found.category?.id || "",
    categoryTitle: found.category?.title || "",
    categoryTitleI18n: found.category?.titleI18n || {},
    gameId: found.game?.id || found.gameId || "",
    gameTitle: found.game?.title || "",
    gameTitleI18n: found.game?.titleI18n || {},
    productId: found.product.id,
    productTitle: found.product.title || "",
    productTitleI18n: found.product.titleI18n || {},
    price: Number(found.product.price || 0),
    customerUsername: actor.username,
    contact: "",
    appointmentAt: payload.appointmentAt || "",
    note: String(payload.note || "").trim(),
    assignedSquadId: squad.id,
    assignedSquadNameSnapshot: squad.name,
    groupTypeSnapshot: squad.groupType,
    groupNumberSnapshot: squad.groupNumber,
    assignedAt,
    squadRoutingStatus: "assigned",
    squadEmailAttempts: [],
    squadResendCount: 0,
    squadLastEmailAt: "",
    squadNextEmailAt: "",
    squadEmailStatus: "pending",
    squadEmailFailure: ""
  };
  db.orders = [order, ...db.orders];
  const previousSquad = clone(squad);
  const workingSquad = normalizeSquadRecord({
    ...squad,
    status: "working",
    currentOrderId: order.id,
    lastAssignedAt: assignedAt,
    lastStatusChangedAt: assignedAt,
    updatedAt: assignedAt,
    updatedBy: "SYSTEM"
  });
  db.squads = db.squads.map((item) => (item.id === squad.id ? workingSquad : item));
  log(db, "小队订单待发送邮件", `${order.id} -> ${workingSquad.name} (${workingSquad.groupType} ${workingSquad.groupNumber})`, actor.username);
  return { ok: true, order, squad: workingSquad, previousSquad };
}

async function resendSquadRoutingEmailOnBackend(db, orderId, actor) {
  const order = db.orders.find((item) => item.id === orderId);
  if (!order || order.customerUsername !== actor.username || !order.assignedSquadId) {
    return { ok: false, status: 404, message: "订单不存在。" };
  }
  if (["completed", "cancelled"].includes(order.status)) {
    return { ok: false, message: "该订单已关闭。" };
  }
  const resendCount = Number(order.squadResendCount || 0);
  if (resendCount >= SquadRoutingMaxResends) {
    const cancelled = cancelRoutedOrder(db, order, actor.username, "小队邮件重发次数超过限制");
    return { ...cancelled, forceLogout: true, message: "系统繁忙请重新登录" };
  }
  const lastSent = timestampMs(order.squadLastEmailAt);
  const nextAllowed = lastSent + SquadRoutingEmailCooldownMs;
  if (lastSent && squadNow().getTime() < nextAllowed) {
    return {
      ok: false,
      status: 429,
      reason: "cooldown",
      message: "请稍后再试。",
      nextAllowedAt: new Date(nextAllowed).toISOString()
    };
  }
  const squad = db.squads.find((item) => item.id === order.assignedSquadId);
  if (!squad) {
    return { ok: false, message: "小队不存在。" };
  }
  order.squadResendCount = resendCount + 1;
  const mail = await sendSquadRoutingEmail(db, order, {
    ...squad,
    name: order.assignedSquadNameSnapshot || squad.name,
    groupType: order.groupTypeSnapshot || squad.groupType,
    groupNumber: order.groupNumberSnapshot || squad.groupNumber
  }, "resend");
  appendSquadEmailAttempt(order, mail, "resend", actor.username);
  order.updatedAt = nowIso();
  log(db, mail.ok ? "重发小队邮件" : "重发小队邮件失败", `${order.id} 第 ${order.squadResendCount} 次 / ${mail.error || "sent"}`, actor.username);
  if (!mail.ok) {
    return { ok: false, message: "邮件发送失败，请稍后重试。", order };
  }
  return { ok: true, order };
}

function completeRoutedOrderOnBackend(db, orderId, actor) {
  const order = db.orders.find((item) => item.id === orderId);
  if (!order || order.customerUsername !== actor.username || !order.assignedSquadId) {
    return { ok: false, status: 404, message: "订单不存在。" };
  }
  if (order.status === "completed") {
    return { ok: true, order };
  }
  if (order.status === "cancelled") {
    return { ok: false, message: "该订单已取消。" };
  }
  const now = nowIso();
  order.status = "completed";
  order.completedAt = order.completedAt || now;
  order.settledAt = "";
  order.settlement = order.settlement || null;
  order.squadRoutingStatus = "completed";
  order.updatedAt = now;
  const squad = releaseSquadForOrder(db, order, actor.username, "online");
  log(db, "小队订单结单", `${order.id}${squad ? ` / ${squad.name} 回到 online` : ""}`, actor.username);
  return { ok: true, order, squad };
}

async function handleAction(action, payload = {}, request = {}) {
  if (action === "health") {
    const email = emailHealth();
    const backend = {
      storage: storageType(),
      database: { ok: true }
    };
    try {
      const healthDb = await readDb();
      const activeStorage = dbStorage(healthDb) || storageType();
      const primaryError = dbPrimaryStorageError(healthDb);
      backend.storage = activeStorage;
      backend.primaryStorage = storageType();
      backend.degraded = Boolean(primaryError);
      backend.primaryError = primaryError;
      if (primaryError) {
        backend.database = { ok: false, error: primaryError, fallback: activeStorage };
      }
    } catch (error) {
      backend.database = { ok: false, error: storageErrorCode(error) };
    }
    return { ok: true, storage: backend.storage, hasEmail: email.configured, email, backend };
  }

  if (action === "sendAdminMailbox" && AdminMailboxSendingDisabled) {
    if (!request.user || request.user.role !== "admin") {
      return { ok: false, message: "无权发送系统邮件。" };
    }
    return { ok: false, status: 423, message: AdminMailboxSendingDisabledMessage };
  }

  if (ChatPausedActions.has(action) && vectorSupportChatPaused()) {
    return vectorSupportChatPausedResponse();
  }

  let db;
  try {
    db = await readDb();
  } catch (error) {
    return storageUnavailableResponse(error);
  }
  const persistDurable = async () => {
    const persisted = await writeDurableDb(db);
    if (!persisted.ok) {
      return persisted.response;
    }
    db = persisted.db;
    return null;
  };
  if (!["setBackupEmail", "runRetentionCleanup"].includes(action)) {
    const retention = await applyRetentionPolicies(db);
    if (retention.changed) {
      const unavailable = await persistDurable();
      if (unavailable) {
        return unavailable;
      }
    }
  }

  if (action === "bootstrap") {
    if (payload.snapshot) {
      db = importSnapshot(db, payload.snapshot);
      await applyRetentionPolicies(db);
      log(db, "后端初始化", "从前端快照导入初始数据");
      const unavailable = await persistDurable();
      if (unavailable) {
        return unavailable;
      }
    }
    return { ok: true, snapshot: sanitizeSnapshot(db), backend: backendStorageInfo(db) };
  }

  if (action === "getMailbox") {
    if (!request.user) {
      return { ok: false, status: 401, message: "请先登录" };
    }
    return {
      ok: true,
      ...mailboxPayloadForUser(db, request.user.username),
      backend: backendStorageInfo(db)
    };
  }

  if (action === "saveSnapshot") {
    db = importSnapshot(db, payload.snapshot || {});
    await applyRetentionPolicies(db);
    log(db, "后端同步", payload.reason || "前端同步快照", request.user?.username || "CLIENT");
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, snapshot: sanitizeSnapshot(db), backend: backendStorageInfo(db) };
  }

  if (action === "uploadAsset") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    const uploaded = await uploadSupabaseAsset(payload || {}, request.user);
    if (!uploaded.ok) {
      return uploaded;
    }
    log(db, "上传资产", `${uploaded.bucket}/${uploaded.path}`, request.user.username);
    await writeDb(db);
    return uploaded;
  }

  if (action === "setBackupEmail") {
    if (!request.user || request.user.role !== "admin") {
      return { ok: false, message: "需要管理员权限。" };
    }
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    db.systemSettings.backupEmail = email;
    log(db, "设置备份邮箱", email, request.user.username);
    const nextRetention = await applyRetentionPolicies(db);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, retention: nextRetention, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "runRetentionCleanup") {
    if (!request.user || request.user.role !== "admin") {
      return { ok: false, message: "需要管理员权限。" };
    }
    const nextRetention = await applyRetentionPolicies(db);
    if (nextRetention.changed) {
      const unavailable = await persistDurable();
      if (unavailable) {
        return unavailable;
      }
    }
    return { ok: true, retention: nextRetention, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "listSquads") {
    const admin = requireAdmin(request.user);
    if (!admin.ok) {
      return admin;
    }
    const daily = applySquadDailyStop(db, request.user.username);
    if (daily.changed) {
      const unavailable = await persistDurable();
      if (unavailable) {
        return unavailable;
      }
    }
    return { ok: true, squads: db.squads, squadRouting: db.squadRouting, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "saveSquad") {
    const admin = requireAdmin(request.user);
    if (!admin.ok) {
      return admin;
    }
    applySquadDailyStop(db, request.user.username);
    const result = saveSquadOnBackend(db, payload.squad || payload, request.user);
    if (!result.ok) {
      return result;
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, squad: result.squad, squads: db.squads, squadRouting: db.squadRouting, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "toggleSquad") {
    const admin = requireAdmin(request.user);
    if (!admin.ok) {
      return admin;
    }
    applySquadDailyStop(db, request.user.username);
    const result = toggleSquadOnBackend(db, payload.squadId || payload.id, payload.activationEnabled, request.user);
    if (!result.ok) {
      return result;
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, squad: result.squad, squads: db.squads, squadRouting: db.squadRouting, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "restoreSquadOrdering") {
    const admin = requireAdmin(request.user);
    if (!admin.ok) {
      return admin;
    }
    applySquadDailyStop(db, request.user.username);
    const result = restoreSquadOrderingOnBackend(db, request.user);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ...result, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "saveProductSquads") {
    const admin = requireAdmin(request.user);
    if (!admin.ok) {
      return admin;
    }
    const result = saveProductSquadsOnBackend(db, payload || {}, request.user);
    if (!result.ok) {
      return result;
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, product: result.product, products: db.products, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "saveCatalogItem") {
    const admin = requireAdmin(request.user);
    if (!admin.ok) {
      return admin;
    }
    const result = saveCatalogItemOnBackend(db, payload || {}, request.user);
    if (!result.ok) {
      return result;
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, item: result.item, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "deleteCatalogItem") {
    const admin = requireAdmin(request.user);
    if (!admin.ok) {
      return admin;
    }
    const result = deleteCatalogItemOnBackend(db, payload || {}, request.user);
    if (!result.ok) {
      return result;
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "createRoutedOrder") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    const daily = applySquadDailyStop(db, request.user.username);
    if (daily.changed) {
      const unavailable = await persistDurable();
      if (unavailable) {
        return unavailable;
      }
    }
    const result = createRoutedOrderOnBackend(db, payload.order || payload, request.user);
    if (!result.ok) {
      return result;
    }
    const orderId = result.order.id;
    const squadId = result.squad.id;
    const previousSquad = result.previousSquad;
    let unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    const order = db.orders.find((item) => item.id === orderId);
    const squad = db.squads.find((item) => item.id === squadId);
    if (!order || !squad) {
      log(db, "小队订单持久化异常", `${orderId} / ${squadId}`, request.user.username);
      unavailable = await persistDurable();
      if (unavailable) {
        return unavailable;
      }
      return { ok: false, status: 500, reason: "routing-persist-mismatch", message: "系统繁忙，请稍后重试。" };
    }
    let mail;
    try {
      mail = await sendSquadRoutingEmail(db, order, squad, "initial");
    } catch (error) {
      mail = {
        ok: false,
        configured: true,
        provider: "internal",
        error: error?.message || "Email failed."
      };
    }
    appendSquadEmailAttempt(order, mail, "initial", request.user.username);
    order.updatedAt = nowIso();
    if (!mail.ok) {
      db.orders = db.orders.filter((item) => item.id !== orderId);
      db.squads = db.squads.map((item) => (item.id === previousSquad.id ? normalizeSquadRecord(previousSquad) : item));
      log(db, "小队邮件失败回滚", `${orderId} / ${squad.name} / ${mail.error || "email failed"}`, request.user.username);
      unavailable = await persistDurable();
      if (unavailable) {
        return unavailable;
      }
      return {
        ok: false,
        reason: "email-failed",
        message: "系统繁忙，请稍后重试。",
        email: { ok: false, error: mail.error || "" },
        snapshot: sanitizeSnapshot(db)
      };
    }
    log(db, "小队订单分配", `${order.id} -> ${squad.name} (${squad.groupType} ${squad.groupNumber})`, request.user.username);
    unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return routedOrderResponse(db, db.orders.find((item) => item.id === orderId), {
      squad: db.squads.find((item) => item.id === squadId)
    });
  }

  if (action === "resendSquadRoutingEmail") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    const result = await resendSquadRoutingEmailOnBackend(db, payload.orderId, request.user);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    if (!result.ok) {
      return { ...result, snapshot: sanitizeSnapshot(db) };
    }
    return routedOrderResponse(db, result.order, {
      squad: result.squad,
      forceLogout: result.forceLogout,
      message: result.message
    });
  }

  if (action === "completeRoutedOrder") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    applySquadDailyStop(db, request.user.username);
    const result = completeRoutedOrderOnBackend(db, payload.orderId, request.user);
    if (!result.ok) {
      return result;
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return routedOrderResponse(db, result.order, { squad: result.squad });
  }

  if (action === "sendVerification") {
    // AI: avoid email enumeration; invalid register/login targets return generic success without sending.
    const purpose = String(payload.purpose || "login");
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    db = hydrateTemporaryDb(db, payload.snapshot, "CLIENT");
    if (!canPersistVerificationState(db)) {
      return verificationStorageUnavailableResponse(db);
    }
    const hasUser = Boolean(findUserByEmail(db, email));
    const shouldSend = purpose === "register" ? !hasUser : hasUser;
    if (!shouldSend) {
      log(db, "验证码请求已忽略", `${purpose} / ${privacyHash("email", email).slice(0, 12)}`);
      db = await writeVerificationDb(db);
      return { ok: true, message: EmailPrivacyResponse, mail: { ok: false, skipped: true, configured: emailHealth().configured }, backend: backendStorageInfo(db) };
    }
    const limited = canRequestVerification(db, email, request);
    if (!limited.ok) {
      log(db, "验证码限流", `${purpose} / ${privacyHash("email", email).slice(0, 12)}`);
      db = await writeVerificationDb(db);
      return { ok: false, message: limited.message, backend: backendStorageInfo(db) };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storeVerification(db, purpose, email, code, request);
    db = await writeVerificationDb(db);
    const mail = await sendTrackedEmail(db, EmailTypes.AUTH_VERIFICATION_CODE, {
      to: email,
      code,
      purpose,
      expiresInMinutes: Math.floor(VerificationMaxAgeMs / 60000)
    });
    log(db, "验证码发送", `${privacyHash("email", email).slice(0, 12)} / ${purpose} / mail:${mail.ok ? "sent" : "failed"}`);
    if (!mail.ok) {
      // AI: failed delivery must not leave a usable auth code; callers get only the service error.
      delete db.verifications[verificationKey(purpose, email)];
      db = await writeVerificationDb(db);
      return { ok: false, message: "邮件服务暂不可用，请稍后重试。", mail: { ok: false, configured: mail.configured !== false }, backend: backendStorageInfo(db) };
    }
    try {
      db = await writeVerificationDb(db);
    } catch (error) {
      // The code was persisted before delivery; do not fail a sent code only because email audit logging could not be updated.
    }
    return { ok: true, message: EmailPrivacyResponse, mail, backend: backendStorageInfo(db) };
  }

  if (action === "verifyCode") {
    const purpose = String(payload.purpose || "login");
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    if (!canPersistVerificationState(db)) {
      return verificationStorageUnavailableResponse(db);
    }
    const verified = verifyCode(db, purpose, email, payload.code);
    if (!verified.ok) {
      return verified;
    }
    db = await writeVerificationDb(db);
    return { ok: true, backend: backendStorageInfo(db) };
  }

  if (action === "sendMagicLink") {
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    if (!canPersistVerificationState(db)) {
      return verificationStorageUnavailableResponse(db);
    }
    const user = findUserByEmail(db, email);
    if (!user) {
      log(db, "魔法链接请求已忽略", privacyHash("email", email).slice(0, 12));
      await writeVerificationDb(db);
      return { ok: true, message: EmailPrivacyResponse };
    }
    const limited = canRequestVerification(db, email, request);
    if (!limited.ok) {
      await writeVerificationDb(db);
      return { ok: false, message: limited.message };
    }
    const token = crypto.randomBytes(24).toString("base64url");
    storeVerification(db, "magic_link", email, token, request);
    // AI: persist the token before sending; a delivered link must always be verifiable later.
    db = await writeVerificationDb(db);
    const host = request.request?.headers?.host ? `https://${request.request.headers.host}` : "https://impulse.ccwu.cc";
    const magicLink = `${host}/?magic_token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const mail = await sendTrackedEmail(db, EmailTypes.AUTH_MAGIC_LINK, {
      to: email,
      magicLink,
      expiresInMinutes: Math.floor(VerificationMaxAgeMs / 60000)
    });
    if (!mail.ok) {
      delete db.verifications[verificationKey("magic_link", email)];
      await writeVerificationDb(db);
      return { ok: false, message: "邮件服务暂不可用，请稍后重试。" };
    }
    try {
      await writeVerificationDb(db);
    } catch (error) {
      // Token was persisted before delivery; email audit logging is best effort after the message is sent.
    }
    return { ok: mail.ok, message: mail.ok ? EmailPrivacyResponse : "邮件服务暂不可用，请稍后重试。" };
  }

  if (action === "passwordReset") {
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    if (!canPersistVerificationState(db)) {
      return verificationStorageUnavailableResponse(db);
    }
    const user = findUserByEmail(db, email);
    if (!user) {
      log(db, "密码重置请求已忽略", privacyHash("email", email).slice(0, 12));
      await writeVerificationDb(db);
      return { ok: true, message: EmailPrivacyResponse };
    }
    const limited = canRequestVerification(db, email, request);
    if (!limited.ok) {
      await writeVerificationDb(db);
      return { ok: false, message: limited.message };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storeVerification(db, "password_reset", email, code, request);
    // AI: persist the reset code before sending; storage failure must stop email delivery.
    db = await writeVerificationDb(db);
    const mail = await sendTrackedEmail(db, EmailTypes.PASSWORD_RESET, {
      to: email,
      code,
      expiresInMinutes: Math.floor(VerificationMaxAgeMs / 60000)
    });
    if (!mail.ok) {
      delete db.verifications[verificationKey("password_reset", email)];
      await writeVerificationDb(db);
      return { ok: false, message: "邮件服务暂不可用，请稍后重试。" };
    }
    try {
      await writeVerificationDb(db);
    } catch (error) {
      // Code was persisted before delivery; email audit logging is best effort after the message is sent.
    }
    return { ok: mail.ok, message: mail.ok ? EmailPrivacyResponse : "邮件服务暂不可用，请稍后重试。" };
  }

  if (action === "loginPassword") {
    const identity = String(payload.identity || "").trim();
    const user = isEmail(identity) ? findUserByEmail(db, identity) : findUser(db, identity);
    if (!user || !verifyUserPassword(db, user, payload.password)) {
      return { ok: false, message: "账号或密码不正确。" };
    }
    const available = ensureAvailable(db, user);
    if (!available.ok) {
      return available;
    }
    log(db, "用户登录", user.username, user.username);
    const session = makeSessionResponse(db, user);
    try {
      await writeDb(db);
    } catch (error) {
      // AI: password auth already succeeded; login audit/lastOnline writes are best effort for this path.
      session.backend = { ...backendStorageInfo(db), unavailable: isStorageError(error), error: storageErrorCode(error) };
    }
    return session;
  }

  if (action === "loginCode") {
    const email = normalizeEmail(payload.email);
    if (!canPersistVerificationState(db)) {
      return verificationStorageUnavailableResponse(db);
    }
    const user = findUserByEmail(db, email);
    if (!user) {
      return { ok: false, message: "该邮箱未注册。" };
    }
    const verified = verifyCode(db, "login", email, payload.code);
    if (!verified.ok) {
      return verified;
    }
    const available = ensureAvailable(db, user);
    if (!available.ok) {
      return available;
    }
    log(db, "用户登录", user.username, user.username);
    const session = makeSessionResponse(db, user);
    // AI: this write consumes the login code; failing closed prevents issuing a session with a reusable code.
    await writeVerificationDb(db);
    return session;
  }

  if (action === "register") {
    const username = String(payload.username || "").trim();
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || "");
    if (!username || !password) {
      return { ok: false, message: "请输入用户名、邮箱和密码。" };
    }
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    if (password.length < 6) {
      return { ok: false, message: "密码至少需要 6 位。" };
    }
    if (password !== String(payload.confirmPassword || "")) {
      return { ok: false, message: "两次输入的密码不一致。" };
    }
    if (!canPersistVerificationState(db)) {
      return verificationStorageUnavailableResponse(db);
    }
    if (findUser(db, username)) {
      return { ok: false, message: "用户名已存在。" };
    }
    if (findUserByEmail(db, email)) {
      return { ok: false, message: "邮箱已被注册。" };
    }
    if (!String(payload.countryRegion || "").trim()) {
      return { ok: false, message: "请输入国家或地区。" };
    }
    if (!payload.birthday) {
      return { ok: false, message: "请选择生日。" };
    }
    const verified = verifyCode(db, "register", email, payload.code);
    if (!verified.ok) {
      return verified;
    }
    const createdAt = nowIso();
    const user = {
      username,
      email,
      passwordHash: hashPassword(password),
      role: "customer",
      countryRegion: String(payload.countryRegion || "").trim(),
      birthday: payload.birthday,
      gender: payload.gender || "unset",
      avatarImage: payload.avatarImage || "",
      avatarImageName: payload.avatarImageName || "",
      createdAt
    };
    db.users.push(user);
    ensureProfiles(db);
    log(db, "用户注册", `${username} 注册为顾客`, username);
    await writeVerificationDb(db);
    return makeSessionResponse(db, user);
  }

  if (action === "logout") {
    if (request.user) {
      const profile = profileByUsername(db, request.user.username);
      if (profile) {
        profile.lastOnlineAt = "";
      }
      log(db, "用户登出", request.user.username, request.user.username);
      await writeDb(db);
    }
    return { ok: true };
  }

  if (action === "verifyPassword") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    const user = findUser(db, request.user.username);
    if (!user || !verifyUserPassword(db, user, payload.password)) {
      return { ok: false, message: "账户密码不正确。" };
    }
    return { ok: true };
  }

  if (action === "updatePassword") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    const user = db.users.find((item) => normalize(item.username) === normalize(request.user.username));
    if (!user) {
      return { ok: false, message: "内置账号暂不支持修改该信息。" };
    }
    const password = String(payload.password || "");
    if (password.length < 6) {
      return { ok: false, message: "密码至少需要 6 位。" };
    }
    user.passwordHash = hashPassword(password);
    log(db, "修改密码", request.user.username, request.user.username);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "updateEmail") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    if (findUserByEmail(db, email)) {
      return { ok: false, message: "该邮箱已被其他账户绑定。" };
    }
    const user = db.users.find((item) => normalize(item.username) === normalize(request.user.username));
    if (!user) {
      return { ok: false, message: "内置账号暂不支持修改该信息。" };
    }
    user.email = email;
    const profile = profileByUsername(db, user.username);
    if (profile && !profile.notificationEmail) {
      profile.notificationEmail = email;
    }
    log(db, "修改绑定邮箱", `${request.user.username} -> ${email}`, request.user.username);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, email, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "createRechargeClaim") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    if (PointsSystemPaused) {
      return pointsSystemPausedResponse();
    }
    db = hydrateTemporaryDb(db, payload.snapshot, request.user.username);
    const profile = db.profiles.find((item) => item.id === payload.profileId);
    if (!profile || normalize(profile.username) !== normalize(request.user.username)) {
      return { ok: false, message: "未找到当前账户。" };
    }
    const amountPoints = Math.max(0, Number(payload.amountPoints || 0));
    if (!amountPoints) {
      return { ok: false, message: "充值积分无效。" };
    }
    const itemName = String(payload.itemName || "Recharge").trim();
    const message = addMailboxMessage(db, profile.username, {
      category: "funds",
      subject: "Recharge points ready",
      preview: `${itemName} / ${amountPoints} points`,
      body: `Hello ${profile.username}, your recharge is complete. Claim ${amountPoints} points from this in-app mail. Amount paid: ${Number(payload.amountMoney || 0)} USD.`,
      sender: SystemSenderName,
      source: "recharge",
      sourceId: createId("recharge"),
      claim: {
        type: "recharge",
        amountPoints,
        amountMoney: Number(payload.amountMoney || 0),
        itemName,
        claimedAt: ""
      }
    });
    log(db, "充值邮件生成", `${profile.username} ${amountPoints} points`, request.user.username);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, message, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "claimMailboxReward") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    if (PointsSystemPaused) {
      return pointsSystemPausedResponse("积分领取功能暂未开放。");
    }
    db = hydrateTemporaryDb(db, payload.snapshot, request.user.username);
    const key = normalize(request.user.username);
    const list = Array.isArray(db.mailboxMessages[key]) ? db.mailboxMessages[key] : [];
    const message = list.find((item) => item && typeof item === "object" && item.id === payload.messageId && !item.deletedAt);
    if (!message?.claim || message.claim.type !== "recharge" || message.claim.claimedAt || Number(message.claim.amountPoints || 0) <= 0) {
      return { ok: false, message: "没有可领取的积分。" };
    }
    const profile = profileByUsername(db, request.user.username);
    if (!profile) {
      return { ok: false, message: "未找到当前账户。" };
    }
    const amountPoints = Number(message.claim.amountPoints || 0);
    const result = addLedger(db, profile, amountPoints, "充值积分领取", {
      type: "recharge_claim",
      amountMoney: Number(message.claim.amountMoney || 0),
      itemName: message.claim.itemName || "Recharge"
    }, request.user.username);
    if (!result.ok) {
      return { ok: false, message: "积分领取失败。" };
    }
    const now = nowIso();
    db.mailboxMessages[key] = list.map((item) => (
      item && typeof item === "object" && item.id === payload.messageId
        ? { ...item, readAt: item.readAt || now, claim: { ...(item.claim || {}), claimedAt: now } }
        : item
    ));
    log(db, "领取充值积分", `${request.user.username} ${amountPoints} points`, request.user.username);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, points: amountPoints, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "sendAdminMailbox") {
    if (!request.user || request.user.role !== "admin") {
      return { ok: false, message: "无权发送系统邮件。" };
    }
    if (AdminMailboxSendingDisabled) {
      return { ok: false, status: 423, message: AdminMailboxSendingDisabledMessage };
    }
    db = hydrateTemporaryDb(db, payload.snapshot, request.user.username);
    ensureProfiles(db);
    const validated = validateAdminMailboxPayload(payload);
    if (!validated.ok) {
      return { ok: false, message: validated.message };
    }
    const recipients = validated.target === "user"
      ? db.profiles.filter((profile) => normalize(profile.username) === normalize(validated.username) && canReceiveAdminMailbox(db, profile))
      : db.profiles.filter((profile) => canReceiveAdminMailbox(db, profile));
    if (!recipients.length) {
      return { ok: false, message: "未找到收件人。" };
    }
    const written = [];
    recipients.forEach((profile) => {
      const entry = addMailboxMessage(db, profile.username, {
        category: "system",
        subject: validated.subject,
        preview: clipVisibleText(validated.body, AdminMailboxPreviewMaxLength),
        body: validated.body,
        sender: "管理员",
        source: "admin",
        sourceId: createId("admin-mail"),
        expiresDays: validated.expiresDays
      });
      if (mailboxEntryReadable(db, entry)) {
        written.push(entry);
      }
    });
    if (!written.length) {
      return { ok: false, message: "邮件写入失败，请稍后重试。" };
    }
    log(db, "发送系统邮件", `${request.user.username} -> ${validated.target === "user" ? validated.username : "all"}: ${validated.subject} (${written.length}/${recipients.length})`, request.user.username);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    const persistedCount = written.filter((entry) => mailboxEntryReadable(db, entry)).length;
    if (!persistedCount) {
      return { ok: false, message: "邮件写入失败，请稍后重试。" };
    }
    return { ok: true, count: persistedCount, recipientCount: recipients.length, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "adjustFunds") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    if (PointsSystemPaused) {
      return pointsSystemPausedResponse("资金调整功能暂未开放。");
    }
    db = hydrateTemporaryDb(db, payload.snapshot, request.user.username);
    const profileId = payload.profileId;
    const profile = db.profiles.find((item) => item.id === profileId);
    if (!profile) {
      return { ok: false, message: "未找到当前账户。" };
    }
    const isSelfRecharge = normalize(profile.username) === normalize(request.user.username) && payload.meta?.type === "recharge";
    if (request.user.role !== "admin" && !isSelfRecharge) {
      return { ok: false, message: "无权修改资金。" };
    }
    const result = addLedger(db, profile, Number(payload.amountPoints || 0), payload.reason || "资金变动", payload.meta || {}, request.user.username);
    if (!result.ok) {
      return { ok: false, reason: result.reason, message: "余额不足，请先充值。", before: result.before, after: result.after };
    }
    if (isSelfRecharge && Number(payload.amountPoints || 0) > 0) {
      addNoticeMailboxMessage(db, result.profile.username, "rechargeSuccess", {
        itemName: payload.meta?.itemName || payload.reason || "Recharge",
        amount: `${Number(payload.amountPoints || 0)} points`
      });
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, profile: result.profile, entry: result.entry, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "createOrder") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    if (PointsSystemPaused) {
      return pointsSystemPausedResponse("订单和积分使用功能暂未开放。");
    }
    db = hydrateTemporaryDb(db, payload.snapshot, request.user.username);
    const result = createOrderOnBackend(db, payload.order || payload, request.user);
    if (!result.ok) {
      return result;
    }
    await notifyOrderCreated(db, result.order);
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, order: result.order, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "updateOrderStatus") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    const result = updateOrderStatusOnBackend(db, payload.orderId, payload.status, request.user);
    if (!result.ok) {
      return result;
    }
    if (payload.status === "completed") {
      await notifyOrderCompleted(db, result.order);
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    if (!vectorSupportChatPaused()) {
      await persistSupabaseMessages(payload.orderId, db.orderChats[payload.orderId] || []);
    }
    return { ok: true, order: result.order, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "addChatMessage") {
    const access = chatAccess(db, payload.orderId, request.user);
    if (!access.ok) return access;
    if (orderChatIsReadOnly(access.order)) {
      return { ok: false, message: "该订单已经结束，聊天记录将在7日后自动删除。" };
    }
    if (normalizeChatContentType(payload.type, payload) === "image" || payload.imageData || payload.imageUrl) {
      return { ok: false, message: "图片上传暂未开放。" };
    }
    const normalizedPayload = normalizeClientChatPayload(payload);
    if (!normalizedPayload.ok) {
      return normalizedPayload;
    }
    const profile = profileByUsername(db, request.user.username);
    if (profile) {
      profile.lastOnlineAt = nowIso();
    }
    const senderId = String((profile && (profile.id || profile.userId)) || request.user.id || request.user.username || "").trim();
    const senderRole = normalizeChatSenderRole(request.user.role);
    const result = addChatMessage(db, payload.orderId, {
      ...normalizedPayload.message,
      id: normalizedPayload.message.id || payload.id,
      sender: request.user.username,
      senderId,
      sender_id: senderId,
      role: senderRole,
      senderRole,
      sender_role: senderRole
    }, request.user.username);
    if (!result.ok) {
      return result;
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    const realtimePersisted = await persistSupabaseMessage(payload.orderId, result.message);
    if (realtimePersisted) {
      return { ok: true, message: result.message, realtime: true };
    }
    return { ok: true, message: result.message, realtime: false, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "listChatMessages") {
    const access = chatAccess(db, payload.orderId, request.user);
    if (!access.ok) return access;
    const profile = profileByUsername(db, request.user.username);
    if (profile) {
      profile.lastOnlineAt = nowIso();
    }
    let messages = db.orderChats[payload.orderId] || [];
    const remoteMessages = await fetchSupabaseMessages(payload.orderId);
    if (Array.isArray(remoteMessages)) {
      messages = mergeChatMessages(messages, remoteMessages);
      db.orderChats[payload.orderId] = messages;
    }
    const remotePresence = await fetchSupabasePresence(payload.orderId);
    if (remotePresence && typeof remotePresence === "object") {
      const typing = Object.fromEntries(Object.entries(remotePresence).filter(([, entry]) => entry?.isTyping));
      db.chatTyping[payload.orderId] = {
        ...(db.chatTyping[payload.orderId] || {}),
        ...typing
      };
    }
    pruneChatTyping(db);
    return {
      ok: true,
      messages,
      typing: db.chatTyping[payload.orderId] || {},
      presence: remotePresence && typeof remotePresence === "object" ? remotePresence : {},
      realtime: Array.isArray(remoteMessages)
    };
  }

  if (action === "markChatRead") {
    const access = chatAccess(db, payload.orderId, request.user);
    if (!access.ok) return access;
    const now = nowIso();
    db.orderChats[payload.orderId] = (db.orderChats[payload.orderId] || []).map((message) => {
      if (normalize(message.sender) === normalize(request.user.username)) {
        return message;
      }
      const readBy = Array.isArray(message.readBy) ? message.readBy : [];
      if (readBy.some((item) => normalize(item) === normalize(request.user.username))) {
        return message;
      }
      return {
        ...message,
        readBy: [...readBy, request.user.username],
        readAt: { ...(message.readAt || {}), [request.user.username]: now }
      };
    });
    const profile = profileByUsername(db, request.user.username);
    if (profile) {
      profile.lastOnlineAt = now;
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    await persistSupabaseMessages(payload.orderId, db.orderChats[payload.orderId] || []);
    return { ok: true, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "setChatTyping") {
    const access = chatAccess(db, payload.orderId, request.user);
    if (!access.ok) return access;
    pruneChatTyping(db);
    db.chatTyping[payload.orderId] = db.chatTyping[payload.orderId] && typeof db.chatTyping[payload.orderId] === "object"
      ? db.chatTyping[payload.orderId]
      : {};
    if (payload.isTyping) {
      db.chatTyping[payload.orderId][request.user.username] = {
        username: request.user.username,
        role: request.user.role,
        isTyping: true,
        updatedAt: nowIso()
      };
    } else {
      delete db.chatTyping[payload.orderId][request.user.username];
    }
    const profile = profileByUsername(db, request.user.username);
    if (profile) {
      profile.lastOnlineAt = nowIso();
    }
    const presencePersisted = await persistSupabasePresence(payload.orderId, request.user, Boolean(payload.isTyping));
    if (presencePersisted) {
      const updatedAt = nowIso();
      return {
        ok: true,
        typing: db.chatTyping[payload.orderId] || {},
        presence: {
          [request.user.username]: {
            username: request.user.username,
            role: request.user.role,
            isTyping: Boolean(payload.isTyping),
            updatedAt,
            lastOnlineAt: updatedAt
          }
        },
        realtime: true
      };
    }
    const unavailable = await persistDurable();
    if (unavailable) {
      return unavailable;
    }
    return { ok: true, typing: db.chatTyping[payload.orderId] || {}, realtime: false, snapshot: sanitizeSnapshot(db) };
  }

  return { ok: false, message: "Unknown backend action." };
}

async function parseRequestBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024 * 8) {
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

module.exports = {
  handleAction,
  parseRequestBody,
  verifyToken,
  sanitizeSnapshot,
  readDb,
  writeDb,
  normalizeDb,
  isStorageError,
  storageUnavailableResponse,
  recordEmailLog,
  sendTrackedEmail,
  emailHealth
};
