# CTO Development Log

Last updated: 2026-06-11
Owner: CTO thread
Project: 夕夕电竞
Workspace: `/Users/nicholas/IMPULSE`
Production: `https://impulse.ccwu.cc`

This file is the CTO-owned master development record. It is intentionally named with the `000_` prefix so it stays near the top of the project folder. Keep this file updated after every important incident, decision, thread rule, release, architecture change, or cross-thread handoff.

## Operating Rule

- CTO is responsible for the most complete development log.
- Every significant event must be recorded here: production incidents, root causes, fixes, deployment IDs, version changes, thread responsibility changes, accepted rules, rejected approaches, and remaining risks.
- This file must preserve a startup package backup so any new thread can be initialized from it.
- This file does not replace `DevelopmentRecords` in `app.js` and `src/legacy/app.js`; those remain the user-facing current version and development log source.
- This file is an internal CTO record and may include process notes, incident history, and coordination decisions.
- Do not record passwords, auth tokens, session tokens, verification codes, API keys, Supabase keys, KV_REST values, or other secrets.

## Current Thread Map

- CTO: total control, decisions, task breakdown, cross-thread coordination, release/no-release decisions, and master log updates.
- Product Planning and Architecture: next major update planning, architecture proposals, scope, milestones, risk analysis, and acceptance standards. No code unless CTO explicitly asks.
- Mail Service: verification email, in-app mailbox, Mail Center, admin mailbox sending/reading, and related backend/frontend fixes.
- Storage: Supabase, persistence, snapshot consistency, durable writes, read-only production data checks, storage health, and data-shape audits.
- Login and Registration: authentication, registration, sessions, password/code login, and account identity.
- Chat Functionality: order chat, Vector Support, Quick Signals, chat permissions, chat UI, and structured chat protocol.
- Test and Regression: real UI/API regression, production checks, version checks, console/network inspection, and residual risk reporting.
- Deployment and Operations: staging approved files, committing, pushing, Vercel production deployment, alias checks, health checks, and post-deploy static checks.
- Review and Comments: formerly "Review and Upload"; now responsible for code review, risk review, version gatekeeping, and adding comments to newly covered code where useful. This thread does not deploy.
- Order and Squad Routing / Admin Console: dedicated implementation owner for the experimental `Squad Routing System / 群聊分流系统`; owns Admin squad management UI, product-to-squad binding, order-to-squad assignment, squad status transitions, and coordination with storage/email/auth/review/test threads.
- Meta thread "Do Not Open This": historical business/product record and early project specification source.

## Global Coordination Rules

- User speaks to CTO by default.
- CTO decides which thread should act.
- Other threads must automatically report back to CTO when they complete, find risk, are blocked, need cross-thread help, or touch release/deployment/production concerns.
- When a task needs multiple threads, CTO may send detailed instructions to all involved threads.
- Threads may recommend handoff to other threads, but CTO remains the final coordinator.
- No thread should silently submit, push, deploy, change production configuration, run production SQL, or delete/clean production data unless CTO explicitly directs it.
- If a thread discovers changes it did not make, it must not revert them unless CTO explicitly requests.
- `.gitignore` currently has an unrelated `.vercel` modification. Do not stage, commit, revert, or rely on it unless CTO explicitly directs.

## Feature Lifecycle Rule

User instruction on 2026-06-10:

- Some existing functions will be temporarily disabled and may be gradually re-enabled in the future.
- Some new functions will be introduced for validation and may later be gradually replaced or retired.

CTO interpretation:

- Features are not simply "present" or "absent"; every meaningful feature should have a lifecycle status.
- Lifecycle statuses:
  - `active`: currently supported and expected to work.
  - `maintenance`: supported only for necessary stability, reading, or compatibility; no expansion.
  - `paused`: visible or preserved in code, but user-facing action is disabled.
  - `experimental`: newly introduced for validation; may change or be removed.
  - `candidate_for_retirement`: still available but planned for replacement/removal.
  - `retired`: disabled or removed from user-facing flow; code may remain temporarily for rollback/history.
- Threads proposing or changing features should state the intended lifecycle status.
- Review and Comments should check whether feature lifecycle status is clear when a feature is disabled, re-enabled, added experimentally, or deprecated.
- Test and Regression should distinguish active functionality from paused/maintenance/experimental functionality.
- Deployment and Operations should not treat preserved-but-paused code as a release failure if CTO intentionally paused it.

Current known lifecycle statuses:

- ADMIN in-app mail sending: `paused` as of `v0.20.8`; code preserved, frontend disabled, backend fail-closed.
- Existing admin/system mailbox reading: `active` but limited to maintenance scope.
- Mail Center broad expansion: `maintenance` / no expansion during Marketplace Transaction Spine update.
- Quick Signals as ordinary quick chat: `candidate_for_retirement` for core transaction flows; ordinary social signals may remain, but high-value signals should move toward workflow events.
- Quick Signals / Order Workflow Events: `experimental` for the upcoming Marketplace Transaction Spine update.
- AI customer support/review/recommendation/matching: deferred; not active for current update.
- Complex BI / operations dashboard: deferred; not active for current update.
- Rule broadcast confirmation:
  - Chat Functionality confirmed.
  - Test and Regression confirmed.
  - Storage confirmed.
  - Mail Service confirmed.
  - Review and Comments confirmed.
  - Deployment and Operations confirmed.
  - Login and Registration confirmed.
  - Pending confirmation: Product Planning and Architecture.

Feature pause order on 2026-06-10:

- User ordered the following features to be temporarily sealed / paused:
  - chat box / Vector Support chat UI,
  - recharge and points system,
  - all point-spending or point-usage related functions,
  - internal mailbox system.
- Required user-facing behavior:
  - corresponding windows/entry points should show `暂未开放`.
  - code should be preserved for future re-enable.
  - features should be treated as paused, not deleted.
- Release gate:
  - implement, review, and test locally only.
  - no production upload/deployment until the user gives the final upload command through CTO.
- Updated lifecycle statuses:
  - Vector Support chat box: `paused`.
  - Chat code and historical data: preserved for future re-enable.
  - Recharge / points top-up: `paused`.
  - Points balance display and any point-spending actions: `paused` unless CTO later defines a read-only exception.
  - Internal Mail Center / mailbox window: `paused`.
  - ADMIN mailbox sending remains `paused`.
  - Mailbox code and historical data: preserved for future re-enable.
- Version strategy:
  - CTO observed concurrent local drafts and set the version sequence:
    - `v0.20.9` Login Entry Prompt / 登录入口提示优化.
    - `v0.20.10` Vector Support Chat Pause / Vector Support 聊天封存.
    - `v0.20.11` Mail Center Pause / 邮件中心封存.
    - `v0.20.12` Points System Pause / 积分系统封存.
  - `app.js` and `src/legacy/app.js` were rechecked by CTO on 2026-06-10 and were synchronized at that moment.
  - Storage was instructed to finish points/recharge pause under `v0.20.12`; points pause code must not remain hidden under the Mail Center version record.
  - Login and Registration was instructed to keep `v0.20.9` Login Entry Prompt unchanged until CTO decides.
