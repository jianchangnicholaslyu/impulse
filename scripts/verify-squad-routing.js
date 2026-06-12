const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

process.env.IMPULSE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "impulse-squad-routing-"));
process.env.SUPABASE_URL = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.SUPABASE_SECRET_KEY = "";
process.env.KV_REST_API_URL = "";
process.env.KV_REST_API_TOKEN = "";
process.env.IMPULSE_SQUAD_EMAIL_TEST_MODE = "success";
process.env.IMPULSE_SQUAD_TEST_NOW = "2026-06-10T01:00:00+08:00";
process.env.IMPULSE_ASSET_UPLOAD_TEST_MODE = "success";

const { handleAction, readDb } = require("../api/_backend-core");

const admin = { username: "ADMIN", role: "admin" };
const customer = { username: "NICK", role: "customer" };
const tinyImageDataUrl = "data:image/png;base64,iVBORw0KGgo=";
const unsupportedImageDataUrl = "data:image/svg+xml;base64,PHN2Zy8+";
const oversizedImageDataUrl = `data:image/png;base64,${Buffer.alloc((2 * 1024 * 1024) + 1).toString("base64")}`;

async function action(name, payload = {}, user = admin) {
  return handleAction(name, payload, { user, request: { headers: {}, socket: {} } });
}

function snapshotSeed() {
  return {
    users: [{
      username: customer.username,
      email: "nick@example.com",
      password: "12345678",
      role: "customer",
      createdAt: "2026-06-10T00:00:00.000Z"
    }],
    categories: [{
      id: "cat",
      title: "服务",
      titleI18n: { en: "Services", "zh-CN": "服务" },
      description: "服务",
      descriptionI18n: { en: "Services", "zh-CN": "服务" },
      icon: "fa-solid fa-star"
    }],
    games: {
      cat: [{
        id: "game",
        title: "游戏",
        titleI18n: { en: "Game", "zh-CN": "游戏" },
        description: "游戏",
        descriptionI18n: { en: "Game", "zh-CN": "游戏" },
        platform: "PC",
        platformI18n: { en: "PC", "zh-CN": "端游" },
        icon: "fa-solid fa-gamepad"
      }]
    },
    products: {
      game: [{
        id: "prod",
        title: "护航单",
        titleI18n: { en: "Escort", "zh-CN": "护航单" },
        description: "护航单",
        descriptionI18n: { en: "Escort", "zh-CN": "护航单" },
        price: 99
      }]
    }
  };
}

