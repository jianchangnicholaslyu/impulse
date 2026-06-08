#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "impulse-chat-access-"));
process.env.IMPULSE_DATA_DIR = dataDir;
const remotePrefixes = ["S" + "UPABASE_", "K" + "V_REST_"];
for (const name in process.env) {
  if (remotePrefixes.some((prefix) => name.startsWith(prefix))) {
    process.env[name] = "";
  }
}

const { handleAction } = require("../api/_backend-core");

const now = new Date().toISOString();
const customer = { username: "NICHOLASQA", role: "customer" };
const acceptedStaff = { username: "EMPL001", role: "staff" };
const otherStaff = { username: "EMPL002", role: "staff" };
const customerMailAttacker = { username: "ATTACKER_CUSTOMER_MAIL", role: "customer" };
const staffMailAttacker = { username: "ATTACKER_STAFF_MAIL", role: "customer" };
const victimCustomerMail = "victim@example.com";
const victimStaffMail = "vector-victim@example.com";

async function call(action, payload, user = null) {
  return handleAction(action, payload, { user, request: {} });
}

async function expectOk(label, action, payload, user) {
  const result = await call(action, payload, user);
  assert.equal(result.ok, true, `${label}: expected ok=true, got ${JSON.stringify(result)}`);
  return result;
}

async function expectDenied(label, action, payload, user) {
  const result = await call(action, payload, user);
  assert.equal(result.ok, false, `${label}: expected ok=false, got ${JSON.stringify(result)}`);
  return result;
}

function quickPayload(orderId, catalogValue = "BASIC_READY") {
  return {
    orderId,
    type: "quick_message",
    ["catalog" + "Key"]: catalogValue
  };
}

async function expectAllChatActionsDenied(label, orderId, user) {
  await expectDenied(`${label}: list`, "listChatMessages", { orderId }, user);
  await expectDenied(`${label}: send`, "addChatMessage", quickPayload(orderId), user);
  await expectDenied(`${label}: mark read`, "markChatRead", { orderId }, user);
  await expectDenied(`${label}: typing`, "setChatTyping", { orderId, isTyping: true }, user);
}

async function main() {
  await call("bootstrap", {
    snapshot: {
      users: [
        { username: customer.username, email: "nicholasqa@impulse.local", role: "customer", createdAt: now },
        { username: otherStaff.username, email: "empl002@impulse.local", role: "staff", createdAt: now },
        { username: customerMailAttacker.username, email: "attacker-customer-mail@impulse.local", role: "customer", createdAt: now },
        { username: staffMailAttacker.username, email: "attacker-staff-mail@impulse.local", role: "customer", createdAt: now }
      ],
      profiles: [
        { username: customer.username, role: "customer", funds: 0, notificationEmail: "nicholasqa@impulse.local", createdAt: now },
        { username: otherStaff.username, role: "staff", funds: 0, notificationEmail: "empl002@impulse.local", createdAt: now },
        { username: customerMailAttacker.username, role: "customer", funds: 0, notificationEmail: victimCustomerMail, createdAt: now },
        { username: staffMailAttacker.username, role: "customer", funds: 0, notificationEmail: victimStaffMail, createdAt: now }
      ],
      orders: [
        {
          id: "order-processing-empl001",
          status: "processing",
          customer_username: customer.username,
          handled_by: acceptedStaff.username,
          accepted_at: now,
          productTitle: "Chat access snake_case order",
          price: 0,
          createdAt: now
        },
        {
          id: "order-processing-empl002",
          status: "processing",
          customerUsername: customer.username,
          handledBy: otherStaff.username,
          acceptedAt: now,
          productTitle: "Chat access other staff order",
          price: 0,
          createdAt: now
        },
        {
          id: "order-pending-unaccepted",
          status: "pending",
          customerUsername: customer.username,
          handledBy: "",
          acceptedAt: "",
          productTitle: "Pending chat unavailable order",
          price: 0,
          createdAt: now
        },
        {
          id: "order-email-customer-spoof",
          status: "processing",
          customer_username: victimCustomerMail,
          handled_by: acceptedStaff.username,
          accepted_at: now,
          productTitle: "Notification email customer spoof order",
          price: 0,
          createdAt: now
        },
        {
          id: "order-email-staff-spoof",
          status: "processing",
          customerUsername: customer.username,
          handled_by: victimStaffMail,
          accepted_at: now,
          productTitle: "Notification email staff spoof order",
          price: 0,
          createdAt: now
        }
      ]
    }
  });

  await expectOk("accepted staff can list snake_case handled order", "listChatMessages", { orderId: "order-processing-empl001" }, acceptedStaff);
  await expectOk("accepted staff can send snake_case handled order", "addChatMessage", quickPayload("order-processing-empl001"), acceptedStaff);
  await expectDenied("unassigned staff cannot list another staff order", "listChatMessages", { orderId: "order-processing-empl002" }, acceptedStaff);
  await expectDenied("unassigned staff cannot send another staff order", "addChatMessage", quickPayload("order-processing-empl002"), acceptedStaff);
  await expectOk("matching customer can list processing order", "listChatMessages", { orderId: "order-processing-empl001" }, customer);
  await expectOk("matching customer can send processing order", "addChatMessage", quickPayload("order-processing-empl001", "BASIC_WAIT_5"), customer);
  await expectDenied("pending customer cannot open available chat thread", "listChatMessages", { orderId: "order-pending-unaccepted" }, customer);
  await expectDenied("pending staff cannot open available chat thread", "listChatMessages", { orderId: "order-pending-unaccepted" }, acceptedStaff);
  await expectAllChatActionsDenied("notification email matching customer field cannot grant access", "order-email-customer-spoof", customerMailAttacker);
  await expectAllChatActionsDenied("notification email matching staff field cannot grant access", "order-email-staff-spoof", staffMailAttacker);

  console.log(JSON.stringify({
    ok: true,
    dataDir,
    covered: [
      "processing handled_by=EMPL001 allows EMPL001 list/send",
      "processing handledBy=EMPL002 rejects EMPL001 list/send",
      "customer_username/customerUsername match allows customer list/send",
      "pending unaccepted order rejects available chat for customer and staff",
      "notificationEmail spoof rejects list/send/markRead/typing"
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