- Confirmation:
  - Login and Registration confirmed it will not expand login changes and will wait for version merge/split decision.
  - Review and Comments confirmed it will audit these pause changes as `paused`, not deleted/retired, and will check UI `暂未开放`, code/data preservation, backend fail-closed where needed, comments, version strategy, and no-upload gate.
  - Test and Regression confirmed it will test these features as `paused`: `暂未开放`, fail-closed where applicable, history preserved, and core browsing/login unaffected.
  - Deployment and Operations confirmed these pause changes remain local until the user's final upload command, and will not treat paused entries as release failures.
  - Mail Service completed local `v0.20.11` Mail Center Pause implementation:
    - `Actions.openMailbox()` now hits a top-level `MailCenterPaused` gate.
    - Mail Center / mailbox entry points show `暂未开放 / 内部邮件系统暂时封存。`.
    - Original mailbox UI, `getMailbox`, mailbox data structures, history, and future re-enable path are preserved.
    - `getMailbox` remains `active` within maintenance scope.
    - ADMIN mailbox sending remains `paused` and fail-closed from earlier work.
    - No production upload/deployment, SQL, config change, or data cleanup occurred.
    - Validation passed: frontend harness, backend fixture, `diff -q`, `node --check`, `npm run check`, `npm run build`, and `git diff --check`.
  - Chat Functionality confirmed local `v0.20.10` Vector Support Chat Pause:
    - `app.js` and `src/legacy/app.js` are synchronized.
    - `Actions.openOrderChat(orderId)` gates all frontend chat entry points to `暂未开放` before constructing `OrderChatShell` / `OrderChatPanel`.
    - Backend chat actions `listChatMessages`, `addChatMessage`, `markChatRead`, and `setChatTyping` fail closed with paused lifecycle status before DB read/write.
    - Original chat code, Quick Signals catalog, historical chat data, permission helpers, and future re-enable path are preserved.
    - Chat thread stopped expanding implementation to avoid cross-thread overlap with Mail Center and points pause work.
    - Validation passed: `diff -q`, `node --check`, `npm run check`, `npm run build`, `git diff --check`, and backend action script checks.
  - Review and Comments result for `v0.20.10`:
    - Audit failed with P1 on 2026-06-10.
    - Direct frontend chat entry and direct backend chat actions are gated, but indirect chat writes still exist.
    - `updateOrderStatusOnBackend()` still writes an accepted-order chat system message when status becomes `processing`.
    - Backend may then sync that message via realtime/persisted chat path.
    - Frontend offline fallback `Actions.setOrderStatus()` still calls `Data.addChatMessage(...)` and writes a local "chat enabled" message.
    - Required fix: when chat lifecycle is `paused`, accepting an order must not create new chat records or claim chat is available.
    - Suggested comment: explain that order state may change while chat is paused, but no new chat record should be generated.
  - Chat Functionality completed `v0.20.10` P1 repair:
    - `updateOrderStatusOnBackend()` still allows accepting an order and writing `status=processing`, `handledBy`, and `acceptedAt`.
    - When `VectorSupportChatLifecycle === "paused"`, backend skips the internal `addChatMessage(...)` accepted-order system chat write.
    - `handleAction("updateOrderStatus")` skips chat message persistence/sync while chat is paused.
    - Frontend offline fallback in `Actions.setOrderStatus()` skips `Data.addChatMessage(...)` when `PlatformChat.lifecycle === "paused"`.
    - Old "Chat is now available" / "聊天功能已开启" / "聊天现在可用" wording was removed.
    - Comments were added at the backend and frontend boundary explaining that order state may change while paused chat must not create new chat records or claim chat is available.
    - Direct chat actions still return paused/fail-closed responses.
    - Version remains `v0.20.10`; no new version number was introduced for the repair.
  - Review and Comments re-review result for `v0.20.10` P1:
    - Passed on 2026-06-10.
    - Accepting an order still updates order state to `processing`, `handledBy`, and `acceptedAt`.
    - Chat paused state now prevents new accepted-order chat records.
    - Chat paused state now prevents `persistSupabaseMessages(...)` sync for updateOrderStatus-created chat messages.
    - Frontend offline fallback no longer writes local chat messages when chat is paused.
    - Old "Chat is now available" / "聊天功能已开启" / "聊天现在可用" wording has no remaining matches.
    - Direct chat API gate remains before `readDb()`.
    - Comments are concise and accepted.
  - Pending planning reports: Product Planning and Architecture.
  - Review passed: `v0.20.10` Vector Support Chat Pause P1 repair.
  - Review passed: `v0.20.11` Mail Center Pause.
  - Storage completed local `v0.20.12` Points System Pause:
    - Version sequence is now `v0.20.12`, `v0.20.11`, `v0.20.10`, `v0.20.9`.
    - Recharge / points top-up: `paused`.
    - Points balance-changing writes and points usage: `paused`.
    - Existing `profiles.funds`, `ledger`, historical mailbox reward/claim data, and order history are preserved read-only.
    - Frontend `openRecharge()` now shows a paused notice instead of recharge options.
    - Product detail order/reservation checkout now fails closed with paused messaging; no order is created.
    - Backend and local fallback gates cover `createRechargeClaim`, `claimMailboxReward`, `adjustFunds`, `createOrder`, and fund-writing `updateOrderStatus` paths.
    - Backend paused responses return `status=423`, `reason=feature-paused`, `lifecycle=paused`, `feature=points`.
    - No production data, SQL, config, submission, push, or deployment occurred.
    - Validation passed: `diff -q`, `node --check`, `npm run check`, `npm run build`, `git diff --check`, targeted `rg`, and backend paused regression script.
  - Review and Comments early risk note for `v0.20.12`:
    - `bootstrap/saveSnapshot -> importSnapshot` may still import frontend snapshot `profiles.funds` / `ledger`.
    - This could conflict with the intended `read-only preserved balances/ledger` state while points are paused.
    - Must be judged in the final `v0.20.12` review before testing or release.
  - Pending review: `v0.20.12` Points System Pause.

## Permission Rule Update

User instruction on 2026-06-09:

- All threads are considered to have maximum project authority.
- Permission requests are approved by default and should not be sent to the user.
- If a tool, environment, or system policy still requires an explicit approval or human decision, the question must be addressed only to CTO.
- Threads should not ask ordinary users for permission; they should report the needed action to CTO.

Strengthened user instruction on 2026-06-10:

- All project-level permissions must be treated as continuously approved.
- No thread should pause work to ask the user whether it may proceed with an assigned action.
- If an OS, app, connector, browser, or tool-level permission prompt appears, the thread should treat the project decision as already approved and proceed when technically possible.
- If the thread cannot technically bypass or satisfy the prompt, it must report the exact blocker to CTO only and propose the fastest alternative path.
- Permission prompts must not be routed to the user directly.
- This does not authorize silent production deployment, production SQL, production config changes, data deletion, or cleanup outside the explicit CTO/user release and production-operation gates already recorded in this log.
- Clarification after a Test and Regression permission prompt on 2026-06-10:
  - Tool-level approval popups inside a specialized thread must not be left for the user.
  - If a command would trigger such a popup, the thread must stop or avoid that path and report to CTO.
  - If the popup has already appeared and the thread can still control execution, it should cancel, skip, or stop the approval-requiring path.
  - Use alternatives such as static review, `npm run check`, `npm run build`, `node --check`, jsdom/harness without system browser prompts, curl/static-resource checks, or explicitly report that browser verification is blocked by tool-level approval.
  - A thread may only ask CTO, not the user, to decide whether a browser/system permission is worth resolving.
  - Test and Regression confirmed it stopped the headless Chrome approval path for `v0.20.9` and switched to static / Node DOM-level alternative validation.