(async () => {
  let result = await action("bootstrap", { snapshot: snapshotSeed() }, admin);
  assert.equal(result.ok, true, "bootstrap");

  result = await action("createRoutedOrder", { productId: "prod" }, customer);
  assert.equal(result.ok, false, "no squad should fail");
  assert.equal(result.message, "暂无空闲小队");

  result = await action("saveSquad", {
    id: "squad-a",
    name: "Alpha",
    members: ["A1", "A2", "A3"],
    groupType: "qq",
    groupNumber: "123456",
    activationEnabled: true,
    businessProjects: ["prod"],
    supportedItemIds: ["prod"],
    activeTime: "10:00-24:00"
  }, admin);
  assert.equal(result.ok, true, "save squad");
  assert.equal(result.squad.status, "online", "activated squad is online before cutoff");

  result = await action("toggleSquad", { squadId: "squad-a", activationEnabled: false }, admin);
  assert.equal(result.ok, true, "toggle off");
  assert.equal(result.squad.status, "offline");

  result = await action("createRoutedOrder", { productId: "prod" }, customer);
  assert.equal(result.ok, false, "offline squad cannot accept");
  assert.equal(result.message, "暂无空闲小队");

  result = await action("toggleSquad", { squadId: "squad-a", activationEnabled: true }, admin);
  assert.equal(result.ok, true, "toggle on");
  assert.equal(result.squad.status, "online");

  result = await action("createRoutedOrder", { productId: "prod", note: "unbound product" }, customer);
  assert.equal(result.ok, false, "unbound product cannot route");
  assert.equal(result.message, "暂无空闲小队");

  result = await action("saveProductSquads", { productId: "prod", eligibleSquadIds: ["squad-a"] }, admin);
  assert.equal(result.ok, true, "bind product squads");
  assert.deepEqual(result.product.eligibleSquadIds, ["squad-a"]);

  globalThis.__IMPULSE_SQUAD_TEST_EMAILS = [];
  process.env.IMPULSE_SQUAD_EMAIL_THROW_IF_CALLED = "1";
  process.env.IMPULSE_SQUAD_TEST_DURABLE_FAIL_ONCE = "1";
  result = await action("createRoutedOrder", { productId: "prod", note: "durable fail" }, customer);
  assert.equal(result.ok, false, "durable failure blocks routed order");
  assert.equal(result.status, 503, "durable failure returns storage unavailable");
  assert.equal(result.offline, true, "durable failure reports offline storage");
  assert.equal(globalThis.__IMPULSE_SQUAD_TEST_EMAILS.length, 0, "durable failure does not call squad email sender");
  process.env.IMPULSE_SQUAD_EMAIL_THROW_IF_CALLED = "";
  let db = await readDb();
  assert.equal(db.orders.filter((order) => order.note === "durable fail").length, 0, "durable failure leaves no order fact");
  assert.equal(db.emailLogs.filter((entry) => entry.emailType === "squad_routing_assignment").length, 0, "durable failure sends no squad email");
  let list = await action("listSquads", {}, admin);
  assert.equal(list.squads.find((item) => item.id === "squad-a").status, "online", "durable failure leaves squad online");

  result = await action("createRoutedOrder", { productId: "prod", note: "first" }, customer);
  assert.equal(result.ok, true, "successful routed order");
  assert.equal(result.order.status, "processing");
  assert.equal(result.order.price, 99);
  assert.equal(result.order.assignedSquadId, "squad-a");
  assert.equal(result.squad.status, "working");
  assert.equal(result.snapshot.ledger.length, 0, "routed order does not write ledger");
  const firstOrderId = result.order.id;

  result = await action("resendSquadRoutingEmail", { orderId: firstOrderId }, customer);
  assert.equal(result.ok, false, "immediate resend cooldown");
  assert.equal(result.status, 429);

  for (let index = 1; index <= 3; index += 1) {
    process.env.IMPULSE_SQUAD_TEST_NOW = `2026-06-10T01:${String(index * 4).padStart(2, "0")}:00+08:00`;
    result = await action("resendSquadRoutingEmail", { orderId: firstOrderId }, customer);
    assert.equal(result.ok, true, `resend ${index}`);
    assert.equal(result.order.squadResendCount, index);
  }

  process.env.IMPULSE_SQUAD_TEST_NOW = "2026-06-10T01:20:00+08:00";
  result = await action("resendSquadRoutingEmail", { orderId: firstOrderId }, customer);
  assert.equal(result.ok, true, "fourth resend request returns handled cancellation result");
  assert.equal(result.forceLogout, true);
  assert.equal(result.order.status, "cancelled");
  assert.equal(result.squad.status, "online");

  process.env.IMPULSE_SQUAD_EMAIL_TEST_MODE = "fail";
  result = await action("createRoutedOrder", { productId: "prod", note: "email failure" }, customer);
  assert.equal(result.ok, false, "email failure rolls back");
  assert.equal(result.reason, "email-failed");
  db = await readDb();
  assert.ok(db.adminLogs.some((entry) => entry.action === "小队邮件失败回滚" && entry.detail.includes("Forced squad email failure.")), "email failure is auditable");
  assert.ok(db.emailLogs.some((entry) => entry.emailType === "squad_routing_assignment" && entry.status === "failed"), "email failure is logged");
  list = await action("listSquads", {}, admin);
  assert.equal(list.squads.find((item) => item.id === "squad-a").status, "online", "squad restored after email failure");
  assert.equal(list.snapshot.orders.filter((order) => order.note === "email failure").length, 0, "failed order not persisted");

  process.env.IMPULSE_SQUAD_EMAIL_TEST_MODE = "success";
  result = await action("createRoutedOrder", { productId: "prod", note: "complete me" }, customer);
  assert.equal(result.ok, true, "second routed order");
  const secondOrderId = result.order.id;
  result = await action("completeRoutedOrder", { orderId: secondOrderId }, customer);
  assert.equal(result.ok, true, "complete routed order");
  assert.equal(result.order.status, "completed");
  assert.equal(result.squad.status, "online", "completion returns squad online");

  process.env.IMPULSE_SQUAD_TEST_NOW = "2026-06-10T03:00:00+08:00";
  list = await action("listSquads", {}, admin);
  assert.equal(list.ok, true, "daily list");
  assert.equal(list.squadRouting.orderingPaused, true, "daily cutoff pauses ordering");
  assert.equal(list.squads.find((item) => item.id === "squad-a").status, "offline", "daily cutoff offlines online squad");

  result = await action("createRoutedOrder", { productId: "prod" }, customer);
  assert.equal(result.ok, false, "daily paused order fails");
  assert.equal(result.reason, "ordering-paused");

  result = await action("restoreSquadOrdering", {}, admin);
  assert.equal(result.ok, true, "restore ordering");
  assert.equal(result.routing.orderingPaused, false);
  assert.equal(result.squads.find((item) => item.id === "squad-a").status, "online");

  result = await action("createOrder", { productId: "prod", price: 0 }, customer);
  assert.equal(result.ok, false, "old points createOrder remains paused");
  assert.equal(result.reason, "feature-paused");
  assert.equal(result.feature, "points");

  result = await action("saveCatalogItem", {
    type: "category",
    item: {
      id: "cat-user",
      title: "用户分类",
      titleI18n: { en: "User Category", "zh-CN": "用户分类" },
      description: "用户分类",
      descriptionI18n: { en: "User Category", "zh-CN": "用户分类" },
      icon: "fa-solid fa-star"
    }
  }, customer);
  assert.equal(result.ok, false, "customer cannot save catalog items");
  assert.equal(result.status, 403);

  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "customer.png",
    scope: "categories",
    maxBytes: 2 * 1024 * 1024
  }, customer);
  assert.equal(result.ok, false, "customer cannot upload catalog images");
  assert.equal(result.status, 403);

  result = await action("assetStorageHealth", {}, customer);
  assert.equal(result.ok, false, "customer cannot inspect asset storage health");
  assert.equal(result.status, 403);

  result = await action("uploadAsset", {
    dataUrl: oversizedImageDataUrl,
    filename: "too-large.png",
    scope: "categories",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, false, "oversized catalog image upload fails");
  assert.match(result.message, /2MB/);

  result = await action("uploadAsset", {
    dataUrl: unsupportedImageDataUrl,
    filename: "unsupported.svg",
    scope: "categories",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, false, "unsupported catalog image mime fails before storage upload");
  assert.equal(result.status, 415);

  globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE = {};
  process.env.IMPULSE_ASSET_BUCKET_TEST_MODE = "missing";
  result = await action("assetStorageHealth", {}, admin);
  assert.equal(result.ok, false, "missing asset bucket is diagnosed");
  assert.equal(result.assetStorage.classification, "bucket_missing");
  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "created.png",
    scope: "categories",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, true, "missing asset bucket is auto-created before upload");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.metadata.public, true, "created bucket is public");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.metadata.file_size_limit, 5 * 1024 * 1024, "created bucket has 5MB limit");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.method, "POST", "missing bucket uses create endpoint");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.body.id, "impulse-assets", "create bucket payload includes id");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.body.fileSizeLimit, 5 * 1024 * 1024, "create bucket payload uses Storage API fileSizeLimit");
  assert.equal(Array.isArray(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.body.allowedMimeTypes), true, "create bucket payload uses Storage API allowedMimeTypes");

  globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE = {};
  process.env.IMPULSE_ASSET_BUCKET_TEST_MODE = "private";
  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "repaired.png",
    scope: "game-sections",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, true, "private asset bucket is auto-repaired before upload");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.metadata.public, true, "repaired bucket is public");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.metadata.allowed_mime_types.includes("image/jpeg"), true, "repaired bucket allows jpeg");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.metadata.allowed_mime_types.includes("image/png"), true, "repaired bucket keeps png");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.method, "PUT", "existing bucket uses update endpoint");
  assert.equal(Object.prototype.hasOwnProperty.call(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.body, "id"), false, "update bucket payload does not include id");
  assert.equal(Object.prototype.hasOwnProperty.call(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.body, "name"), false, "update bucket payload does not include name");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.body.fileSizeLimit, 5 * 1024 * 1024, "update bucket payload uses Storage API fileSizeLimit");
  assert.equal(Array.isArray(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.body.allowedMimeTypes), true, "update bucket payload uses Storage API allowedMimeTypes");

  globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE = {};
  process.env.IMPULSE_ASSET_BUCKET_TEST_MODE = "open-mime";
  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "open-mime.png",
    scope: "game-sections",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, true, "open-mime bucket is repaired without narrowing mime policy");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.metadata.public, true, "open-mime bucket is made public");
  assert.equal(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.metadata.allowed_mime_types, undefined, "open-mime bucket keeps unrestricted mime policy");
  assert.equal(Object.prototype.hasOwnProperty.call(globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE.lastRequest.body, "allowedMimeTypes"), false, "open-mime update does not narrow unrestricted mime policy");

  globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE = {};
  process.env.IMPULSE_ASSET_BUCKET_TEST_MODE = "forbidden";
  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "forbidden.png",
    scope: "products",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, false, "forbidden asset bucket is classified");
  assert.equal(result.classification, "bucket_forbidden");

  globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE = {};
  process.env.IMPULSE_ASSET_BUCKET_TEST_MODE = "ok";
  result = await action("assetUploadProbe", {}, customer);
  assert.equal(result.ok, false, "customer cannot run asset upload probe");
  assert.equal(result.status, 403);
  result = await action("assetUploadProbe", {}, admin);
  assert.equal(result.ok, true, "admin asset upload probe can pass in test mode");
  process.env.IMPULSE_ASSET_BUCKET_TEST_MODE = "";
  globalThis.__IMPULSE_ASSET_BUCKET_TEST_STATE = {};

  result = await action("saveCatalogItem", {
    type: "category",
    item: {
      id: "cat-local-image",
      title: "本地图分类",
      titleI18n: { en: "Local Image Category", "zh-CN": "本地图分类" },
      description: "本地图分类",
      descriptionI18n: { en: "Local Image Category", "zh-CN": "本地图分类" },
      imageData: tinyImageDataUrl,
      icon: "fa-solid fa-star"
    }
  }, admin);
  assert.equal(result.ok, false, "catalog image base64 is rejected instead of saved locally");
  assert.equal(result.status, 400);

  process.env.IMPULSE_ASSET_UPLOAD_TEST_MODE = "fail";
  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "failed.png",
    scope: "game-sections",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, false, "asset upload failure is reported");
  process.env.IMPULSE_ASSET_UPLOAD_TEST_MODE = "success";

  process.env.IMPULSE_SQUAD_TEST_DURABLE_FAIL_ONCE = "1";
  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "durable-fail.png",
    scope: "game-sections",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, false, "asset upload durable failure is not reported as success");
  assert.equal(result.status, 503);

  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "catalog.png",
    scope: "categories",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, true, "admin can upload catalog image");
  const categoryImageUrl = result.url;

  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "game.png",
    scope: "game-sections",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, true, "admin can upload game section image");
  const gameImageUrl = result.url;

  result = await action("uploadAsset", {
    dataUrl: tinyImageDataUrl,
    filename: "product.png",
    scope: "products",
    maxBytes: 2 * 1024 * 1024
  }, admin);
  assert.equal(result.ok, true, "admin can upload product image");
  const productImageUrl = result.url;

  result = await action("saveCatalogItem", {
    type: "category",
    item: {
      id: "cat-new",
      title: "新分类",
      titleI18n: { en: "New Category", "zh-CN": "新分类" },
      description: "新分类",
      descriptionI18n: { en: "New Category", "zh-CN": "新分类" },
      imageData: categoryImageUrl,
      icon: "fa-solid fa-star"
    }
  }, admin);
  assert.equal(result.ok, true, "admin can save category durably");

  result = await action("saveCatalogItem", {
    type: "game",
    categoryId: "cat-new",
    item: {
      id: "game-new",
      title: "新分区",
      titleI18n: { en: "New Game", "zh-CN": "新分区" },
      description: "新分区",
      descriptionI18n: { en: "New Game", "zh-CN": "新分区" },
      imageData: gameImageUrl,
      platform: "PC",
      platformI18n: { en: "PC", "zh-CN": "端游" },
      icon: "fa-solid fa-gamepad"
    }
  }, admin);
  assert.equal(result.ok, true, "admin can save game section durably");

  result = await action("saveCatalogItem", {
    type: "product",
    gameId: "game-new",
    item: {
      id: "prod-new",
      title: "新商品",
      titleI18n: { en: "New Product", "zh-CN": "新商品" },
      description: "新商品",
      descriptionI18n: { en: "New Product", "zh-CN": "新商品" },
      imageData: productImageUrl,
      price: 123
    }
  }, admin);
  assert.equal(result.ok, true, "admin can save product durably");

  db = await readDb();
  assert.equal(db.categories.some((category) => category.id === "cat-new"), true, "saved category is durable");
  assert.equal(db.categories.find((category) => category.id === "cat-new").imageData, categoryImageUrl, "saved category image is durable");
  assert.equal(db.categories.some((category) => category.id === "cat-local-image"), false, "base64 catalog image is not saved");
  assert.equal((db.games["cat-new"] || []).some((game) => game.id === "game-new"), true, "saved game section is durable");
  assert.equal((db.games["cat-new"] || []).find((game) => game.id === "game-new").imageData, gameImageUrl, "saved game section image is durable");
  assert.equal((db.products["game-new"] || []).some((product) => product.id === "prod-new"), true, "saved product is durable");
  assert.equal((db.products["game-new"] || []).find((product) => product.id === "prod-new").imageData, productImageUrl, "saved product image is durable");

  result = await action("bootstrap", {}, customer);
  assert.equal(result.ok, true, "customer bootstrap after admin catalog save");
  assert.equal(result.snapshot.categories.some((category) => category.id === "cat-new"), true, "customer sees saved category");
  assert.equal(result.snapshot.categories.find((category) => category.id === "cat-new").imageData, categoryImageUrl, "customer sees saved category image");
  assert.equal((result.snapshot.games["cat-new"] || []).some((game) => game.id === "game-new"), true, "customer sees saved game section");
  assert.equal((result.snapshot.games["cat-new"] || []).find((game) => game.id === "game-new").imageData, gameImageUrl, "customer sees saved game section image");
  assert.equal((result.snapshot.products["game-new"] || []).some((product) => product.id === "prod-new"), true, "customer sees saved product");
  assert.equal((result.snapshot.products["game-new"] || []).find((product) => product.id === "prod-new").imageData, productImageUrl, "customer sees saved product image");

  result = await action("bootstrap", {
    snapshot: {
      categories: [{
        id: "cat-stale",
        title: "旧本地分类"
      }],
      games: {
        "cat-stale": [{ id: "game-stale", title: "旧本地分区" }]
      },
      products: {
        "game-stale": [{ id: "prod-stale", title: "旧本地商品", price: 1 }]
      }
    }
  }, customer);
  assert.equal(result.ok, true, "stale customer catalog bootstrap is accepted without catalog import");
  db = await readDb();
  assert.equal(db.categories.some((category) => category.id === "cat-stale"), false, "stale customer category cannot be imported into durable catalog");
  assert.equal(Boolean(db.games["cat-stale"]), false, "stale customer game section cannot be imported into durable catalog");
  assert.equal(Boolean(db.products["game-stale"]), false, "stale customer product cannot be imported into durable catalog");

  result = await action("deleteCatalogItem", { type: "game", categoryId: "cat", id: "game" }, customer);
  assert.equal(result.ok, false, "customer cannot delete catalog items");
  assert.equal(result.status, 403);

  result = await action("deleteCatalogItem", { type: "game", categoryId: "cat", id: "game" }, admin);
  assert.equal(result.ok, true, "admin can delete game section durably");
  db = await readDb();
  assert.equal((db.games.cat || []).some((game) => game.id === "game"), false, "deleted game section is removed from durable games");
  assert.equal(Boolean(db.products.game), false, "deleted game section removes child products");

  result = await action("saveSnapshot", {
    reason: "stale-admin-refresh",
    snapshot: snapshotSeed()
  }, admin);
  assert.equal(result.ok, true, "stale admin saveSnapshot is accepted without catalog restore");
  db = await readDb();
  assert.equal((db.games.cat || []).some((game) => game.id === "game"), false, "stale admin snapshot cannot restore deleted game section");
  assert.equal(Boolean(db.products.game), false, "stale admin snapshot cannot restore deleted child products");

  console.log("Squad routing backend fixture passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
