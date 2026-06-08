#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const coreFile = path.join(__dirname, "..", "api", "_backend-core.js");
const remotePrefixes = ["S" + "UPABASE_", "K" + "V_REST_"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clearRemoteEnv() {
  for (const name in process.env) {
    if (remotePrefixes.some((prefix) => name.startsWith(prefix))) {
      process.env[name] = "";
    }
  }
}

function freshCore() {
  delete require.cache[require.resolve(coreFile)];
  return require(coreFile);
}

function baseState() {
  const now = new Date().toISOString();
  return {
    version: 1,
    users: [
      { username: "NICHOLASQA", email: "nicholasqa@impulse.local", role: "customer", createdAt: now },
      { username: "EMPL001", email: "empl001@impulse.local", role: "staff", createdAt: now }
    ],
    profiles: [
      { id: "060820260000000001", username: "NICHOLASQA", role: "customer", funds: 20, createdAt: now },
      { id: "060820260000000002", username: "EMPL001", role: "staff", funds: 0, createdAt: now }
    ],
    categories: [],
    games: {},
    products: {},
    orders: [{
      id: "order-durable-status",
      status: "pending",
      type: "order",
      customerUsername: "NICHOLASQA",
      handledBy: "",
      acceptedAt: "",
      productTitle: "Durable status order",
      price: 0,
      createdAt: now
    }],
    orderChats: {},
    mailboxMessages: {},
    ledger: [],
    adminLogs: [],
    systemSettings: { backupEmail: "", backupHistory: [] },
    verifications: {},
    emailVerifications: [],
    emailLogs: []
  };
}

function installRemoteState(initial, options = {}) {
  let remote = clone(initial);
  global.fetch = async (url, request = {}) => {
    const method = String(request.method || "GET").toUpperCase();
    if (method === "POST") {
      if (options.writeFails) {
        throw new Error("fetch failed");
      }
      const body = JSON.parse(String(request.body || "{}"));
      remote = clone(body.data || {});
      return {
        ok: true,
        status: 204,
        json: async () => null,
        text: async () => ""
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => [{ data: clone(remote) }],
      text: async () => ""
    };
  };
  return () => clone(remote);
}

async function call(core, action, payload, user = null) {
  return core.handleAction(action, payload, { user, request: {} });
}

async function verifyRemoteWriteFailure() {
  clearRemoteEnv();
  process.env.VERCEL = "1";
  process.env["S" + "UPABASE_URL"] = "https://example.invalid";
  process.env["S" + "UPABASE_SERVICE_ROLE_" + "KEY"] = "test-service-value";
  process.env["S" + "UPABASE_STATE_TABLE"] = "impulse_state";
  process.env.IMPULSE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "impulse-durable-"));
  const initial = baseState();
  const remoteState = installRemoteState(initial, { writeFails: true });
  const core = freshCore();

  const staff = { username: "EMPL001", role: "staff" };
  const customer = { username: "NICHOLASQA", role: "customer" };
  const admin = { username: "ADMIN", role: "admin" };

  const statusResult = await call(core, "updateOrderStatus", {
    orderId: "order-durable-status",
    status: "processing"
  }, staff);
  assert.equal(statusResult.ok, false, "updateOrderStatus must fail when primary write fails");
  assert.equal(statusResult.status, 503, "updateOrderStatus should expose storage unavailable");
  assert.equal(statusResult.offline, true, "updateOrderStatus should be marked offline");
  assert.equal(remoteState().orders[0].status, "pending", "failed primary write must not change remote state");

  const createResult = await call(core, "createOrder", {
    order: {
      id: "order-durable-create",
      type: "order",
      productTitle: "Durable create order",
      price: 0,
      contact: "",
      note: ""
    }
  }, customer);
  assert.equal(createResult.ok, false, "createOrder must fail when primary write fails");
  assert.equal(createResult.status, 503, "createOrder should expose storage unavailable");
  assert.equal(remoteState().orders.some((order) => order.id === "order-durable-create"), false, "failed create must not reach remote state");

  const fundsResult = await call(core, "adjustFunds", {
    profileId: "060820260000000001",
    amountPoints: 5,
    reason: "Durable funds test",
    meta: { type: "manual" }
  }, admin);
  assert.equal(fundsResult.ok, false, "adjustFunds must fail when primary write fails");
  assert.equal(fundsResult.status, 503, "adjustFunds should expose storage unavailable");
  assert.equal(remoteState().profiles.find((profile) => profile.id === "060820260000000001").funds, 20, "failed funds change must not reach remote state");
}