- CTO broadcast this strengthened permission rule on 2026-06-10 to:
  - Product Planning and Architecture,
  - Deployment and Operations,
  - Review and Comments,
  - Test and Regression,
  - Storage,
  - Chat Functionality,
  - Mail Service,
  - Login and Registration.
- Confirmed by:
  - Login and Registration.
  - Chat Functionality.
  - Review and Comments.
  - Mail Service.
  - Storage.
  - Deployment and Operations.
  - Test and Regression.
- Pending confirmation:
  - Product Planning and Architecture.

Implementation note:

- This rule governs project process and delegation.
- System/tool-level sandbox or approval mechanics may still exist. If an external approval is technically required, the acting thread reports to CTO instead of asking the user directly.

## Version and Release Rules

- Frontend current version and development log source: `DevelopmentRecords` in both `app.js` and `src/legacy/app.js`.
- `CurrentRelease = DevelopmentRecords[0]`.
- `package.json version` is not the frontend current version source unless CTO explicitly changes that rule.
- Every production code change, hotfix, backend fix, UI/CSS change, or formal feature update must update the top `DevelopmentRecords` entry.
- Default version increment: PATCH.
- MINOR or MAJOR increments require explicit CTO approval.
- Do not reuse released version numbers.
- Draft implementation status: `Local draft, not uploaded / 本地草案，未上传`.
- Production release status: `Uploaded to production / 已上传生产环境`.
- `app.js` and `src/legacy/app.js` must stay synchronized.
- If CSS is touched, `src/styles/main.css` and `styles.css` must stay synchronized unless CTO explicitly changes that requirement.
- Review and Deployment threads must block release if version records are missing, inconsistent, stale, or still marked draft.

## Startup Package Backup

Use this section to initialize any new thread.

Project name: IMPULSE J.

Business:

- Marketplace for game services, game boosting, companionship/voice play, mercenary/order support, account trading, and related gamer services.
- Original site concept from the meta thread: IMPULSE, a gaming service shopping site.

Early design language:

- Gradient background originally specified as `#6a11cb` to `#2575fc`.
- Card-like layout with rounded corners, shadows, padding.
- Consistent typography and color system.
- Buttons, inputs, and interactions should retain a unified style.
- Animation language includes fade-in and slide-like transitions.

Original page hierarchy:

- First-level homepage: four business categories.
- Second-level pages: game sections under each category, such as Arena Breakout mobile/PC and Delta Force mobile/PC.
- Third-level product lists: rows showing product name, price, and detail button.

Original global layout:

- Top navigation includes logo, search, and user area.
- Logo returns home.
- Not logged in: login button.
- Logged in: avatar initials and username.
- Username color was originally required to stay white regardless of mode.
- Footer includes site links such as About Us, Terms, Privacy, Refund Policy, Payment Rules, Points Rules, Dispute Rules, Withdrawal Rules, Help Center.

Mode system:

- Customer mode: default, deep blue/purple visual style, browsing and ordering only, no mode switch.
- Staff/Vector mode: originally orange/yellow, triggered by `EMPL001`; workbench and order handling.
- Admin mode: gray/simple management style, triggered by `ADMIN`; can maintain content and management tools.
- Admin can switch between customer, staff, and admin modes. Staff can switch between customer and staff only. Customer cannot switch.

Original local prototype:

- Pure frontend HTML/CSS/JavaScript.
- Font Awesome 6.4.0.
- Data originally stored in localStorage.
- Important early localStorage keys included users, categories, gameCategories, products.
- Later project evolved to Vercel backend plus Supabase primary storage.

Modern architecture:

- Entry HTML loads `/src/main.js`.
- `/src/main.js` imports `/src/legacy/app.js`.
- Root `app.js` and `src/legacy/app.js` must stay synchronized for compatibility and direct static checks.
- Main backend core lives in `api/_backend-core.js`.
- Styles live in `src/styles/main.css` and `styles.css`.
- Primary storage is Supabase.
- Temporary file fallback exists but must not create false success for critical writes.

Critical release checks:

- `npm run check`
- `npm run build`
- `node --check api/_backend-core.js` when backend changed
- `node --check app.js && node --check src/legacy/app.js`
- `diff -q app.js src/legacy/app.js`
- `diff -q src/styles/main.css styles.css` when CSS involved
- `git diff --check`
- Production health: storage=supabase, primaryStorage=supabase, degraded=false, database.ok=true
- Version record static checks on production `/app.js` and `/src/legacy/app.js`

## Historical Record From Meta Thread

Source: thread "Do Not Open This" (`019e1497-e9c5-72f3-ba39-129fb3866711`), read on 2026-06-09.

Confirmed early requirements:

- Website style should stay consistent across future code.
- Initial category structure: professional coaching, voice play, mercenary, account trading.
- Game sections included Arena Breakout mobile, Arena Breakout PC, Delta Force mobile, Delta Force PC.
- Product list rows should be simple and scannable.
- Admin mode originally supported right-click add/edit/delete on categories, game sections, and products.
- Right-click empty space could create new category, game section, or product.
- Menu dismissal should happen on left click outside.
- Data updates were originally localStorage and immediate re-render.
- Mobile responsive breakpoint around width <= 900px.
- Ordinary customers and logged-out users cannot enter staff/admin tools.

Quick Chat / Quick Signals evolution from meta thread:

- The project spent many iterations making Quick Chat visible, stable, and structured.
- Quick message panel initially suffered from invisibility, compressed height, missing categories, and unclear affordance.
- Fixes included:
  - Dedicated panel below the chat thread.
  - Independent scrolling for chat thread and quick message area.
  - Visible category tabs and message cards.
  - Empty state fallback.
  - Responsive layout so the quick message area remains available on narrow screens.
  - Later cleanup removed excessive instructional text when it cluttered the panel.
- Quick Chat data model evolved from UI text to structured message keys.
- Stable business codes such as `BASIC_READY` and `PROGRESS_ASK_TIME` were introduced to avoid breaking old messages when UI labels or translations change.
- Message reading/writing was extended to preserve `sender_id`, `sender_role`, `message_key`, `message_params`, `message_type`, `action_status`, and metadata.
- Flow-reply lock was introduced so messages requiring fixed replies force the receiver to respond before sending unrelated quick messages.
- System messages became display-only and cannot be manually forged by users.

## Major Incident Log

### Storage/Login Incident

Symptoms:

- User entered correct username/password but could not log in.
- Frontend showed fetch failed or backend storage unavailable symptoms.

Root cause:

- Supabase project was paused or environment URL pointed to a paused/unreachable project.
- DNS returned NXDOMAIN while project was paused.

Actions:

- Storage and deployment threads restored Supabase project/environment.
- Health returned storage=supabase, primaryStorage=supabase, degraded=false.
- Real email verification/login path restored.

