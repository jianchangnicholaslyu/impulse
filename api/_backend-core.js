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
const SupabaseTablePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const EmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SessionMaxAgeMs = 30 * 24 * 60 * 60 * 1000;
const VerificationMaxAgeMs = 5 * 60 * 1000;
const VerificationCooldownMs = 60 * 1000;
const VerificationIpWindowMs = 10 * 60 * 1000;
const VerificationIpLimit = 5;
const EmailPrivacyResponse = "If this email is valid, a message has been sent.";
// AI: mail auth spec: hash-only codes, 5m TTL, 60s/email, 5/10m/IP, generic response, no prod devCode.
const DayMs = 24 * 60 * 60 * 1000;
const ChatRetentionMs = 14 * DayMs;
const ArchiveRetentionMs = 30 * DayMs;
const AssetMaxBytes = Number(process.env.MAX_ASSET_BYTES || 5 * 1024 * 1024);
const BuiltInUsers = [
  { username: "ADMIN", email: "admin@impulse.local", password: "********", role: "admin" },
  { username: "EMPL001", email: "empl001@impulse.local", password: "12345678", role: "staff" }
];
const EmailNoticeSubjects = {
  rechargeSuccess: "Recharge successful",
  orderSuccess: "Order placed successfully",
  orderAccepted: "Your order has been accepted",
  serviceReminder: "Service reminder",
  progressReminder: "Progress update",
  completionRequest: "Completion request",
  rushReply: "Rush request update",
  completionSuccess: "Order completed",
  returnSuccess: "Order return completed"
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

function nowIso() {
  return new Date().toISOString();
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
    orderChats: {},
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
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
}

function supabaseTable() {
  const table = process.env.SUPABASE_STATE_TABLE || "impulse_state";
  if (!SupabaseTablePattern.test(table)) {
    throw new Error("SUPABASE_STATE_TABLE must contain only letters, numbers, and underscores, and cannot start with a number.");
  }
  return table;
}

function supabaseAssetBucket() {
  return String(process.env.SUPABASE_STORAGE_BUCKET || "impulse-assets").trim();
}

function hasSupabaseStorage() {
  return Boolean(supabaseUrl() && supabaseKey());
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
      apikey: supabaseKey(),
      Authorization: `Bearer ${supabaseKey()}`,
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

function canUseClientSnapshot() {
  return !hasSupabaseStorage() && !hasKvStorage();
}

function hydrateTemporaryDb(db, snapshot, actor = "CLIENT") {
  if (!canUseClientSnapshot() || !snapshot || typeof snapshot !== "object") {
    return db;
  }
  const imported = importSnapshot(db, snapshot);
  log(imported, "临时状态同步", "从客户端快照补齐临时后端状态", actor);
  return imported;
}

async function readDb() {
  if (hasSupabaseStorage()) {
    return readSupabaseDb();
  }
  const kv = await kvRequest("get", [DbKey]);
  if (kv) {
    return kv.result ? normalizeDb(JSON.parse(kv.result)) : emptyDb();
  }
  try {
    const raw = await fs.readFile(DataFile, "utf8");
    return normalizeDb(JSON.parse(raw));
  } catch (error) {
    return emptyDb();
  }
}

async function writeDb(db) {
  const normalized = normalizeDb(db);
  if (hasSupabaseStorage()) {
    return writeSupabaseDb(normalized);
  }
  const payload = JSON.stringify(normalized);
  const kv = await kvRequest("set", [DbKey, payload]);
  if (kv) {
    return normalized;
  }
  await fs.mkdir(path.dirname(DataFile), { recursive: true });
  await fs.writeFile(DataFile, JSON.stringify(normalized, null, 2));
  return normalized;
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
    orderChats: db.orderChats,
    mailboxMessages: db.mailboxMessages,
    ledger: db.ledger,
    adminLogs: db.adminLogs,
    systemSettings: db.systemSettings
  };
}

function normalizeDb(input) {
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
  db.orderChats = db.orderChats && typeof db.orderChats === "object" && !Array.isArray(db.orderChats) ? db.orderChats : {};
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

function importSnapshot(db, snapshot = {}) {
  const mergedUsers = mergeArrayBy(db.users, snapshot.users, (user) => normalize(user?.username || user?.email), (existing, user) => ({
    ...existing,
    ...user,
    passwordHash: user.passwordHash || existing.passwordHash || (user.password ? hashPassword(user.password) : "")
  }));
  const imported = normalizeDb({
    ...db,
    users: mergedUsers,
    profiles: mergeArrayBy(db.profiles, snapshot.profiles, (profile) => profile?.id || normalize(profile?.username)),
    categories: mergeArrayBy(db.categories, snapshot.categories, (category) => category?.id),
    games: mergeRecordLists(db.games, snapshot.games, (game) => game?.id),
    products: mergeRecordLists(db.products, snapshot.products, (product) => product?.id),
    orders: mergeArrayBy(db.orders, snapshot.orders, (order) => order?.id),
    orderChats: mergeChatRecords(db.orderChats, snapshot.orderChats),
    mailboxMessages: mergeChatRecords(db.mailboxMessages, snapshot.mailboxMessages),
    ledger: mergeArrayBy(db.ledger, snapshot.ledger, (entry) => entry?.id),
    adminLogs: mergeArrayBy(db.adminLogs, snapshot.adminLogs, (entry) => entry?.id),
    systemSettings: mergeSystemSettings(db.systemSettings, snapshot.systemSettings)
  });
  return imported;
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

function canExposeDevCode(mail) {
  return !mail.ok && process.env.VERCEL_ENV !== "production" && process.env.NODE_ENV !== "production";
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
  if (!["completed", "cancelled"].includes(order?.status)) {
    return "";
  }
  return order.completedAt || order.settledAt || order.updatedAt || order.createdAt || "";
}

async function sendArchivePackage(db, kind, records, dateFn) {
  const backupEmail = normalizeEmail(db.systemSettings?.backupEmail || "");
  if (!isEmail(backupEmail) || !records.length) {
    return { ok: false, skipped: true };
  }
  const range = dateRange(records, dateFn);
  const kindLabel = kind === "logs" ? "System Logs" : "Order Records";
  const subject = `IMPULSE J ${kindLabel} Backup ${range.start} to ${range.end}`;
  const filename = `impulse-${kind === "logs" ? "system-logs" : "order-records"}-${range.start}-to-${range.end}.json`;
  const payload = {
    exportedAt: nowIso(),
    type: kind,
    period: range,
    count: records.length,
    records
  };
  const body = [
    `IMPULSE J ${kindLabel} backup package.`,
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
  // AI: chat=14d purge; logs/orders=30d purge only after backup mail succeeds.
  let changed = false;
  const now = Date.now();
  const chatCutoff = now - ChatRetentionMs;
  const archiveCutoff = now - ArchiveRetentionMs;

  Object.keys(db.orderChats || {}).forEach((orderId) => {
    const current = Array.isArray(db.orderChats[orderId]) ? db.orderChats[orderId] : [];
    const next = current.filter((message) => timestampMs(message.createdAt) >= chatCutoff);
    if (next.length !== current.length) {
      changed = true;
      if (next.length) {
        db.orderChats[orderId] = next;
      } else {
        delete db.orderChats[orderId];
      }
    }
  });

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

function addChatMessage(db, orderId, message, actor = "SYSTEM") {
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) {
    return { ok: false, message: "订单不存在" };
  }
  const next = {
    id: createId("msg"),
    sender: message.sender || actor,
    role: message.role || "system",
    type: message.type || "text",
    text: message.text || "",
    imageData: message.imageData || "",
    readBy: [message.sender || actor],
    readAt: { [message.sender || actor]: nowIso() },
    createdAt: nowIso()
  };
  db.orderChats[orderId] = [...(db.orderChats[orderId] || []), next];
  addChatMailboxNotifications(db, order, next);
  return { ok: true, message: next };
}

function createOrderOnBackend(db, payload, actor) {
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
    "This notice is also stored in your IMPULSE J in-app mailbox and cannot be unsent."
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
  const category = MailboxCategories.has(payload.category) ? payload.category : "system";
  const entry = {
    id: payload.id || createId("mail"),
    recipientUsername,
    category,
    subject: String(payload.subject || "System Notice").trim(),
    preview: String(payload.preview || body.slice(0, 120) || "System Notice").trim(),
    body,
    sender: String(payload.sender || "IMPULSE J System").trim(),
    source: String(payload.source || "system").trim(),
    sourceId: String(payload.sourceId || "").trim(),
    orderId: String(payload.orderId || "").trim(),
    readAt: payload.readAt || "",
    createdAt: payload.createdAt || nowIso()
  };
  const list = Array.isArray(db.mailboxMessages[key]) ? db.mailboxMessages[key] : [];
  db.mailboxMessages[key] = [entry, ...list.filter((item) => item.id !== entry.id)];
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
    sender: "IMPULSE J System",
    source: "notice",
    sourceId: noticeKey,
    orderId: context.orderId || ""
  });
}

function chatMailboxBody(order, message) {
  const content = message.text
    ? message.text
    : message.imageData
      ? "[Image attachment]"
      : "[No text content]";
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
  const participants = [order.customerUsername, order.handledBy].filter(Boolean);
  if (!participants.length) {
    return [];
  }
  if (message.sender === "SYSTEM" || message.role === "system" || message.type === "system") {
    return participants;
  }
  const senderKey = normalize(message.sender);
  return participants.filter((name) => normalize(name) !== senderKey);
}

function addChatMailboxNotifications(db, order, message) {
  chatMailboxRecipients(order, message).forEach((username) => {
    addMailboxMessage(db, username, {
      category: "chat",
      subject: message.sender === "SYSTEM" || message.type === "system" ? "Order Chat Update" : "New Chat Message",
      preview: message.text || (message.imageData ? "[Image attachment]" : "Order Chat Update"),
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

function updateOrderStatusOnBackend(db, orderId, status, actor) {
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) {
    return { ok: false, message: "订单不存在" };
  }
  const role = actor.role || "customer";
  if (!["staff", "admin"].includes(role) && !(status === "cancelled" && order.customerUsername === actor.username && order.status === "pending")) {
    return { ok: false, message: "无权操作订单。" };
  }
  const updatedAt = nowIso();
  if (status === "processing") {
    if (order.status !== "pending") {
      return { ok: false, message: "该订单已不在待处理状态。" };
    }
    order.status = "processing";
    order.handledBy = order.handledBy || actor.username;
    order.acceptedAt = order.acceptedAt || updatedAt;
    addChatMessage(db, order.id, {
      sender: "SYSTEM",
      role: "system",
      type: "system",
      text: `${order.handledBy} accepted the order. Chat is now available.`
    });
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

async function handleAction(action, payload = {}, request = {}) {
  let db = await readDb();
  if (!["setBackupEmail", "runRetentionCleanup"].includes(action)) {
    const retention = await applyRetentionPolicies(db);
    if (retention.changed) {
      await writeDb(db);
    }
  }

  if (action === "health") {
    const email = emailHealth();
    return { ok: true, storage: storageType(), hasEmail: email.configured, email };
  }

  if (action === "bootstrap") {
    if (payload.snapshot) {
      db = importSnapshot(db, payload.snapshot);
      await applyRetentionPolicies(db);
      log(db, "后端初始化", "从前端快照导入初始数据");
      await writeDb(db);
    }
    return { ok: true, snapshot: sanitizeSnapshot(db), backend: { storage: storageType() } };
  }

  if (action === "saveSnapshot") {
    db = importSnapshot(db, payload.snapshot || {});
    await applyRetentionPolicies(db);
    log(db, "后端同步", payload.reason || "前端同步快照", request.user?.username || "CLIENT");
    await writeDb(db);
    return { ok: true, snapshot: sanitizeSnapshot(db) };
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
    await writeDb(db);
    return { ok: true, retention: nextRetention, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "runRetentionCleanup") {
    if (!request.user || request.user.role !== "admin") {
      return { ok: false, message: "需要管理员权限。" };
    }
    const nextRetention = await applyRetentionPolicies(db);
    if (nextRetention.changed) {
      await writeDb(db);
    }
    return { ok: true, retention: nextRetention, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "sendVerification") {
    // AI: avoid email enumeration; invalid register/login targets return generic success without sending.
    const purpose = String(payload.purpose || "login");
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    const hasUser = Boolean(findUserByEmail(db, email));
    const shouldSend = purpose === "register" ? !hasUser : hasUser;
    if (!shouldSend) {
      log(db, "验证码请求已忽略", `${purpose} / ${privacyHash("email", email).slice(0, 12)}`);
      await writeDb(db);
      return { ok: true, message: EmailPrivacyResponse, mail: { ok: false, skipped: true, configured: emailHealth().configured } };
    }
    const limited = canRequestVerification(db, email, request);
    if (!limited.ok) {
      log(db, "验证码限流", `${purpose} / ${privacyHash("email", email).slice(0, 12)}`);
      await writeDb(db);
      return { ok: false, message: limited.message };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storeVerification(db, purpose, email, code, request);
    const mail = await sendTrackedEmail(db, EmailTypes.AUTH_VERIFICATION_CODE, {
      to: email,
      code,
      purpose,
      expiresInMinutes: Math.floor(VerificationMaxAgeMs / 60000)
    });
    log(db, "验证码发送", `${privacyHash("email", email).slice(0, 12)} / ${purpose} / mail:${mail.ok ? "sent" : "fallback"}`);
    await writeDb(db);
    if (!mail.ok && !canExposeDevCode(mail)) {
      return { ok: false, message: "邮件服务暂不可用，请稍后重试。", mail: { ok: false, configured: mail.configured !== false } };
    }
    return { ok: true, message: EmailPrivacyResponse, mail, devCode: canExposeDevCode(mail) ? code : "" };
  }

  if (action === "verifyCode") {
    const purpose = String(payload.purpose || "login");
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    const verified = verifyCode(db, purpose, email, payload.code);
    if (!verified.ok) {
      return verified;
    }
    await writeDb(db);
    return { ok: true };
  }

  if (action === "sendMagicLink") {
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    const user = findUserByEmail(db, email);
    if (!user) {
      log(db, "魔法链接请求已忽略", privacyHash("email", email).slice(0, 12));
      await writeDb(db);
      return { ok: true, message: EmailPrivacyResponse };
    }
    const limited = canRequestVerification(db, email, request);
    if (!limited.ok) {
      await writeDb(db);
      return { ok: false, message: limited.message };
    }
    const token = crypto.randomBytes(24).toString("base64url");
    storeVerification(db, "magic_link", email, token, request);
    const host = request.request?.headers?.host ? `https://${request.request.headers.host}` : "https://impulse.ccwu.cc";
    const magicLink = `${host}/?magic_token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const mail = await sendTrackedEmail(db, EmailTypes.AUTH_MAGIC_LINK, {
      to: email,
      magicLink,
      expiresInMinutes: Math.floor(VerificationMaxAgeMs / 60000)
    });
    await writeDb(db);
    return { ok: mail.ok, message: mail.ok ? EmailPrivacyResponse : "邮件服务暂不可用，请稍后重试。" };
  }

  if (action === "passwordReset") {
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    const user = findUserByEmail(db, email);
    if (!user) {
      log(db, "密码重置请求已忽略", privacyHash("email", email).slice(0, 12));
      await writeDb(db);
      return { ok: true, message: EmailPrivacyResponse };
    }
    const limited = canRequestVerification(db, email, request);
    if (!limited.ok) {
      await writeDb(db);
      return { ok: false, message: limited.message };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storeVerification(db, "password_reset", email, code, request);
    const mail = await sendTrackedEmail(db, EmailTypes.PASSWORD_RESET, {
      to: email,
      code,
      expiresInMinutes: Math.floor(VerificationMaxAgeMs / 60000)
    });
    await writeDb(db);
    return { ok: mail.ok, message: mail.ok ? EmailPrivacyResponse : "邮件服务暂不可用，请稍后重试。", devCode: canExposeDevCode(mail) ? code : "" };
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
    await writeDb(db);
    return makeSessionResponse(db, user);
  }

  if (action === "loginCode") {
    const email = normalizeEmail(payload.email);
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
    await writeDb(db);
    return makeSessionResponse(db, user);
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
    await writeDb(db);
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
    await writeDb(db);
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
    await writeDb(db);
    return { ok: true, email, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "adjustFunds") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
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
    await writeDb(db);
    return { ok: true, profile: result.profile, entry: result.entry, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "createOrder") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    db = hydrateTemporaryDb(db, payload.snapshot, request.user.username);
    const result = createOrderOnBackend(db, payload.order || payload, request.user);
    if (!result.ok) {
      return result;
    }
    await notifyOrderCreated(db, result.order);
    await writeDb(db);
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
    await writeDb(db);
    return { ok: true, order: result.order, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "addChatMessage") {
    if (!request.user) {
      return { ok: false, message: "请先登录" };
    }
    const order = db.orders.find((item) => item.id === payload.orderId);
    if (!order) {
      return { ok: false, message: "订单不存在" };
    }
    const allowed = [order.customerUsername, order.handledBy].filter(Boolean).map(normalize);
    if (!allowed.includes(normalize(request.user.username)) && request.user.role !== "admin") {
      return { ok: false, message: "无权查看" };
    }
    const result = addChatMessage(db, payload.orderId, {
      sender: request.user.username,
      role: request.user.role,
      type: payload.type,
      text: payload.text,
      imageData: payload.imageData
    }, request.user.username);
    await writeDb(db);
    return { ok: true, message: result.message, snapshot: sanitizeSnapshot(db) };
  }

  return { ok: false, message: "Unknown backend action." };
}

async function parseRequestBody(request) {
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

module.exports = {
  handleAction,
  parseRequestBody,
  verifyToken,
  sanitizeSnapshot,
  readDb,
  writeDb,
  normalizeDb,
  recordEmailLog,
  sendTrackedEmail,
  emailHealth
};
