const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const IsVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DataDir = process.env.IMPULSE_DATA_DIR || (IsVercel ? path.join(os.tmpdir(), "impulse-data") : path.join(process.cwd(), ".data"));
const DataFile = path.join(DataDir, "impulse-db.json");
const DbKey = process.env.BACKEND_DB_KEY || "impulse:db";
const EmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SessionMaxAgeMs = 30 * 24 * 60 * 60 * 1000;
const VerificationMaxAgeMs = 10 * 60 * 1000;
const BuiltInUsers = [
  { username: "ADMIN", email: "admin@impulse.local", password: "********", role: "admin" },
  { username: "EMPL001", email: "empl001@impulse.local", password: "12345678", role: "staff" }
];

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
    ledger: [],
    adminLogs: [],
    verifications: {}
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

function hasKvStorage() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function storageType() {
  if (hasKvStorage()) {
    return "kv";
  }
  return IsVercel ? "temporary-file" : "file";
}

function canUseClientSnapshot() {
  return !hasKvStorage();
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
    ledger: db.ledger,
    adminLogs: db.adminLogs
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
  db.ledger = Array.isArray(db.ledger) ? db.ledger : [];
  db.adminLogs = Array.isArray(db.adminLogs) ? db.adminLogs : [];
  db.verifications = db.verifications && typeof db.verifications === "object" ? db.verifications : {};
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

function importSnapshot(db, snapshot = {}) {
  const incomingUsers = Array.isArray(snapshot.users) && snapshot.users.length ? snapshot.users : db.users;
  const existingUsers = new Map(db.users.map((user) => [normalize(user.username), user]));
  const mergedUsers = incomingUsers.map((user) => {
    const existing = existingUsers.get(normalize(user.username)) || {};
    return {
      ...existing,
      ...user,
      passwordHash: user.passwordHash || existing.passwordHash || (user.password ? hashPassword(user.password) : "")
    };
  });
  const imported = normalizeDb({
    ...db,
    users: mergedUsers,
    profiles: Array.isArray(snapshot.profiles) && snapshot.profiles.length ? snapshot.profiles : db.profiles,
    categories: Array.isArray(snapshot.categories) && snapshot.categories.length ? snapshot.categories : db.categories,
    games: snapshot.games && typeof snapshot.games === "object" ? snapshot.games : db.games,
    products: snapshot.products && typeof snapshot.products === "object" ? snapshot.products : db.products,
    orders: Array.isArray(snapshot.orders) ? snapshot.orders : db.orders,
    orderChats: snapshot.orderChats && typeof snapshot.orderChats === "object" ? snapshot.orderChats : db.orderChats,
    ledger: Array.isArray(snapshot.ledger) ? snapshot.ledger : db.ledger,
    adminLogs: Array.isArray(snapshot.adminLogs) ? snapshot.adminLogs : db.adminLogs
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

function storeVerification(db, purpose, email, code) {
  db.verifications[verificationKey(purpose, email)] = {
    hash: hmac(`${purpose}:${normalizeEmail(email)}:${code}`),
    expiresAt: Date.now() + VerificationMaxAgeMs
  };
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
  delete db.verifications[key];
  return { ok: true };
}

async function sendEmail(to, subject, text) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return { ok: false, configured: false };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "IMPULSE/1.0"
    },
    body: JSON.stringify({ from, to: [to], subject, text })
  });
  const result = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    configured: true,
    id: result.id || "",
    error: result.message || result.name || ""
  };
}

function log(db, action, detail, actor = "SYSTEM") {
  db.adminLogs = [{
    id: createId("log"),
    actor,
    action,
    detail,
    createdAt: nowIso()
  }, ...db.adminLogs].slice(0, 1000);
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

  if (action === "health") {
    return { ok: true, storage: storageType(), hasEmail: Boolean(process.env.RESEND_API_KEY && (process.env.MAIL_FROM || process.env.RESEND_FROM)) };
  }

  if (action === "bootstrap") {
    if (!db.categories.length && payload.snapshot) {
      db = importSnapshot(db, payload.snapshot);
      log(db, "后端初始化", "从前端快照导入初始数据");
      await writeDb(db);
    }
    return { ok: true, snapshot: sanitizeSnapshot(db), backend: { storage: storageType() } };
  }

  if (action === "saveSnapshot") {
    db = importSnapshot(db, payload.snapshot || {});
    log(db, "后端同步", payload.reason || "前端同步快照", request.user?.username || "CLIENT");
    await writeDb(db);
    return { ok: true, snapshot: sanitizeSnapshot(db) };
  }

  if (action === "sendVerification") {
    const purpose = String(payload.purpose || "login");
    const email = normalizeEmail(payload.email);
    if (!isEmail(email)) {
      return { ok: false, message: "请输入有效邮箱。" };
    }
    if (purpose === "register" && findUserByEmail(db, email)) {
      return { ok: false, message: "邮箱已被注册。" };
    }
    if (purpose !== "register" && !findUserByEmail(db, email)) {
      return { ok: false, message: "该邮箱未注册。" };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storeVerification(db, purpose, email, code);
    const mail = await sendEmail(email, "Your IMPULSE verification code", `Your IMPULSE verification code is ${code}.\nIt expires in 10 minutes.`);
    log(db, "验证码发送", `${email} / ${purpose} / mail:${mail.ok ? "sent" : "fallback"}`);
    await writeDb(db);
    return { ok: true, mail, devCode: mail.ok ? "" : code };
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
  normalizeDb
};