Lessons:

- Production health must always be checked before diagnosing UI-only issues.
- Storage degraded state must be visible and treated as a blocking condition for auth/order/mail flows.

### Order Accept and Chat Incident

Symptoms:

- Customer order visible to staff.
- Staff clicking accept/chat had no effect or failed.
- Customer still saw no assigned Vector.
- Accepted orders could not open chat; unaccepted orders showed unavailable chat.

Fix sequence:

- Frontend runtime errors fixed:
  - `messages is not defined`
  - `Components.renderTopbar is not a function`
  - `formatDateTime is not defined`
- Chat access was expanded to recognize camelCase and snake_case order fields.
- `profile.notificationEmail` and `user.email` were removed from chat authorization matching after review found spoofing risk.
- `orderChatAvailable` was changed so stale pending orders with accepted evidence could still open chat.
- Storage investigation found critical `writeDb` fallback false success.
- Durable writes introduced for key mutations.
- `mergeOrders` introduced to prevent stale pending snapshots from downgrading processing/accepted orders.

Test order:

- `order-mq4m97ib-70fcea66` became the main reusable regression sample.

Lessons:

- Critical writes must fail closed if primary storage is unavailable.
- Do not authorize access based on user-editable notification email.
- Snapshot merge logic must not allow stale clients to clear accepted state.
- Real UI/API/storage three-layer regression is required for order/chat flows.

### Mail Center "Open" No Feedback Incident

Symptoms:

- Mail Center chat reminder "Open/前往" closed the mail modal but did not open chat or explain why.

Root cause:

- Old logic closed the mailbox modal before calling `openOrderChat`.
- `openOrderChat` did not return stable success/failure and did not catch render failures.

Fix:

- `openOrderChat` returns structured results.
- Failure paths show toast and keep mailbox detail open.
- Success path replaces mailbox with chat modal.

Lesson:

- Navigation should not destroy current user context before target action succeeds.

### Quick Signals Layout Incidents

Symptoms:

- Quick Signals window too small.
- Category tabs hidden or clipped.
- Redundant explanatory text crowded the panel.

Fixes:

- Expanded modal and quick panel layout.
- Raised Quick Signals minimum height.
- Made grid scrollable.
- Removed visible redundant headers/instructions from active panel.
- Kept tabs and message cards as primary UI.

Versions:

- `v0.20.4` Quick Signals Layout Cleanup.

Lessons:

- Tool panels need stable dimensions and responsive constraints.
- Important controls should not be pushed down by explanatory copy.
- CSS mirror files must stay synchronized.

### Admin Mailbox Sending Incident

Symptoms:

- ADMIN sending in-app mail showed "sent" but customers did not see mail.
- Nicholas repeatedly saw System Mail count 0 in the user's browser.

Fix attempts:

- `v0.20.5` Admin Mail Delivery Fix:
  - Backend counted only actually readable mailbox writes.
  - Admin/deleted recipients excluded.
  - Title/body/expiry limits added.
  - Storage fail-closed added.
  - Frontend offline local fallback success removed.
- Storage thread confirmed production data was actually written to expected mailbox keys.
- `v0.20.6` Admin Mailbox Visibility Fix:
  - Mail Center tried to refresh backend snapshot before rendering.
  - Admin/system sender displayed as administrator.
- User still reproduced failure in original browser.
- `v0.20.7` Mailbox Runtime Refresh Fix:
  - Added dedicated current-user `getMailbox`.
  - Avoided full snapshot hydrate for mailbox rendering.
  - Added sync button.
  - Added stale/invalid session handling.
  - Removed open-mailbox auto-read.
  - Pollution/localStorage test passed in test environment.
- User still reported unresolved issue.
- User decided to temporarily disable ADMIN sending while preserving code.
- `v0.20.8` Admin Mail Sending Pause:
  - Frontend ADMIN send button disabled as maintenance.
  - Backend `sendAdminMailbox` returns maintenance response before DB read/write path.
  - Existing system mail reading remains enabled.

Current status:

- As of this log, `v0.20.8` is deployed by Deployment and Operations.
- Test and Regression has verified customer historical system mail still reads, but admin-authenticated maintenance response needs ADMIN credential if CTO wants full proof.

Lessons:

- Mixed localStorage snapshot, full bootstrap, and production mailbox data created too much uncertainty.
- In-app mailbox/notification architecture needs a deeper redesign.
- Admin broadcast should use a durable delivery/outbox model, not a large shared snapshot object.
- Maintenance switches must exist for unstable admin functions.

## Current Releases of Interest

- `v0.20.4` Quick Signals Layout Cleanup / 快捷消息布局精简.
- `v0.20.5` Admin Mail Delivery Fix / 管理员邮件投递修复.
- `v0.20.6` Admin Mailbox Visibility Fix / 管理员邮件可见性修复.
- `v0.20.7` Mailbox Runtime Refresh Fix / 邮件运行时刷新修复.
- `v0.20.8` Admin Mail Sending Pause / 管理员邮件发送暂停.

## Recent Deployment Records

### v0.20.8 Admin Mail Sending Pause

- Commit: `e414b34081e58999ab0feb65abcff5a2826c8c95`
- Deployment: `dpl_52m37D9cbmfTT9XUC21yjqCtBoGv`
- Deployment URL: `https://impulse-fclurtagb-jianchangnicholaslyus-projects.vercel.app`
- Alias: `https://impulse.ccwu.cc`
- Status: Production / READY
- Purpose: temporarily pause ADMIN in-app mail sending while preserving code and existing mailbox reading.
- Files committed:
  - `api/_backend-core.js`
  - `app.js`
  - `src/legacy/app.js`
- Confirmed excluded:
  - `.gitignore`
  - `src/styles/main.css`
  - `styles.css`
- Production health after deploy:
  - `storage=supabase`
  - `primaryStorage=supabase`
  - `degraded=false`
  - `database.ok=true`
- Test and Regression result:
  - Version/static checks passed.
  - Unauthenticated and customer attempts to send admin mail cannot write.
  - Nicholas can still read historical admin/system mail via `getMailbox`.
  - UI shows historical system mail such as `test`, `测试`, and `你好`; sender is displayed as `管理员`.
  - ADMIN-authenticated UI and direct 423 maintenance response were not fully tested because the test thread did not have a safe ADMIN credential.
  - CTO accepted this as a practical stopgap unless full ADMIN credential testing is later required.

### v0.20.7 Mailbox Runtime Refresh Fix

- Commit: `2842e436b64a94421307d8ea6e57263714ae7d4b`
- Deployment: `dpl_J8CGABhLCCW8xyRQt844CiqxZtLB`
- Purpose: add dedicated `getMailbox`, avoid rendering old mailbox data from localStorage/full bootstrap, add explicit sync and stale-session handling.
- Test and Regression result:
  - Fresh Nicholas UI passed.
  - Polluted localStorage recovery passed in test environment.
  - User still reported unresolved mailbox visibility in their original browser, leading to the decision to pause ADMIN sending instead of continuing patch work.

## Current Operational State

- Production domain: `https://impulse.ccwu.cc`.
- Primary storage: Supabase.
- Expected healthy backend state:
  - `storage=supabase`
  - `primaryStorage=supabase`
  - `degraded=false`
  - `database.ok=true`
  - `primaryError=""`