async function verifySnapshotMerge() {
  clearRemoteEnv();
  delete process.env.VERCEL;
  process.env.IMPULSE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "impulse-merge-"));
  global.fetch = undefined;
  const core = freshCore();
  const now = new Date().toISOString();
  const acceptedAt = new Date(Date.now() + 1000).toISOString();
  const oldTime = new Date(Date.now() - 1000).toISOString();

  const seed = await call(core, "bootstrap", {
    snapshot: {
      users: [
        { username: "NICHOLASQA", email: "nicholasqa@impulse.local", role: "customer", createdAt: now },
        { username: "EMPL001", email: "empl001@impulse.local", role: "staff", createdAt: now }
      ],
      profiles: [
        { id: "060820260000000001", username: "NICHOLASQA", role: "customer", funds: 0, createdAt: now },
        { id: "060820260000000002", username: "EMPL001", role: "staff", funds: 0, createdAt: now }
      ],
      orders: [{
        id: "order-merge-accepted",
        status: "processing",
        type: "order",
        customerUsername: "NICHOLASQA",
        handledBy: "EMPL001",
        acceptedAt,
        updatedAt: acceptedAt,
        productTitle: "Server accepted order",
        price: 0,
        createdAt: now
      }],
      orderChats: {
        "order-merge-accepted": [{
          id: "msg-existing",
          sender: "SYSTEM",
          type: "system",
          text: "Accepted",
          createdAt: acceptedAt
        }]
      },
      adminLogs: [{
        id: "log-existing",
        actor: "EMPL001",
        action: "更新订单",
        detail: "order-merge-accepted -> processing",
        createdAt: acceptedAt
      }]
    }
  });
  assert.equal(seed.ok, true, "seed bootstrap should succeed locally");

  const merged = await call(core, "saveSnapshot", {
    reason: "old-client-sync",
    snapshot: {
      orders: [
        {
          id: "order-merge-accepted",
          status: "pending",
          type: "order",
          customerUsername: "NICHOLASQA",
          handledBy: "",
          acceptedAt: "",
          updatedAt: oldTime,
          productTitle: "Old pending order",
          price: 0,
          createdAt: now
        },
        {
          id: "order-merge-new",
          status: "pending",
          type: "order",
          customerUsername: "NICHOLASQA",
          productTitle: "New client order",
          price: 0,
          createdAt: now
        }
      ],
      orderChats: {
        "order-merge-accepted": []
      },
      adminLogs: []
    }
  });
  assert.equal(merged.ok, true, "old snapshot merge should still persist locally");
  const snapshot = merged.snapshot;
  const accepted = snapshot.orders.find((order) => order.id === "order-merge-accepted");
  assert.equal(accepted.status, "processing", "old pending snapshot must not downgrade processing order");
  assert.equal(accepted.handledBy, "EMPL001", "old snapshot must not clear handledBy");
  assert.equal(Boolean(accepted.acceptedAt), true, "old snapshot must not clear acceptedAt");
  assert.equal(snapshot.orderChats["order-merge-accepted"].some((message) => message.id === "msg-existing"), true, "old snapshot must not clear existing chat rows");
  assert.equal(snapshot.adminLogs.some((entry) => entry.id === "log-existing"), true, "old snapshot must not clear existing admin log");
  assert.equal(snapshot.orders.some((order) => order.id === "order-merge-new"), true, "new client orders should still import");
}

(async () => {
  await verifyRemoteWriteFailure();
  await verifySnapshotMerge();
  console.log(JSON.stringify({
    ok: true,
    covered: [
      "primary write failure makes updateOrderStatus fail closed",
      "primary write failure makes createOrder fail closed",
      "primary write failure makes adjustFunds fail closed",
      "old pending snapshot cannot downgrade accepted order",
      "old snapshot cannot clear existing orderChats/adminLogs",
      "new client order still imports"
    ]
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