- ADMIN in-app mail sending is intentionally paused as of `v0.20.8`.
- Existing mailbox reading must remain functional.
- Product Planning and Architecture thread has been created to prepare the next major update.

## External Strategy Advisor Assessment

Date: 2026-06-09.

Source:

- ChatGPT external advisor conversation shared by the user.

Advisor conclusion:

- IMPULSE's largest near-term risk is not pure technology; it is product complexity growing faster than user value.
- The platform already contains customer/vector/admin roles, Mail Center, notifications, Quick Signals, chat permissions, storage health, session handling, Supabase architecture, regression process, and AI-thread coordination.
- This is already close to a mid-size SaaS surface area while the marketplace still needs to prove its core transaction loop.

CTO accepted strategic framing:

- Future work must be judged by whether it improves order conversion, delivery completion, dispute handling, fund safety, or structured service collaboration.
- Features that do not directly improve the transaction loop should be delayed unless they are required for stability or compliance.
- Mail Center should not receive deep feature expansion while admin sending is unstable; keep reading, system notification visibility, and maintenance controls only.
- AI features, complex BI dashboards, and broad admin operations tooling should be deferred until core marketplace transactions are proven.
- Account-trading should be treated as a risk-heavy supporting business, not the first core platform proof point.

Accepted priority split for the next three months:

- Order system stability: 40%.
- Funds and escrow-like flow: 35%.
- Quick Signals productization: 25%.

Core product question:

- Can IMPULSE help strangers complete a game-service transaction safely, efficiently, and with low dispute rate?

Decision:

- The next major update should not be a Mail Center expansion.
- The next major update should be planned around the marketplace transaction spine:
  - order creation,
  - order acceptance,
  - structured order communication,
  - delivery evidence,
  - completion confirmation,
  - fund freeze/release/refund/withdrawal states,
  - dispute handling,
  - regression and observability around these flows.

Metrics to introduce or track:

- Order metrics: order creation success rate, accept rate, completion rate.
- Service metrics: average response time, average delivery time, dispute rate.
- Fund metrics: recharge conversion, refund rate, withdrawal success rate.
- Collaboration metrics: Quick Signals usage rate and whether Quick Signals reduce disputes or support burden.

ChatGPT bridge rule:

- ChatGPT may be used as an external advisor for strategy, product evaluation, and risk critique.
- ChatGPT does not directly command execution threads.
- User may paste ChatGPT advice into CTO.
- CTO decides whether to record it, convert it into plans, or dispatch it to specialized threads.

Advisor-led update decision:

- User decided the next major update will be led by the external advisor.
- CTO remains responsible for execution governance, thread dispatch, release gating, and master-log updates.
- Product Planning and Architecture thread has been instructed to pause final planning until advisor direction returns.
- Advisor output should focus on product direction, scope control, priorities, risks, acceptance criteria, and what not to build.
- Advisor must not write code, request secrets, directly command execution threads, or bypass CTO.
- Because this is a large update, no production upload/deployment may happen until all CTO-issued task instructions for the update are complete and the user explicitly orders upload/deployment.
- Threads may prepare plans, code, tests, review notes, and release candidates, but Deployment and Operations must not upload/deploy the large update without the user's final release order through CTO.

Advisor formal strategy received:

- Date: 2026-06-09.
- Status: accepted by CTO as the strategic baseline for the next major update.
- One-line strategic goal: prove that IMPULSE can help strangers complete a full game-service transaction with low dispute rate, traceability, and escrow-like fund safety.
- This update is not about increasing feature count; it is about validating the marketplace transaction spine.
- Priority split:
  - Order system: 40%.
  - Funds / escrow-like flow: 30%.
  - Quick Signals / workflow events: 20%.
  - Other modules: 10%.
- Mail Center remains maintenance-only:
  - historical mail reading,
  - system notification visibility,
  - no deep mailbox workflow expansion.
- AI features are deferred:
  - AI customer support,
  - AI review,
  - AI recommendation,
  - AI matching.
- Complex admin/BI/operations systems are deferred.
- Notification scope is limited to transaction-relevant notifications:
  - order changes,
  - disputes,
  - fund state changes.
- Account trading remains a business entry but is not a focus of this update due to high policy and dispute risk.

Advisor-approved transaction paths:

- Customer:
  - create order,
  - pay points,
  - funds freeze,
  - wait for Vector,
  - Vector accepts,
  - service execution,
  - delivery notification,
  - confirm completion,
  - funds release,
  - order completed.
- Vector:
  - browse orders,
  - accept order,
  - start service,
  - send progress,
  - submit delivery,
  - wait for confirmation,
  - become eligible for settlement,
  - request withdrawal.
- Admin:
  - only intervenes for disputes, refunds, abnormal accounts, abnormal orders, or fund anomalies.
  - Admin should not participate in normal orders.

Advisor-approved order states:

- `pending`: customer creates order, funds freeze, chat unavailable, audit required.
- `processing`: Vector accepts, funds stay frozen, chat and Quick Signals open, audit required.
- `delivered`: Vector submits delivery, funds stay frozen, chat open, audit required.
- `awaiting_confirmation`: system or workflow marks delivery ready for customer confirmation, funds stay frozen, chat open, audit required.
- `completed`: customer confirms or auto-confirm triggers, funds release, chat becomes read-only, audit required.
- `disputed`: either side starts dispute, funds enter dispute hold, only dispute-relevant messaging allowed, audit required.
- `refunded`: admin refunds, funds return to customer, chat closes, audit required.
- `cancelled`: cancellation before acceptance, funds return to customer, no chat thread, audit required.

Advisor-approved funds states:

- `available`: customer spendable balance.
- `frozen`: funds frozen after order creation.
- `disputed_hold`: funds locked during dispute, cannot release or withdraw.
- `releasable`: order completed and funds can be credited/released to Vector.
- `withdraw_pending`: Vector requested withdrawal and is awaiting processing.
- `withdrawn`: withdrawal completed.
- `refunded`: refund completed.

Quick Signals strategy:

- Quick Signals should graduate from quick chat to Order Workflow Events.
- Core workflow events should remain limited, roughly 20-40 important events, to avoid becoming enterprise-style process bloat.
- High-value workflow events:
  - I have started.
  - Estimated remaining time is X days.
  - I need more information.
  - Extension requested.
  - Completed, please confirm.
  - Dispute initiated.
- Low-value social phrases such as hello, thanks, received, or good night stay as ordinary chat-like signals and do not become workflow events.
- Workflow events can become dispute evidence when they alter responsibility, deadline, delivery, confirmation, or dispute state.

Data and architecture principles:

- Must be durable write and fail closed:
  - order creation,
  - accepting an order,
  - delivery submission,
  - completion,
  - dispute creation,
  - refund,
  - fund state changes.
- UI state, drafts, filters, and page preferences may be cache only.
- Mandatory audit:
  - order status changes,
  - money changes,
  - permission changes,
  - Admin actions,
  - Quick Signal workflow events.
- `localStorage` must never be the source of truth for:
  - orders,
  - wallet/funds,
  - chat permissions,
  - fund states.

Advisor-approved acceptance standards:

- API: correct state transitions and illegal transition rejection.
- UI: backend state and UI state match after refresh.
- Network: disconnect/retry and duplicate submit behavior are safe.
- Storage: durable write is verified and there is no false success.
- Console: no unhandled errors.
- Version Records: synchronized and complete.
- Production Health: storage=supabase, primaryStorage=supabase, degraded=false, database.ok=true.

Advisor risk decisions:

- Account trading: later, not a focus now.
- Boosting/service disputes: now, core risk.
- Fund risk: now, must be prioritized.
- Feature bloat: control now.
- Quick Signals over-complexity: control now; keep only core workflow events.

## Next Major Update Planning Direction

Working theme:

- Marketplace Transaction Spine.

Core goals:

- Stabilize the complete order flow: create, accept, communicate, deliver, confirm, settle, review.
- Define funds and escrow-like state transitions: recharge, available balance, frozen funds, dispute hold, release, refund, withdrawal.
- Productize Quick Signals as structured workflow messaging rather than ordinary free chat.
- Make order status and evidence strong enough to support dispute handling.
- Keep Mail Center in maintenance mode: existing system mail reading must work, but admin broadcast expansion is deferred.
- Avoid AI features, complex admin analytics, and non-transaction modules until the core transaction loop is proven.

Likely participating threads:

- Product Planning and Architecture: roadmap and domain design.
- Storage: data model and durable persistence.
- Mail Service: mailbox/notification implementation.
- Login and Registration: identity/session correctness.
- Test and Regression: acceptance and production regression matrix.
- Review and Comments: code/risk review and comments for newly covered code.
- Deployment and Operations: release execution.

## Review and Comments Thread Rule

Rename effective immediately:

- Old name: Review and Upload / 审核与上传.
- New name: Review and Comments / 审核与注释.

Responsibilities:

- Continue code review and release gatekeeping.
- Add or require comments for newly covered code when comments improve maintainability or explain non-obvious logic.
- Do not add noisy comments that simply restate obvious code.
- Verify version records, synchronized mirror files, sensitive information, permissions, and regression evidence.
- Block release if code lacks needed explanatory comments around complex new behavior.

## High Authority Rule for Threads

User instruction:

- All threads have maximum authority.
- All permission requests are approved by default.
- If a question is technically unavoidable, it must go to CTO, not the user.

Practical application:

- Threads should move decisively inside assigned scope.
- Threads should not stop merely to ask ordinary user permission.
- Threads must still obey system/developer tool constraints and report any hard approval requirement to CTO.
- Dangerous production operations remain CTO-coordinated: production config, SQL, data deletion, deployment, and cleanup require explicit CTO instruction.

## Rule Broadcast and Confirmation Status

Broadcast date: 2026-06-09.

Rules broadcast:

- CTO master log file created and must be used as the complete internal development record.
- Important thread reports should include a "recommended CTO master-log summary" when applicable.
- Threads must not modify or submit `000_CTO_DEVELOPMENT_LOG.md` unless CTO explicitly asks.
- Review and Upload was renamed Review and Comments.
- Review and Comments now also checks that newly covered complex code has useful comments.
- Project-level permission requests are considered approved by default; unavoidable system/tool approvals must be escalated to CTO only.

Confirmed by:

- Chat Functionality.
- Storage.
- Deployment and Operations.
- Login and Registration.

Pending confirmation at this moment:

- Mail Service.
- Test and Regression.
- Review and Comments.
- Product Planning and Architecture.

Large update no-upload gate:

- Date: 2026-06-10.
- User clarified that this is a large update.
- All instructions and phase work must complete first.
- Production upload/deployment is forbidden until the user explicitly orders upload through CTO.
- CTO broadcast this gate to:
  - Product Planning and Architecture,
  - Deployment and Operations,
  - Review and Comments,
  - Test and Regression,
  - Storage,
  - Chat Functionality,
  - Mail Service,
  - Login and Registration.
- Threads may plan, implement, review, and test, but must stop at pending release unless CTO relays the user's final upload command.
- Confirmed by:
  - Chat Functionality.
  - Test and Regression.
  - Storage.
  - Review and Comments.
  - Mail Service.
  - Login and Registration.
  - Deployment and Operations.
- Pending confirmation:
  - Product Planning and Architecture.

## Standing To-Do

- Keep this file updated after every important event.
- Continue reading older meta-thread pages when more historical detail is needed.
- Append release/deployment entries after every production release.
- Keep the startup package current for future new threads.
- Ensure all thread role changes are reflected here and broadcast to affected threads.

## Active Local Tasks

### Admin Catalog Persistence Fix

- Date requested: 2026-06-11.
- Requested by user.
- Release version: `v0.20.15`.
- Version title: `Admin Catalog Persistence Fix / 管理目录持久化修复`.
- Status: `Uploaded to production / 已上传生产环境`.
- Reported issue:
  - In Admin mode, deleting an entire game section appeared to work, but refreshing restored the section.
  - Follow-up report: Admin edits to categories, game sections, and products were not visible to other users after save; other users continued seeing the previous catalog state.
  - The `可用小队` Admin section should no longer require the secondary password.
- Root cause:
  - Catalog create/edit/delete operations were performed through frontend local data helpers or generic snapshot sync, then later backend bootstrap/snapshot merge could keep or restore the durable server copy instead of publishing the Admin change to all users.
  - The Squad admin section used the same secondary password gate as other Admin sections.
- Local implementation summary:
  - Added an admin-only backend `saveCatalogItem` action for categories, game sections, and products.
  - Saving a category, game section, or product now persists durably before the Admin UI reports success.
  - Added an admin-only backend `deleteCatalogItem` action for categories, game sections, and products.
  - Deleting a game section also deletes its child product list durably.
  - Frontend Admin save, delete, and batch-delete flows now call backend actions and do not claim local success if durable persistence fails.
  - `可用小队` is marked as no-secondary-password and opens directly; other Admin sections keep their password gate.
  - `scripts/verify-squad-routing.js` now covers non-admin save/delete rejection, durable category/game/product saving visible through another user bootstrap, and durable game-section deletion.
- Release gate:
  - User clarified this was a hotfix and should be completed automatically after repair.
  - The hotfix upload gate was lifted for `v0.20.15` on 2026-06-11.

### Chinese-Only Light Edition Branding

- Date requested: 2026-06-11.
- Requested by user.
- Release version: `v0.20.14`.
- Version title: `Chinese Light Edition Branding / 中文轻度版品牌切换`.
- Status: `Uploaded to production / 已上传生产环境`.
- Core decisions:
  - Language mode is disabled / paused.
  - The product keeps Simplified Chinese only.
  - Visible brand changes from `IMPULSE J` to `夕夕电竞`.
  - Versions before the current large update are now defined as `满血版`.
  - Versions after the current large update are now defined as `轻度版`.
- Implementation summary:
  - `DefaultLanguage` is now `zh-CN`.
  - Supported local language list is reduced to Simplified Chinese.
  - The language selector is removed from user and guest menus.
  - The legacy language selector function is retained only as a paused fallback window showing `暂未开放`.
  - Google Translate is not loaded while language mode is paused.
  - `index.html` title, loader, search placeholder, topbar wordmark, footer, and document language are switched to Chinese / `夕夕电竞`.
  - Frontend title and current-version surfaces show `夕夕电竞 - 轻度版` and include a `版本形态` field.
  - New outgoing system sender defaults use `夕夕电竞系统`.
  - Legacy `IMPULSE J System` sender recognition remains for old records.
  - Squad Routing transactional email copy is switched to Chinese brand wording.
- Version boundary definition:
  - `v0.20.8` and earlier production releases are treated as `满血版`.
  - `v0.20.9` and later large-update local drafts are treated as `轻度版`.
- Release gate:
  - User gave the final upload command on 2026-06-11.
  - The large-update no-upload gate was lifted for this release package only.
  - This release package includes the light-edition sequence from `v0.20.9` through `v0.20.14`.

### Squad Routing System

- Date requested: 2026-06-10.
- Requested by user.
- Lifecycle status: `experimental`.
- Strategic interpretation:
  - This is a replacement/bridge workflow while internal chat, Mail Center, and points flows are paused.
  - It routes new customer orders to external QQ/WeChat squads instead of relying on the internal chat box.
  - It must be designed as part of the Marketplace Transaction Spine, not as a Mail Center expansion.
- User-facing concept:
  - Admin management console gains a `可用小队` button.
  - Admin can view squad list:
    - squad name,
    - squad members,
    - squad group number,
    - squad business/project scope,
    - squad active time.
  - Admin can add a squad:
    - name,
    - exactly three members,
    - first member is captain,
    - group number,
    - group type: QQ group or WeChat group,
    - activation toggle.
  - Activated squad is `online`; deactivated squad is `offline`.
  - Squads also have `working` state.
  - New/edit product/service item must include `可接单小队` selection; clicking opens all squads and allows selection.
  - On customer order creation, system auto-assigns an online eligible squad.
  - Customer receives real email:
    - order acceptance notice,
    - assigned squad group number,
    - group type QQ/WeChat,
    - instruction to screenshot and send it to the group.
  - After 180 seconds, customer may request the email again.
  - Maximum resend attempts: three.
  - After three resend requests, order is force-cancelled and a popup says `系统繁忙请重新登录`; clicking confirm auto-logs out.
  - If no online squad is available at order time, show `暂无空闲小队`.
  - Every day at 02:00, new orders stop.
  - At 02:00, all `online` squads become `offline`.
  - Squads in `working` become `offline` after their assigned order is completed.
  - Customer completes an order from the order list by clicking a completion button; order auto-completes, and the squad state changes according to the above rules.
- Open interpretation item:
  - User used `单目`; CTO currently interprets this as product/service item until user clarifies otherwise.
- Release gate:
  - Plan, implement, review, and test locally only.
  - No production upload/deployment until user gives final upload command through CTO.
- Initial next step:
  - Product Planning and Architecture must produce a full product/architecture spec before implementation begins.
- Product Planning and Architecture full specification received:
  - The system is an `experimental` external communication routing layer while Vector Support Chat, Mail Center, and points flows are paused.
  - It uses Admin-maintained squads and QQ/WeChat group numbers to route customer orders to external groups.
  - It does not re-enable internal chat, Mail Center, ADMIN in-app mail sending, or points usage.
  - "单目" is provisionally interpreted as product/service item, but CTO/user confirmation is required.
  - Squad model proposal:
    - `id`,
    - `name`,
    - `members` exactly 3,
    - `captain = members[0]`,
    - `groupType = qq | wechat`,
    - `groupNumber`,
    - `businessProjects / supportedItemIds`,
    - `activeTime`,
    - `activationEnabled`,
    - `status = online | offline | working`,
    - `currentOrderId`,
    - timestamps and audit fields.
  - Squad state machine:
    - `offline -> online` when Admin activates and no current order exists.
    - `online -> offline` when Admin deactivates or daily 02:00 offline rule runs.
    - `online -> working` when an order is assigned.
    - `working -> offline` after customer closes/completes the assigned order.
    - First phase should not allow `working -> online` directly.
  - Product/service item rule:
    - new/edit item must select eligible squads.
    - multi-select is recommended.
    - item without eligible squads should not be orderable.
  - Assignment rule:
    - backend checks eligible squads at order submission.
    - eligible means item-supported, activation enabled, status online, no current order.
    - first-phase selection should use least-recently-assigned.
    - no online eligible squad fails closed with `暂无空闲小队`.
  - Real email rule:
    - email is sent immediately after successful squad assignment.
    - email contains order, service, squad, group type, group number, and screenshot-to-group instruction.
    - recipient should be the customer's registered email.
    - send attempts, success/failure, order, user, and timestamp require audit.
    - resend available only after 180 seconds.
    - maximum total send attempts: 3.
    - three-attempt cancellation/logout behavior requires CTO/user confirmation.
  - Daily 02:00 rule:
    - use server-side Asia/Shanghai time.
    - online squads go offline.
    - working squads are not interrupted; after completion they become offline.
    - recovery time is undefined and requires CTO/user decision.
    - first phase may use lazy backend enforcement plus Admin UI correction instead of a scheduler.
  - Completion rule:
    - customer closes/completes from order/detail area.
    - assigned/processing/delivered-like states may complete.
    - completion records the event and moves squad from working to offline.
    - while points are paused, no real fund release, payout, or points mutation occurs.
  - Security risks:
    - group number leakage,
    - privacy risk from screenshots,
    - resend/email abuse,
    - external group chat is not auditable,
    - three-resend force logout may hide real system errors and requires confirmation.
  - MVP scope:
    - Admin squad CRUD,
    - squad activation/status,
    - item-to-squad binding,
    - backend assignment,
    - real email notification,
    - resend cooldown/count,
    - customer completion,
    - audit logs,
    - fail closed rules.
  - Explicitly not MVP:
    - internal chat re-enable,
    - Mail Center re-enable,
    - points payment/release,
    - AI review,
    - complex scheduling/load balancing,
    - group message ingestion.
  - Product Planning recommends creating a dedicated implementation thread:
    - `订单与小队分流 / 管理后台`.
  - CTO decisions required before implementation:
    - whether `单目` means product/service item or order line,
    - daily 02:00 stop-order recovery time,
    - whether to keep three-resend force cancel + forced logout,
    - whether points-paused phase allows zero-point/no-payment orders,
    - whether initial email failure rolls back assignment or creates a notification-failed order state,
    - whether WeChat groups need text-only group number or QR/image support,
    - whether first phase forbids direct `working -> online`.
  - CTO/user decisions received on 2026-06-10:
    - `单目` means product/service item.
    - After the 02:00 stop-order/offline rule, recovery must be manual by Admin; there is no automatic recovery window.
    - Points are disabled; newly created orders should not be related to points.
    - Group number is a numeric identifier format.
    - After customer completion, squad status remains / returns to `online`, not `offline`.
    - Other open items follow CTO default recommendations:
      - three resend attempts then force-cancel order, show `系统繁忙请重新登录`, confirm then auto-logout;
      - initial email send failure rolls back assignment/order creation and shows a busy/retry message;
      - first phase uses text group number only, no QR/image support.
  - Implementation organization decision:
    - Dedicated thread created: `订单与小队分流 / 管理后台`.
    - Thread ID: `019eb220-dc25-7803-8466-368cf08e0391`.
    - CTO will send a full startup packet and implementation instruction before that thread edits code.
  - Local implementation status on 2026-06-10:
    - Version: `v0.20.13 Squad Routing System / 群聊分流系统`.
    - Status: `Local draft, not uploaded / 本地草案，未上传`.
    - Lifecycle status: `experimental`.
    - Modified local files:
      - `api/_backend-core.js`,
      - `app.js`,
      - `src/legacy/app.js`,
      - `scripts/verify-squad-routing.js`.
    - Admin console now has the `可用小队` management path for squad list, create/edit, activation, and manual order-recovery control.
    - Product/service item editing now uses durable product-to-squad binding through `可接单小队`; product binding is the only eligibility source.
    - Customer checkout uses routed order creation instead of the old points order path; points, recharge, and points usage remain `paused`.
    - Routed order creation stages order and squad assignment durably before sending the real email; durable failure does not send email, and email failure rolls back the order/squad assignment.
    - Resend rules are implemented as 180-second cooldown, maximum three sends, then force-cancel + `系统繁忙请重新登录` + logout flow.
    - Customer completion completes the order and releases the squad back to `online`; no points settlement occurs.
    - 02:00 Asia/Shanghai stop-order rule sets `orderingPaused=true` and moves current online squads offline; Admin must restore manually.
    - CTO accepted the P2 state semantics that a working squad completed after 02:00 may become `online`, while `orderingPaused=true` still blocks all new orders until Admin restore.
    - Snapshot boundary:
      - frontend snapshots do not upload `squads` / `squadRouting`;
      - backend import strips client-provided squad routing, product squad binding, and order routing fields;
      - localStorage is not a source of truth for squad routing.
    - Paused features remain paused:
      - Vector Support Chat,
      - Mail Center,
      - ADMIN in-app mail sending,
      - points/recharge/points usage.
  - Review and Comments result on 2026-06-10:
    - Review passed, no P0/P1 blockers.
    - Version record and app/legacy synchronization passed.
    - Product binding, snapshot stripping, durable-before-email, rollback, resend, completion, 02:00 stop-order, and paused feature boundaries passed.
    - Non-blocking P2 note: later implementation cleanup may add short comments around durable-before-email, rollback, and snapshot stripping.
    - Conclusion: may enter Test and Regression, still forbidden to upload/deploy.
  - Test and Regression result on 2026-06-10:
    - Stage result: passed locally / in fixtures.
    - Scope:
      - local Node/static/backend fixture checks,
      - no production touch,
      - no real email delivery,
      - no system/headless browser path that triggers permission prompts.
    - Commands passed:
      - `diff -q app.js src/legacy/app.js`,
      - `diff -q src/styles/main.css styles.css`,
      - `node --check api/_backend-core.js`,
      - `node --check app.js`,
      - `node --check src/legacy/app.js`,
      - `node --check scripts/verify-squad-routing.js`,
      - `node scripts/verify-squad-routing.js`,
      - `npm run check`,
      - `npm run build`,
      - `git diff --check -- api/_backend-core.js app.js src/legacy/app.js src/styles/main.css styles.css scripts/verify-squad-routing.js`.
    - Backend fixture output: `Squad routing backend fixture passed`.
    - Covered scenarios:
      - Admin squad CRUD/toggle/restore,
      - product squad binding,
      - no online squad / offline squad / unbound product fail-closed,
      - routed order without ledger/funds/recharge writes,
      - durable failure before email,
      - email failure rollback,
      - resend cooldown and three-send force logout,
      - customer completion to squad `online`,
      - 02:00 ordering pause and Admin restore,
      - paused chat/mail/points/admin-mail regressions.
    - Residual risks:
      - real browser click-through UI not verified,
      - real email delivery not verified,
      - production not verified because this is still a local draft.
    - Conclusion: can enter CTO decision queue only; no upload/commit/push/deploy is authorized.

### Login Entry Prompt Optimization

- Date assigned: 2026-06-10.
- Assigned thread: Login and Registration.
- Local implementation completed: 2026-06-10.
- User request: when a visitor is not logged in and opens the homepage, the login modal should automatically appear so a new user sees the login window immediately.
- Scope:
  - frontend login-entry experience only,
  - no backend auth logic changes,
  - no password/session/token/security bypass,
  - login modal remains closable,
  - avoid repeated auto-popup loops in the same page lifecycle,
  - logged-in Customer / Vector / Admin sessions must not auto-popup.
- Version expectation:
  - local draft version `v0.20.9`.
  - title: `Login Entry Prompt / 登录入口提示优化`.
  - status: `Local draft, not uploaded / 本地草案，未上传`.
- Release gate:
  - local implementation, review, and testing are allowed.
  - no upload/deployment until CTO relays the user's final upload command.
- Implementation summary:
  - `Auth.open(initialMode, options)` now supports an automatic prompt close callback.
  - `HomeLoginPrompt` tracks in-memory `dismissed` and `scheduled` state.
  - The prompt opens only when no user is logged in, route is `home`, no modal is open, and the prompt has not been dismissed in the current page lifecycle.
  - `App.render()` schedules the prompt after base render using `requestAnimationFrame`.
  - `Session.logout()` resets the prompt so logging out back to home can show it again.
  - Customer / Vector / Admin existing sessions do not auto-popup.
- Login and Registration validation:
  - `diff -q app.js src/legacy/app.js` passed.
  - `node --check app.js` passed.
  - `node --check src/legacy/app.js` passed.
  - `npm run check` passed.
  - `npm run build` passed.
  - `git diff --check -- app.js src/legacy/app.js` passed.
  - Browser validation passed for fresh anonymous home, close-without-repeat, Nicholas, EMPL001, ADMIN, login success, logout prompt reset, register switch, and email-code login switch.
- Next step:
  - Test and Regression should validate the behavior before any release decision.
- Review and Comments result:
  - Audit passed on 2026-06-10.
  - Status remains `Local draft, not uploaded / 本地草案，未上传`.
  - Conclusion: may enter Test and Regression, but still waits for CTO/user final upload command.
  - Confirmed no backend authentication, password, verification-code, session, or token safety logic was changed.
  - Confirmed no modal loop, render loop, route-switch misfire, or logged-in-user auto-popup path was found.
  - No mandatory comment返修 was required.
- Test and Regression result:
  - Stage result: partial pass / staged pass on 2026-06-10.
  - Large update no-upload gate remains active.
  - Fresh anonymous homepage auto-popup passed in local browser validation.
  - Closing the login modal prevents repeated auto-popup in the same page lifecycle.
  - Account/password login path passed with a local Nicholas test profile.
  - Logged-in Customer, Vector, and Admin states do not auto-popup.
  - Logout/reset back to home triggers the prompt again.
  - Register tab and email-code-login tab were validated by static / Node-level assertions after the headless Chrome permission path was stopped.
  - No target console errors were found for the validated paths.
  - Residual risk: real browser visual validation for register/email-code tab switching was not continued after tool-level approval prompts were banned.
  - Test thread left a localhost `4173` Python static server running because its tool path could not kill it without system-level friction; CTO checked and killed PID `59967` directly on 2026-06-10.
