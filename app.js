(() => {
  "use strict";

  const Keys = {
    users: "users",
    categories: "categories",
    games: "gameCategories",
    products: "products",
    orders: "orders",
    orderChats: "orderChats",
    mailboxMessages: "mailboxMessages",
    profiles: "userProfiles",
    ledger: "ledger",
    adminLogs: "adminLogs",
    systemSettings: "systemSettings",
    currentUser: "currentUser",
    currentMode: "currentMode",
    backendToken: "backendToken",
    language: "siteLanguage",
    staffLog: "staffLog",
    dataVersion: "impulseDataVersion"
  };

  const BuiltInUsers = [
    { username: "ADMIN", email: "admin@impulse.local", password: "********", role: "admin" },
    { username: "EMPL001", email: "empl001@impulse.local", password: "12345678", role: "staff" }
  ];

  const AdminSections = [
    { id: "users", title: "用户", password: "yonghu", icon: "fa-solid fa-users", description: "Gamer / Vector 账户、资金、封禁与注销管理。" },
    { id: "orders", title: "订单", password: "dingdan", icon: "fa-solid fa-receipt", description: "统一检索充值单、消费单与兑现单。" },
    { id: "ledger", title: "账本", password: "zhangben", icon: "fa-solid fa-chart-line", description: "实时资金流水与统计参考。" },
    { id: "logs", title: "日志", password: "rizhi", icon: "fa-solid fa-clipboard-list", description: "记录后台与关键业务操作。" }
  ];

  const Modes = {
    customer: "Gamer 模式",
    staff: "Vector 模式",
    admin: "管理模式"
  };

  const StatusLabels = {
    pending: "待处理",
    processing: "进行中",
    completed: "已完成",
    cancelled: "已取消"
  };

  const OrderTypeLabels = {
    order: "订单",
    reservation: "预约"
  };

  const RechargeOptions = [1, 15, 50, 100, 300];
  const PointsPerDollar = 1;
  const RushFeeRate = 0.15;
  const ReturnRefundRate = 0.25;
  const ReturnWindowMs = 60 * 60 * 1000;
  const OnlineWindowMs = 5 * 60 * 1000;
  const ChatRetentionMs = 14 * 24 * 60 * 60 * 1000;
  const DisplayImageMaxBytes = 2 * 1024 * 1024;
  const UserIdPattern = /^\d{18}$/;
  const DefaultLanguage = "en";
  const LocalLanguageCodes = ["en", "zh-CN"];
  const LocalContentLanguageCodes = ["en", "zh-CN"];
  const BrandName = "IMPULSE J";
  const BrandTagline = "Driven by Gamers' Momentum";
  const RoleDisplayNames = {
    customer: "Gamer",
    staff: "Vector",
    admin: "Admin"
  };
  const ControllingLanguageNotice = "English is the controlling language for all legal, payment, refund, dispute, withdrawal, and official communication terms. Any translation is provided for convenience only and does not modify the English terms.";
  const ProtectedTranslationSelector = ".notranslate, [translate='no'], .policy-document, .official-communication, .financial-value, .status-value, .order-locked-term, [data-no-machine-translate='true']";
  const LegalInfoPages = ["terms", "privacy", "refund", "payment", "points", "dispute", "withdrawal"];
  const LegalInfoContent = {
    terms: {
      title: "Terms of Service",
      intro: `These Terms of Service govern access to and use of ${BrandName}. The English version controls all rights, duties, account rules, purchases, refunds, disputes, and platform communications.`,
      sections: [
        ["Service Scope", `${BrandName} provides a marketplace-style interface for game coaching, companion play, order coordination, account listing workflows, and related digital services. Some features may remain simulated or pending backend expansion until officially launched.`],
        ["Accounts", `Users are responsible for accurate account information, account security, and all activity performed through their account. ${BrandName} may restrict, suspend, or terminate accounts for fraud, abuse, payment risk, policy violations, or security concerns.`],
        ["Orders", "Orders, reservations, chats, and operational records are handled according to the displayed English order terms, payment rules, refund rules, dispute rules, and withdrawal rules."]
      ]
    },
    privacy: {
      title: "Privacy Policy",
      intro: `This Privacy Policy describes how ${BrandName} handles account, order, payment, communication, and operational data. The English version controls.`,
      sections: [
        ["Data We Process", `${BrandName} may process account identifiers, email addresses, profile fields, order records, wallet or point balance records, chat messages, uploaded images, system logs, and support records needed to operate the service.`],
        ["Purpose", "Data is used for authentication, account safety, order fulfillment, payment and refund handling, dispute review, support, anti-abuse controls, compliance, and service improvement."],
        ["Retention", "Chat records are intended to be retained for 14 days. System logs and order-number records are intended to be retained for 30 days, then archived or removed according to the active operational policy."]
      ]
    },
    refund: {
      title: "Refund Policy",
      intro: "This Refund Policy applies to point refunds, order cancellations, failed assignments, return requests, rush requests, and dispute outcomes. The English version controls.",
      sections: [
        ["Unassigned Orders", "If an order is not accepted before the user-selected auto-cancel deadline, the order may be cancelled and the full point amount may be returned to the customer balance."],
        ["Accepted Orders", "After an order is accepted, return eligibility depends on the displayed return window, service progress, evidence, dispute findings, and the applicable English order terms."],
        ["Rush Fees", "Rush fees may be non-refundable unless the English rush terms, breach terms, or dispute decision state otherwise."]
      ]
    },
    payment: {
      title: "Payment Rules",
      intro: "These Payment Rules govern point purchases, customer spending, tips, rush fees, staff withdrawals, charge records, and financial adjustments. The English version controls.",
      sections: [
        ["Points", "Points are a platform balance unit. Unless a specific promotion or rule states otherwise, 1 USD equals 1 point."],
        ["Non-Negative Balance", "A customer balance cannot go below zero. If the balance is insufficient, the user must recharge before placing or modifying the order."],
        ["Records", "Every balance change should create a ledger record showing the amount, direction, reason, related order number, actor, and time."]
      ]
    },
    points: {
      title: "Points Rules",
      intro: "These Points Rules explain point balances, recharges, spending, manual corrections, tips, refunds, and account reviews. The English version controls.",
      sections: [
        ["Balance", `Available points represent the user balance shown inside ${BrandName}. Manual corrections require administrator authorization and should be logged.`],
        ["Use", "Points may be spent on eligible orders, reservations, rush requests, tips, and other enabled platform services."],
        ["Review", `${BrandName} may review point activity for fraud, abuse, error, or disputed transactions and may adjust records according to the English policy terms.`]
      ]
    },
    dispute: {
      title: "Dispute Rules",
      intro: "These Dispute Rules govern reports, evidence review, service complaints, refund decisions, staff penalties, and final dispute conclusions. The English version controls.",
      sections: [
        ["Reports", "Gamers may report service issues through the provided report flow. Reports should include a clear description, timing, evidence, and the related order number."],
        ["Review", "Administrators may review order records, chat history, uploaded evidence, staff activity, payment records, and prior account history."],
        ["Decision", "Dispute outcomes may include no action, warning, partial refund, full refund, staff compensation adjustment, account restriction, or other operational remedies stated in English."]
      ]
    },
    withdrawal: {
      title: "Withdrawal Rules",
      intro: "These Withdrawal Rules govern staff cash-out requests, review, approval, rejection, timing, and notices. The English version controls.",
      sections: [
        ["Eligibility", "Withdrawals may require completed orders, available staff balance, identity or risk review, and compliance with internal payout rules."],
        ["Review", `${BrandName} may delay, reject, or adjust a withdrawal request if records are incomplete, disputed, suspicious, or inconsistent with the English rules.`],
        ["Notices", "Withdrawal requested, approved, and rejected notices are official communications and are sent in English."]
      ]
    }
  };
  const ContentTextFields = ["title", "description", "platform", "duration", "badge"];
  const GenderOptions = [
    { value: "unset", label: "未设置" },
    { value: "female", label: "女" },
    { value: "male", label: "男" },
    { value: "nonbinary", label: "非二元" },
    { value: "private", label: "保密" }
  ];
  const EmailNoticeTypes = [
    { key: "rechargeSuccess", label: "充值成功", subject: "Recharge successful" },
    { key: "orderSuccess", label: "下单成功", subject: "Order placed successfully" },
    { key: "orderAccepted", label: "接单成功", subject: "Your order has been accepted" },
    { key: "serviceReminder", label: "服务提醒", subject: "Service reminder" },
    { key: "progressReminder", label: "进度提醒", subject: "Progress update" },
    { key: "completionRequest", label: "结单请求", subject: "Completion request" },
    { key: "rushReply", label: "加急回复", subject: "Rush request update" },
    { key: "completionSuccess", label: "结单成功", subject: "Order completed" },
    { key: "returnSuccess", label: "退单成功", subject: "Order return completed" }
  ];
  const MailboxCategories = [
    { id: "all", label: "全部邮件", icon: "fa-solid fa-inbox" },
    { id: "system", label: "系统邮件", icon: "fa-regular fa-envelope" },
    { id: "security", label: "安全邮件", icon: "fa-solid fa-shield-halved" },
    { id: "orders", label: "订单邮件", icon: "fa-solid fa-receipt" },
    { id: "funds", label: "资金通知", icon: "fa-solid fa-coins" },
    { id: "chat", label: "聊天提醒", icon: "fa-regular fa-comments" }
  ];
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

  const DevelopmentRecords = [
    // AI: top item = next release draft. Do not mark Uploaded or push until user explicitly says upload.
    {
      version: "v0.19.0",
      releasedAt: "2026-05-17",
      nameI18n: localizedPair("Account Role and Mailbox", "账户角色与邮件中心"),
      statusI18n: localizedPair("Local draft, not uploaded", "本地草案，未上传"),
      summaryI18n: localizedPair(
        "Renames customer-facing users as Gamer, staff users as Vector, and adds a permanent in-app mailbox for account notifications.",
        "将 Gamer 与 Vector 作为用户角色专用名，并新增不可关闭的账户站内邮件中心。"
      ),
      itemsI18n: [
        localizedPair("Updated account menus, mode labels, admin user views, order chat labels, and operational prompts to use Gamer and Vector.", "更新账户菜单、模式名称、管理员用户视图、订单聊天标签和业务提示中的 Gamer / Vector 称呼。"),
        localizedPair("Changed the staff-application entry into a Become a Vector flow.", "将成为 Vector 入口改为 Become a Vector 流程。"),
        localizedPair("Added translation protection for role terms so machine translation does not rewrite Gamer or Vector.", "为角色专用名加入翻译保护，避免机器翻译改写 Gamer 或 Vector。"),
        localizedPair("Restricted admin user details and manual exports to safe account fields so plaintext passwords are never displayed.", "将管理员用户详情和手动导出限制为安全账户字段，避免展示明文密码。"),
        localizedPair("Simplified the Gamer current-version dialog by hiding release name and upload status outside admin views.", "精简 Gamer 当前版本弹窗，在非管理员视图中隐藏版本名称和上传状态。"),
        localizedPair("Added a three-column in-app mailbox beside the account avatar for system notices and chat-message alerts.", "在账户头像左侧新增三栏站内邮件弹窗，用于同步系统通知与聊天新消息提醒。")
      ]
    },
    {
      version: "v0.18.0",
      releasedAt: "2026-05-17",
      nameI18n: localizedPair("Release Log Refinement", "开发日志精简"),
      statusI18n: localizedPair("Local draft, not uploaded", "本地草案，未上传"),
      summaryI18n: localizedPair(
        "Refines version visibility so account menus stay concise while administrators can inspect detailed release notes on demand.",
        "精简账户版本展示，同时让管理员按需查看更完整的版本细节。"
      ),
      itemsI18n: [
        localizedPair("Simplified the account current-version dialog by removing update-detail bullets from the default account flow.", "精简账户当前版本弹窗，从默认账户流程中移除更新细节列表。"),
        localizedPair("Changed the admin development log to show only version number, release theme, summary, and date in each list entry.", "将管理员开发日志列表改为每条仅显示版本号、主题、概要和日期。"),
        localizedPair("Moved detailed release notes into a dedicated modal opened from each development-log entry.", "将版本细节移动到每条开发日志点开后的独立弹窗中。"),
        localizedPair("Expanded release details with a more operational structure covering delivery scope, platform impact, and deployment notes.", "以交付范围、平台影响和部署备注的结构扩展版本细节，使其更加专业。")
      ]
    },
    {
      version: "v0.17.0",
      releasedAt: "2026-05-17",
      nameI18n: localizedPair("Brand Refresh", "品牌焕新"),
      statusI18n: localizedPair("Local draft, not uploaded", "本地草案，未上传"),
      summaryI18n: localizedPair(
        "Renames the visible brand to IMPULSE J and introduces the new driven-by-gamers tagline.",
        "将可见品牌名更新为 IMPULSE J，并引入新的玩家动能副标题。"
      ),
      itemsI18n: [
        localizedPair("Changed the top-left wordmark to a Roman-style IMPULSE plus a larger handwritten J.", "将左上角文字标识改为罗马体 IMPULSE 加更大号手写体 J。"),
        localizedPair("Updated the site subtitle to Driven by Gamers' Momentum.", "将站点副标题更新为 Driven by Gamers' Momentum。"),
        localizedPair("Synced visible account, about, title, footer, legal, and official email brand mentions to IMPULSE J.", "将账户、关于、标题、页脚、法律和官方邮件中的可见品牌名同步为 IMPULSE J。"),
        localizedPair("Kept the icon mark as a pending placeholder for the later logo decision.", "保留图标标识为待定占位，等待后续 Logo 决策。")
      ]
    },
    {
      version: "v0.16.0",
      releasedAt: "2026-05-17",
      nameI18n: localizedPair("Loading Experience", "加载体验"),
      statusI18n: localizedPair("Local draft, not uploaded", "本地草案，未上传"),
      summaryI18n: localizedPair(
        "Adds a branded animated loading layer that appears before the first interface render is complete.",
        "新增品牌化动态加载层，在首轮界面渲染完成前显示。"
      ),
      itemsI18n: [
        localizedPair("Added an immediate full-screen loading layer in the HTML shell.", "在 HTML 外壳中加入立即显示的全屏加载层。"),
        localizedPair("Added a continuously jumping IMPULSE J loading mark and staggered dot animation.", "新增持续跳跃的 IMPULSE J 加载标识和错峰圆点动画。"),
        localizedPair("Automatically fades the loading layer out after app initialization and first render.", "应用初始化和首轮渲染完成后自动淡出加载层。"),
        localizedPair("Added reduced-motion support so animation can pause for users who prefer less motion.", "加入减少动态效果支持，尊重用户的系统动效偏好。")
      ]
    },
    {
      version: "v0.15.0",
      releasedAt: "2026-05-17",
      nameI18n: localizedPair("Resend Email Foundation", "Resend 邮件基础"),
      statusI18n: localizedPair("Current production build", "当前生产版本"),
      summaryI18n: localizedPair(
        "Adds the server-only Resend email foundation and sets a clear English-control boundary for legal, payment, dispute, withdrawal, and official communication terms.",
        "新增仅服务端执行的 Resend 邮件基础，并为法律、支付、争议、提现和官方通信条款建立明确的英文控制边界。"
      ),
      itemsI18n: [
        localizedPair("Added a unified server-side Resend email module and branded transactional templates.", "新增统一的服务端 Resend 邮件模块和品牌事务邮件模板。"),
        localizedPair("Added email verification, magic-link, password-reset, notification, and email health API routes.", "新增邮箱验证码、魔法链接、密码重置、通知发送和邮件健康检查接口。"),
        localizedPair("Verification codes now expire in 5 minutes, are stored only as hashes, and include request rate limits.", "验证码现在 5 分钟过期，仅以哈希保存，并加入请求频率限制。"),
        localizedPair("Locked the legacy send-email endpoint behind the backend secret so clients cannot send arbitrary email.", "将旧邮件发送入口改为后端密钥保护，避免客户端任意发信。"),
        localizedPair("Legal, payment, refund, dispute, withdrawal, and point-rule pages now remain English-only and protected from machine translation.", "法律、支付、退款、争议、提现和积分规则页面现在保持仅英文，并防止机器翻译覆盖。"),
        localizedPair("Official email templates remain English-only and carry no-translate protection in the rendered message body.", "官方邮件模板保持仅英文，并在渲染邮件正文中加入禁止翻译保护。"),
        localizedPair("Language selection now explains that English controls legal and official communication terms.", "语言选择界面现在说明英文为法律和官方通信条款的控制语言。"),
        localizedPair("Removed the internal process section from the current-version dialog.", "从当前版本弹窗移除内部流程说明区块。"),
        localizedPair("Improved admin edit-mode button contrast for add, batch, select, and clear actions.", "提升管理员编辑模式中新增、批量、全选和清空选择等按钮的文字对比度。"),
        localizedPair("Kept version number, release name, date, status, and update details visible.", "保留版本号、版本名称、发布时间、上传状态和更新详情。")
      ]
    },
    {
      version: "v0.14.1",
      releasedAt: "2026-05-16",
      nameI18n: localizedPair("Contrast Legibility Hotfix", "对比度可读性热补丁"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Improves text contrast across release dialogs, settings panels, staff mode, and admin mode while preserving the existing IMPULSE visual identity.",
        "提升版本弹窗、设置面板、Vector 模式和管理模式中的文字对比度，同时保留现有 IMPULSE 视觉风格。"
      ),
      itemsI18n: [
        localizedPair("Changed the current-version hero from white-on-white to a high-contrast brand gradient.", "将当前版本头部从白字白底改为高对比品牌渐变。"),
        localizedPair("Replaced low-contrast muted text on light panels with the darker ink-muted token.", "将浅色面板上的低对比说明文字改为更深的 ink-muted 色值。"),
        localizedPair("Darkened Vector and admin mode gradient endpoints so white interface text remains readable.", "加深 Vector 和管理模式渐变末端，保证白色界面文字仍然清晰。")
      ]
    },
    {
      version: "v0.14.0",
      releasedAt: "2026-05-16",
      nameI18n: localizedPair("Architecture Bridge", "主流架构桥接"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Introduces a Vite-based application entry, keeps the current IMPULSE interface intact, and prepares Supabase asset storage plus a normalized data model plan.",
        "引入基于 Vite 的应用入口，保持当前 IMPULSE 界面一致，并准备 Supabase 资产存储和正规化数据模型方案。"
      ),
      itemsI18n: [
        localizedPair("Added a modern build entry while preserving the legacy root files for local fallback.", "新增现代构建入口，同时保留根目录旧文件作为本地打开兜底。"),
        localizedPair("Display images can use Supabase Storage when configured, with base64 local data as a fallback.", "展示图片在配置 Supabase Storage 后可使用对象存储，否则继续以本地 base64 数据兜底。"),
        localizedPair("Prepared database normalization documentation without destructively migrating the existing JSON state.", "准备数据库正规化文档，但不破坏性迁移现有 JSON 状态。")
      ]
    },
    {
      version: "v0.13.0",
      releasedAt: "2026-05-16",
      nameI18n: localizedPair("Conversation Retention Draft", "对话与归档保留草案"),
      statusI18n: localizedPair("Local draft, not uploaded", "本地草案，未上传"),
      summaryI18n: localizedPair(
        "Prepares smoother order chat interactions, administrator editing toolbars, batch content management, and retention backup policies.",
        "筹备更流畅的订单聊天体验、管理员编辑工具条、批量内容管理和归档备份策略。"
      ),
      itemsI18n: [
        localizedPair("Order chat is redesigned around grouped message bubbles, date separators, image previews, and clearer read state.", "订单聊天改为分组气泡、日期分隔、图片预览和更清晰的已读状态。"),
        localizedPair("Admin edit mode now supports visible add buttons and batch selection while keeping right-click menus.", "管理员编辑模式在保留右键菜单的同时，新增可见新增按钮和批量选择。"),
        localizedPair("Game sections and products can now carry editable display images with a 2MB upload limit.", "游戏分区和商品现在可以编辑展示图片，并限制单张不超过 2MB。"),
        localizedPair("Chat messages older than 14 days are automatically removed from active storage.", "超过 14 天的聊天消息会自动从活跃存储中移除。"),
        localizedPair("System logs and closed order records older than 30 days are only deleted after a JSON backup package is emailed to the configured archive address.", "超过 30 天的系统日志和已关闭单号仅在 JSON 备份包发送到指定归档邮箱后才会删除。")
      ]
    },
    {
      version: "v0.12.1",
      releasedAt: "2026-05-16",
      nameI18n: localizedPair("Bootstrap Preservation Hotfix", "启动数据保护热修复"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Ensures existing browser-local accounts and orders are merged into Supabase during app startup instead of being overwritten by an already-initialized database.",
        "确保启动网站时会把浏览器本地已有账号和订单合并进 Supabase，避免被已初始化数据库覆盖。"
      ),
      itemsI18n: [
        localizedPair("Bootstrap now performs a non-destructive snapshot merge for persistent storage.", "启动流程现在会对持久化存储执行非破坏性快照合并。"),
        localizedPair("Older browser-local accounts can be carried into Supabase after the database is connected.", "数据库接通后，旧浏览器本地账号也能被带入 Supabase。"),
        localizedPair("This hotfix reduces data-loss risk during the transition from localStorage to Supabase.", "该热补丁降低从 localStorage 迁移到 Supabase 时的数据丢失风险。")
      ]
    },
    {
      version: "v0.12.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Supabase Persistence", "Supabase 持久化"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Adds Supabase Postgres as the primary persistent backend store while keeping KV and local file fallbacks.",
        "新增 Supabase Postgres 作为主要持久化后端存储，同时保留 KV 和本地文件兜底。"
      ),
      itemsI18n: [
        localizedPair("Backend storage now uses Supabase first when server-side environment variables are configured.", "配置服务端环境变量后，后端会优先使用 Supabase 存储。"),
        localizedPair("Added a Supabase SQL setup script and deployment guide.", "新增 Supabase SQL 建表脚本和部署说明。"),
        localizedPair("Snapshot imports now merge existing records to avoid accidental account and order loss.", "快照导入改为合并已有记录，避免误删账户和订单。")
      ]
    },
    {
      version: "v0.11.2",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Non-Destructive Data Sync", "非破坏性数据同步"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Protects existing local accounts, balances, orders, chats, and logs from being overwritten by incomplete temporary backend snapshots after updates.",
        "保护更新前已有的本地账户、余额、订单、聊天和日志，避免被不完整的临时后端快照覆盖。"
      ),
      itemsI18n: [
        localizedPair("Temporary backend snapshots now merge into local data instead of replacing it.", "临时后端快照现在会合并进本地数据，而不是直接覆盖。"),
        localizedPair("Local-only users and profiles are preserved across deployments and hotfixes.", "部署和热补丁后会保留本地已有用户和资料。"),
        localizedPair("Persistent KV storage remains the recommended production source of truth.", "正式生产环境仍建议使用持久化 KV 作为数据源。")
      ]
    },
    {
      version: "v0.11.1",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Checkout State Sync Hotfix", "下单状态同步热修复"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Fixes checkout failures when Vercel temporary storage does not yet have the customer's local profile and balance.",
        "修复 Vercel 临时存储未同步 Gamer 本地资料和余额时导致的下单失败。"
      ),
      itemsI18n: [
        localizedPair("Sends a safe frontend snapshot with recharge and checkout requests when persistent KV is not configured.", "在未配置持久化 KV 时，充值和下单请求会携带安全的前端快照作为兜底。"),
        localizedPair("The backend imports the snapshot before state-dependent mutations only in non-KV mode.", "后端仅在非 KV 模式下，在依赖状态的变更前导入快照。"),
        localizedPair("Checkout errors now show the backend's specific message instead of only a generic failure.", "下单失败时优先显示后端具体原因，不再只显示泛化失败。")
      ]
    },
    {
      version: "v0.11.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Versioned Release Log", "版本化开发日志"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Adds a visible current-version entry and an admin-only development log from the avatar menu.",
        "在头像菜单加入当前版本入口，并为管理员加入开发日志。"
      ),
      itemsI18n: [
        localizedPair("Added Current Version to guest and user avatar menus.", "在访客和已登录用户的头像菜单中新增当前版本。"),
        localizedPair("Added an admin-only Development Log entry with full release history.", "在管理员头像菜单中新增开发日志，展示往期所有开发记录。"),
        localizedPair("Upgraded the avatar menu with account summaries and release metadata.", "优化头像菜单，加入账户摘要与版本元信息。")
      ]
    },
    {
      version: "v0.10.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Backend Foundation", "后端基础版"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Introduced the backend API layer for authentication, verification codes, funds, orders, chats, and server-side snapshots.",
        "引入后端 API 层，承接认证、验证码、资金、订单、聊天和服务端快照。"
      ),
      itemsI18n: [
        localizedPair("Added a unified /api/backend endpoint with local-file and KV storage adapters.", "新增统一的 /api/backend 接口，支持本地文件和 KV 存储适配。"),
        localizedPair("Moved core account, order, recharge, and chat mutations to backend-first calls.", "将账户、订单、充值和聊天的核心变更改为优先走后端。"),
        localizedPair("Added Resend-based email delivery support with safe local demo fallback.", "加入基于 Resend 的邮件发送支持，并保留安全的本地演示兜底。")
      ]
    },
    {
      version: "v0.9.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Account Center", "账户中心"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Expanded user profiles, settings, avatars, registration fields, notification preferences, and bilingual editable content.",
        "扩展用户资料、设置、头像、注册信息、通知偏好和中英文可编辑内容。"
      ),
      itemsI18n: [
        localizedPair("Added user info, account security, contact settings, Vector application, and sign-out settings.", "新增用户信息、账户安全、联系设置、成为 Vector 和退出登录设置。"),
        localizedPair("Added image avatar upload with a 5 MB limit and circular crop preview.", "新增不大于 5MB 的头像上传与圆形截取预览。"),
        localizedPair("Required English and Simplified Chinese content for new categories, sections, and products.", "新增分类、分区和商品时要求分别填写英文和简体中文。")
      ]
    },
    {
      version: "v0.8.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Deployment Baseline", "部署基线"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Prepared the project for GitHub, Vercel, and the impulse.ccwu.cc custom domain.",
        "完成 GitHub、Vercel 与 impulse.ccwu.cc 自定义域名部署准备。"
      ),
      itemsI18n: [
        localizedPair("Initialized Git workflow, .gitignore, and deployment checks.", "完善 Git 流程、.gitignore 和部署检查。"),
        localizedPair("Connected the GitHub repository and Vercel production deployment.", "连接 GitHub 仓库与 Vercel 生产部署。"),
        localizedPair("Guided DNS records for the custom domain.", "完成自定义域名 DNS 记录配置指导。")
      ]
    },
    {
      version: "v0.7.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Email Auth", "邮箱认证"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Refined sign-in with password login and email-code login options.",
        "优化登录界面，支持账户密码登录和邮箱验证码登录。"
      ),
      itemsI18n: [
        localizedPair("Added email-based sign-in and six-digit verification flows.", "新增邮箱登录与六位验证码流程。"),
        localizedPair("Kept password sign-in available as an alternate login method.", "保留账户密码登录作为可选方式。")
      ]
    },
    {
      version: "v0.6.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Order Funds & Chat", "订单资金与聊天"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Added point-based checkout, recharge options, auto-return, order chat, read state, and Gamer order actions.",
        "新增积分下单、充值档位、自动退单、订单聊天、已读状态与 Gamer 订单操作。"
      ),
      itemsI18n: [
        localizedPair("Added 1:1 USD-to-points recharge options.", "新增美元与积分 1:1 的充值档位。"),
        localizedPair("Added Gamer-to-Vector chat with text and image messages.", "新增 Gamer 与 Vector 之间可发送文字和图片的订单聊天。"),
        localizedPair("Added rush, return, report, and tip actions requiring account verification.", "新增加急、退单、举报和小费操作，并要求账户验证。")
      ]
    },
    {
      version: "v0.5.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Admin Operations", "管理运营台"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Built admin sections for users, orders, ledger, and operation logs with secondary passwords.",
        "建立用户、订单、账本、日志四个管理分区，并加入二级密码。"
      ),
      itemsI18n: [
        localizedPair("Added Gamer and Vector user management views.", "新增 Gamer 与 Vector 用户管理视图。"),
        localizedPair("Added order search, ledger records, operation logs, and clear-log action.", "新增订单检索、账本流水、操作日志和一键清空日志。")
      ]
    },
    {
      version: "v0.4.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Global Language Layer", "多语言层"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Added language selection, local English/Simplified Chinese translations, and Google Translate fallback.",
        "新增语言选择、本地英文和简体中文翻译，以及 Google Translate 兜底。"
      ),
      itemsI18n: [
        localizedPair("Protected names such as IMPULSE and account names from translation.", "保护 IMPULSE 和账户名称等专用名不被翻译。"),
        localizedPair("Separated local UI translations from editable content translation.", "区分结构性本地翻译和可编辑内容翻译。")
      ]
    },
    {
      version: "v0.3.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Production Polish", "可用化打磨"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Reworked the static app into a more complete shopping experience without changing the product direction.",
        "在不改变业务方向的前提下，把静态应用打磨为更完整的购物体验。"
      ),
      itemsI18n: [
        localizedPair("Improved responsive layouts, modal flows, product details, and mode rendering.", "优化响应式布局、弹窗流程、商品详情和模式渲染。"),
        localizedPair("Kept the HTML/CSS/JavaScript structure deployable as a static site.", "保持 HTML/CSS/JavaScript 结构，可作为静态站点部署。")
      ]
    },
    {
      version: "v0.2.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Account Access", "账户入口"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Added the top-right account avatar entry for login and account actions.",
        "在右上角加入账户头像入口，用于登录和账户操作。"
      ),
      itemsI18n: [
        localizedPair("Added avatar/account button in the global top bar.", "在全局顶部栏新增头像/账户按钮。"),
        localizedPair("Connected the avatar menu to login and account actions.", "将头像菜单连接到登录与账户操作。")
      ]
    },
    {
      version: "v0.1.0",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Marketplace Shell", "商城骨架"),
      statusI18n: localizedPair("Uploaded", "已上传"),
      summaryI18n: localizedPair(
        "Created the IMPULSE three-level marketplace foundation for game services.",
        "创建 IMPULSE 游戏服务三层商城基础结构。"
      ),
      itemsI18n: [
        localizedPair("Added Gamer, Vector, and admin visual modes.", "新增 Gamer、Vector 和管理员三种视觉模式。"),
        localizedPair("Added categories, game sections, product rows, and detail modals.", "新增一级分类、游戏分区、商品行和详情弹窗。"),
        localizedPair("Added localStorage-backed seed data and management editing flows.", "新增 localStorage 种子数据和管理编辑流程。")
      ]
    }
  ];

  const CurrentRelease = DevelopmentRecords.find((record) => record.statusI18n?.en === "Current production build") || DevelopmentRecords[0];

  const Languages = [
    { code: "en", label: "英语", nativeName: "English", names: { "zh-CN": "英语", "zh-TW": "英語", en: "English", fr: "Anglais", ja: "英語", ko: "영어", es: "Inglés" } },
    { code: "zh-CN", label: "简体中文", nativeName: "简体中文", names: { "zh-CN": "简体中文", "zh-TW": "簡體中文", en: "Simplified Chinese", fr: "Chinois simplifié", ja: "簡体字中国語", ko: "중국어 간체", es: "Chino simplificado" } },
    { code: "zh-TW", label: "繁体中文", nativeName: "繁體中文", names: { "zh-CN": "繁体中文", "zh-TW": "繁體中文", en: "Traditional Chinese", fr: "Chinois traditionnel", ja: "繁体字中国語", ko: "중국어 번체", es: "Chino tradicional" } },
    { code: "fr", label: "法语", nativeName: "Français", names: { "zh-CN": "法语", "zh-TW": "法語", en: "French", fr: "Français", ja: "フランス語", ko: "프랑스어", es: "Francés" } },
    { code: "ja", label: "日语", nativeName: "日本語", names: { "zh-CN": "日语", "zh-TW": "日語", en: "Japanese", fr: "Japonais", ja: "日本語", ko: "일본어", es: "Japonés" } },
    { code: "ko", label: "韩语", nativeName: "한국어", names: { "zh-CN": "韩语", "zh-TW": "韓語", en: "Korean", fr: "Coréen", ja: "韓国語", ko: "한국어", es: "Coreano" } },
    { code: "es", label: "西班牙语", nativeName: "Español", names: { "zh-CN": "西班牙语", "zh-TW": "西班牙語", en: "Spanish", fr: "Espagnol", ja: "スペイン語", ko: "스페인어", es: "Español" } }
  ];

  const UiDictionary = {
    "返回首页": { "zh-TW": "返回首頁", en: "Back Home", fr: "Retour accueil", ja: "ホームへ戻る", ko: "홈으로", es: "Volver al inicio" },
    "搜索游戏、服务、账号": { "zh-TW": "搜尋遊戲、服務、帳號", en: "Search games, services, accounts", fr: "Rechercher jeux, services, comptes", ja: "ゲーム、サービス、アカウントを検索", ko: "게임, 서비스, 계정 검색", es: "Buscar juegos, servicios y cuentas" },
    "搜索": { "zh-TW": "搜尋", en: "Search", fr: "Rechercher", ja: "検索", ko: "검색", es: "Buscar" },
    "当前位置": { "zh-TW": "目前位置", en: "Current Location", fr: "Emplacement actuel", ja: "現在地", ko: "현재 위치", es: "Ubicación actual" },
    "玩家动能驱动": { "zh-TW": "Driven by Gamers' Momentum", en: "Driven by Gamers' Momentum", fr: "Driven by Gamers' Momentum", ja: "Driven by Gamers' Momentum", ko: "Driven by Gamers' Momentum", es: "Driven by Gamers' Momentum" },
    "IMPULSE J 玩家动能驱动的基础信息页。": { "zh-TW": "IMPULSE J 的基礎資訊頁。", en: "Basic information for IMPULSE J.", fr: "Informations de base de IMPULSE J.", ja: "IMPULSE J の基本情報です。", ko: "IMPULSE J 기본 정보입니다.", es: "Información básica de IMPULSE J." },
    "关于 IMPULSE J": { "zh-TW": "關於 IMPULSE J", en: "About IMPULSE J", fr: "À propos d'IMPULSE J", ja: "IMPULSE J について", ko: "IMPULSE J 소개", es: "Acerca de IMPULSE J" },
    "普通界面会继续支持多语言；法律、资金规则、争议结论、提现说明和官方邮件始终以英文为准。": { "zh-TW": "一般介面會繼續支援多語言；法律、資金規則、爭議結論、提現說明和官方郵件一律以英文為準。", en: "General interface text remains multilingual; legal terms, financial rules, dispute outcomes, withdrawal instructions, and official emails always rely on English.", fr: "L'interface générale reste multilingue; les règles juridiques et financières, les conclusions de litige, les instructions de retrait et les e-mails officiels reposent toujours sur l'anglais.", ja: "通常のUIは多言語対応を続けますが、法的条件、資金ルール、紛争結論、出金説明、公式メールは常に英語に基づきます。", ko: "일반 UI는 계속 다국어를 지원하지만 법적 조건, 자금 규칙, 분쟁 결과, 출금 안내, 공식 이메일은 항상 영어를 기준으로 합니다.", es: "La interfaz general sigue siendo multilingue; los términos legales, reglas financieras, decisiones de disputas, instrucciones de retiro y correos oficiales siempre se basan en inglés." },
    "加急待员工确认": { "zh-TW": "加急待 Vector 確認", en: "Rush pending Vector confirmation", fr: "Urgence en attente de confirmation Vector", ja: "Vector の至急確認待ち", ko: "Vector 긴급 확인 대기", es: "Urgencia pendiente de confirmación de Vector" },
    "加急待 Vector 确认": { "zh-TW": "加急待 Vector 確認", en: "Rush pending Vector confirmation", fr: "Urgence en attente de confirmation Vector", ja: "Vector の至急確認待ち", ko: "Vector 긴급 확인 대기", es: "Urgencia pendiente de confirmación de Vector" },
    "加急已接受": { "zh-TW": "加急已接受", en: "Rush accepted", fr: "Urgence acceptée", ja: "至急依頼承認済み", ko: "긴급 요청 수락됨", es: "Urgencia aceptada" },
    "加急已拒绝": { "zh-TW": "加急已拒絕", en: "Rush declined", fr: "Urgence refusée", ja: "至急依頼却下", ko: "긴급 요청 거절됨", es: "Urgencia rechazada" },
    "加急已违约": { "zh-TW": "加急已違約", en: "Rush breached", fr: "Urgence non respectée", ja: "至急依頼違反", ko: "긴급 요청 위반", es: "Urgencia incumplida" },
    "员工申请继续完成": { "zh-TW": "Vector 申請繼續完成", en: "Vector requested to continue", fr: "Vector demande à continuer", ja: "Vector が継続を申請", ko: "Vector 계속 진행 요청", es: "Vector solicitó continuar" },
    "顾客已同意继续": { "zh-TW": "Gamer 已同意繼續", en: "Gamer agreed to continue", fr: "Gamer accepte de continuer", ja: "Gamer が継続に同意", ko: "Gamer 계속 진행 동의", es: "Gamer aceptó continuar" },
    "顾客拒绝继续": { "zh-TW": "Gamer 拒絕繼續", en: "Gamer declined continuation", fr: "Gamer refuse la continuation", ja: "Gamer が継続を拒否", ko: "Gamer 계속 진행 거절", es: "Gamer rechazó continuar" },
    "Vector 申请继续完成": { "zh-TW": "Vector 申請繼續完成", en: "Vector requested to continue", fr: "Vector demande à continuer", ja: "Vector が継続を申請", ko: "Vector 계속 진행 요청", es: "Vector solicitó continuar" },
    "Gamer 已同意继续": { "zh-TW": "Gamer 已同意繼續", en: "Gamer agreed to continue", fr: "Gamer accepte de continuer", ja: "Gamer が継続に同意", ko: "Gamer 계속 진행 동의", es: "Gamer aceptó continuar" },
    "Gamer 拒绝继续": { "zh-TW": "Gamer 拒絕繼續", en: "Gamer declined continuation", fr: "Gamer refuse la continuation", ja: "Gamer が継続を拒否", ko: "Gamer 계속 진행 거절", es: "Gamer rechazó continuar" },
    "Gamer 模式": { "zh-TW": "Gamer 模式", en: "Gamer Mode", fr: "Mode Gamer", ja: "Gamer モード", ko: "Gamer 모드", es: "Modo Gamer" },
    "Vector 模式": { "zh-TW": "Vector 模式", en: "Vector Mode", fr: "Mode Vector", ja: "Vector モード", ko: "Vector 모드", es: "Modo Vector" },
    "客户模式": { "zh-TW": "Gamer 模式", en: "Gamer Mode", fr: "Mode Gamer", ja: "Gamer モード", ko: "Gamer 모드", es: "Modo Gamer" },
    "员工模式": { "zh-TW": "Vector 模式", en: "Vector Mode", fr: "Mode Vector", ja: "Vector モード", ko: "Vector 모드", es: "Modo Vector" },
    "管理模式": { "zh-TW": "管理模式", en: "Admin Mode", fr: "Mode admin", ja: "管理モード", ko: "관리자 모드", es: "Modo administrador" },
    "客户": { "zh-TW": "Gamer", en: "Gamer", fr: "Gamer", ja: "Gamer", ko: "Gamer", es: "Gamer" },
    "顾客": { "zh-TW": "Gamer", en: "Gamer", fr: "Gamer", ja: "Gamer", ko: "Gamer", es: "Gamer" },
    "员工": { "zh-TW": "Vector", en: "Vector", fr: "Vector", ja: "Vector", ko: "Vector", es: "Vector" },
    "Gamer": { "zh-TW": "Gamer", en: "Gamer", fr: "Gamer", ja: "Gamer", ko: "Gamer", es: "Gamer" },
    "Vector": { "zh-TW": "Vector", en: "Vector", fr: "Vector", ja: "Vector", ko: "Vector", es: "Vector" },
    "访客": { "zh-TW": "訪客", en: "Guest", fr: "Invité", ja: "ゲスト", ko: "게스트", es: "Invitado" },
    "待处理": { "zh-TW": "待處理", en: "Pending", fr: "En attente", ja: "保留中", ko: "대기 중", es: "Pendiente" },
    "进行中": { "zh-TW": "進行中", en: "In Progress", fr: "En cours", ja: "進行中", ko: "진행 중", es: "En curso" },
    "已完成": { "zh-TW": "已完成", en: "Completed", fr: "Terminé", ja: "完了", ko: "완료", es: "Completado" },
    "已取消": { "zh-TW": "已取消", en: "Cancelled", fr: "Annulé", ja: "キャンセル済み", ko: "취소됨", es: "Cancelado" },
    "订单": { "zh-TW": "訂單", en: "Order", fr: "Commande", ja: "注文", ko: "주문", es: "Pedido" },
    "预约": { "zh-TW": "預約", en: "Reserve", fr: "Réserver", ja: "予約", ko: "예약", es: "Reservar" },
    "切换模式": { "zh-TW": "切換模式", en: "Switch Mode", fr: "Changer de mode", ja: "モード切替", ko: "모드 전환", es: "Cambiar modo" },
    "管理控制台": { "zh-TW": "管理控制台", en: "Admin Console", fr: "Console admin", ja: "管理コンソール", ko: "관리 콘솔", es: "Consola admin" },
    "登录账户": { "zh-TW": "登入帳戶", en: "Sign In", fr: "Connexion", ja: "ログイン", ko: "로그인", es: "Iniciar sesión" },
    "登录方式": { "zh-TW": "登入方式", en: "Sign-In Method", fr: "Méthode de connexion", ja: "ログイン方法", ko: "로그인 방식", es: "Método de acceso" },
    "账户菜单": { "zh-TW": "帳戶選單", en: "Account Menu", fr: "Menu du compte", ja: "アカウントメニュー", ko: "계정 메뉴", es: "Menú de cuenta" },
    "邮件": { "zh-TW": "郵件", en: "Mail", fr: "Courrier", ja: "メール", ko: "메일", es: "Correo" },
    "邮件中心": { "zh-TW": "郵件中心", en: "Mail Center", fr: "Centre de courrier", ja: "メールセンター", ko: "메일 센터", es: "Centro de correo" },
    "全部邮件": { "zh-TW": "全部郵件", en: "All Mail", fr: "Tout le courrier", ja: "すべてのメール", ko: "전체 메일", es: "Todo el correo" },
    "系统邮件": { "zh-TW": "系統郵件", en: "System Mail", fr: "Courrier système", ja: "システムメール", ko: "시스템 메일", es: "Correo del sistema" },
    "安全邮件": { "zh-TW": "安全郵件", en: "Security Mail", fr: "Courrier de sécurité", ja: "セキュリティメール", ko: "보안 메일", es: "Correo de seguridad" },
    "订单邮件": { "zh-TW": "訂單郵件", en: "Order Mail", fr: "Courrier de commande", ja: "注文メール", ko: "주문 메일", es: "Correo de pedidos" },
    "资金通知": { "zh-TW": "資金通知", en: "Funds Notice", fr: "Notification de fonds", ja: "資金通知", ko: "자금 알림", es: "Aviso de fondos" },
    "聊天提醒": { "zh-TW": "聊天提醒", en: "Chat Alerts", fr: "Alertes de chat", ja: "チャット通知", ko: "채팅 알림", es: "Alertas de chat" },
    "发件人": { "zh-TW": "寄件者", en: "Sender", fr: "Expéditeur", ja: "送信者", ko: "발신자", es: "Remitente" },
    "发送时间": { "zh-TW": "發送時間", en: "Sent", fr: "Envoyé", ja: "送信時刻", ko: "전송 시간", es: "Enviado" },
    "关联订单": { "zh-TW": "關聯訂單", en: "Related Order", fr: "Commande liée", ja: "関連注文", ko: "관련 주문", es: "Pedido relacionado" },
    "未读": { "zh-TW": "未讀", en: "Unread", fr: "Non lu", ja: "未読", ko: "읽지 않음", es: "No leído" },
    "已读": { "zh-TW": "已讀", en: "Read", fr: "Lu", ja: "既読", ko: "읽음", es: "Leído" },
    "全部已读/领取": { "zh-TW": "全部已讀/領取", en: "Read / Claim All", fr: "Tout lire / réclamer", ja: "すべて既読 / 受取", ko: "전체 읽음 / 수령", es: "Leer / reclamar todo" },
    "删除已读": { "zh-TW": "刪除已讀", en: "Delete Read", fr: "Supprimer lus", ja: "既読を削除", ko: "읽은 항목 삭제", es: "Eliminar leídos" },
    "已全部处理": { "zh-TW": "已全部處理", en: "All handled", fr: "Tout est traité", ja: "すべて処理済み", ko: "모두 처리됨", es: "Todo procesado" },
    "已读邮件已删除": { "zh-TW": "已讀郵件已刪除", en: "Read mail deleted", fr: "Courrier lu supprimé", ja: "既読メールを削除しました", ko: "읽은 메일 삭제됨", es: "Correo leído eliminado" },
    "没有可删除的已读邮件": { "zh-TW": "沒有可刪除的已讀郵件", en: "No read mail to delete", fr: "Aucun courrier lu à supprimer", ja: "削除できる既読メールはありません", ko: "삭제할 읽은 메일 없음", es: "No hay correo leído para eliminar" },
    "暂无邮件": { "zh-TW": "暫無郵件", en: "No Mail", fr: "Aucun courrier", ja: "メールはありません", ko: "메일 없음", es: "Sin correo" },
    "选择一封邮件查看详情。": { "zh-TW": "選擇一封郵件查看詳情。", en: "Select a message to view details.", fr: "Sélectionnez un message pour afficher les détails.", ja: "詳細を見るメールを選択してください。", ko: "상세 내용을 보려면 메일을 선택하세요.", es: "Selecciona un mensaje para ver detalles." },
    "该邮件由系统自动同步，不能取消发送。": { "zh-TW": "此郵件由系統自動同步，不能取消發送。", en: "This message is synced automatically by the system and cannot be unsent.", fr: "Ce message est synchronisé automatiquement par le système et ne peut pas être annulé.", ja: "このメッセージはシステムにより自動同期され、送信取消はできません。", ko: "이 메시지는 시스템이 자동 동기화하며 전송 취소할 수 없습니다.", es: "Este mensaje se sincroniza automáticamente y no se puede cancelar." },
    "系统通知": { "zh-TW": "系統通知", en: "System Notice", fr: "Notification système", ja: "システム通知", ko: "시스템 알림", es: "Aviso del sistema" },
    "订单通知": { "zh-TW": "訂單通知", en: "Order Notice", fr: "Notification de commande", ja: "注文通知", ko: "주문 알림", es: "Aviso de pedido" },
    "新聊天消息": { "zh-TW": "新聊天訊息", en: "New Chat Message", fr: "Nouveau message", ja: "新しいチャットメッセージ", ko: "새 채팅 메시지", es: "Nuevo mensaje de chat" },
    "订单聊天更新": { "zh-TW": "訂單聊天更新", en: "Order Chat Update", fr: "Mise à jour du chat", ja: "注文チャット更新", ko: "주문 채팅 업데이트", es: "Actualización de chat" },
    "无正文内容。": { "zh-TW": "無正文內容。", en: "No message body.", fr: "Aucun contenu.", ja: "本文はありません。", ko: "본문 없음.", es: "Sin contenido." },
    "当前版本": { "zh-TW": "目前版本", en: "Current Version", fr: "Version actuelle", ja: "現在のバージョン", ko: "현재 버전", es: "Versión actual" },
    "开发日志": { "zh-TW": "開發日誌", en: "Development Log", fr: "Journal de développement", ja: "開発ログ", ko: "개발 로그", es: "Registro de desarrollo" },
    "版本记录": { "zh-TW": "版本記錄", en: "Release History", fr: "Historique des versions", ja: "リリース履歴", ko: "릴리스 기록", es: "Historial de versiones" },
    "查看开发日志": { "zh-TW": "查看開發日誌", en: "View Development Log", fr: "Voir le journal", ja: "開発ログを見る", ko: "개발 로그 보기", es: "Ver registro" },
    "版本号": { "zh-TW": "版本號", en: "Version", fr: "Version", ja: "バージョン", ko: "버전", es: "Versión" },
    "版本名称": { "zh-TW": "版本名稱", en: "Release Name", fr: "Nom de version", ja: "リリース名", ko: "릴리스 이름", es: "Nombre de versión" },
    "发布时间": { "zh-TW": "發布時間", en: "Release Date", fr: "Date de sortie", ja: "リリース日", ko: "출시일", es: "Fecha de lanzamiento" },
    "上传状态": { "zh-TW": "上傳狀態", en: "Upload Status", fr: "Statut d'envoi", ja: "アップロード状態", ko: "업로드 상태", es: "Estado de subida" },
    "本次更新": { "zh-TW": "本次更新", en: "This Update", fr: "Cette mise à jour", ja: "今回の更新", ko: "이번 업데이트", es: "Esta actualización" },
    "当前发布": { "zh-TW": "目前發布", en: "Current Release", fr: "Version courante", ja: "現在のリリース", ko: "현재 릴리스", es: "Lanzamiento actual" },
    "我的订单": { "zh-TW": "我的訂單", en: "My Orders", fr: "Mes commandes", ja: "注文履歴", ko: "내 주문", es: "Mis pedidos" },
    "语言选择": { "zh-TW": "語言選擇", en: "Language", fr: "Langue", ja: "言語", ko: "언어", es: "Idioma" },
    "设置": { "zh-TW": "設定", en: "Settings", fr: "Paramètres", ja: "設定", ko: "설정", es: "Ajustes" },
    "用户信息": { "zh-TW": "使用者資訊", en: "User Info", fr: "Infos utilisateur", ja: "ユーザー情報", ko: "사용자 정보", es: "Información de usuario" },
    "账户安全": { "zh-TW": "帳戶安全", en: "Account Security", fr: "Sécurité du compte", ja: "アカウントセキュリティ", ko: "계정 보안", es: "Seguridad de cuenta" },
    "联系设置": { "zh-TW": "聯絡設定", en: "Contact Settings", fr: "Paramètres de contact", ja: "連絡設定", ko: "연락 설정", es: "Ajustes de contacto" },
    "我要入职": { "zh-TW": "成為 Vector", en: "Become a Vector", fr: "Devenir Vector", ja: "Vector になる", ko: "Vector 되기", es: "Convertirse en Vector" },
    "退出登录": { "zh-TW": "登出", en: "Sign Out", fr: "Déconnexion", ja: "ログアウト", ko: "로그아웃", es: "Cerrar sesión" },
    "确认退出登录？": { "zh-TW": "確認登出？", en: "Sign out?", fr: "Se déconnecter ?", ja: "ログアウトしますか？", ko: "로그아웃할까요?", es: "¿Cerrar sesión?" },
    "退出后将回到客户模式。": { "zh-TW": "登出後將回到 Gamer 模式。", en: "After signing out, you will return to Gamer Mode.", fr: "Après déconnexion, vous reviendrez au mode Gamer.", ja: "ログアウト後は Gamer モードに戻ります。", ko: "로그아웃하면 Gamer 모드로 돌아갑니다.", es: "Al cerrar sesión volverás al modo Gamer." },
    "取消": { "zh-TW": "取消", en: "Cancel", fr: "Annuler", ja: "キャンセル", ko: "취소", es: "Cancelar" },
    "确认": { "zh-TW": "確認", en: "Confirm", fr: "Confirmer", ja: "確認", ko: "확인", es: "Confirmar" },
    "保存": { "zh-TW": "儲存", en: "Save", fr: "Enregistrer", ja: "保存", ko: "저장", es: "Guardar" },
    "关闭": { "zh-TW": "關閉", en: "Close", fr: "Fermer", ja: "閉じる", ko: "닫기", es: "Cerrar" },
    "工作台": { "zh-TW": "工作台", en: "Workspace", fr: "Espace de travail", ja: "ワークスペース", ko: "작업대", es: "Panel" },
    "首页": { "zh-TW": "首頁", en: "Home", fr: "Accueil", ja: "ホーム", ko: "홈", es: "Inicio" },
    "详情": { "zh-TW": "詳情", en: "Details", fr: "Détails", ja: "詳細", ko: "상세", es: "Detalles" },
    "模式": { "zh-TW": "模式", en: "Mode", fr: "Mode", ja: "モード", ko: "모드", es: "Modo" },
    "分类": { "zh-TW": "分類", en: "Category", fr: "Catégorie", ja: "カテゴリ", ko: "분류", es: "Categoría" },
    "分区": { "zh-TW": "分區", en: "Section", fr: "Section", ja: "区分", ko: "구역", es: "Sección" },
    "商品": { "zh-TW": "商品", en: "Products", fr: "Produits", ja: "商品", ko: "상품", es: "Productos" },
    "全部订单": { "zh-TW": "全部訂單", en: "All Orders", fr: "Toutes commandes", ja: "全注文", ko: "전체 주문", es: "Todos los pedidos" },
    "一级分类": { "zh-TW": "一級分類", en: "Top Categories", fr: "Catégories", ja: "主要カテゴリ", ko: "상위 분류", es: "Categorías principales" },
    "游戏分区": { "zh-TW": "遊戲分區", en: "Game Sections", fr: "Sections de jeu", ja: "ゲーム区分", ko: "게임 구역", es: "Secciones de juego" },
    "选择你需要的游戏服务": { "zh-TW": "選擇你需要的遊戲服務", en: "Choose the Game Service You Need", fr: "Choisissez le service de jeu dont vous avez besoin", ja: "必要なゲームサービスを選択", ko: "필요한 게임 서비스를 선택하세요", es: "Elige el servicio de juego que necesitas" },
    "管理商品与服务内容": { "zh-TW": "管理商品與服務內容", en: "Manage Products and Services", fr: "Gérer les produits et services", ja: "商品とサービスを管理", ko: "상품과 서비스를 관리", es: "Gestionar productos y servicios" },
    "专业教练、语音陪玩、雇佣兵与账号交易集中在一个清爽的购物体验里。": { "zh-TW": "專業教練、語音陪玩、雇傭兵與帳號交易集中在一個清爽的購物體驗裡。", en: "Professional coaching, voice companion play, mercenary support, and account trading in one clean shopping experience.", fr: "Coaching professionnel, accompagnement vocal, renforts et comptes réunis dans une expérience claire.", ja: "プロコーチ、ボイス同行、支援サービス、アカウント取引を一つの使いやすい体験に集約。", ko: "전문 코칭, 음성 플레이, 지원 서비스, 계정 거래를 깔끔한 쇼핑 경험으로 제공합니다.", es: "Coaching profesional, acompañamiento por voz, apoyo y comercio de cuentas en una experiencia clara." },
    "管理员可以维护一级分类、游戏分区、商品与订单记录。": { "zh-TW": "管理員可以維護一級分類、遊戲分區、商品與訂單記錄。", en: "Admins can manage categories, game sections, products, and order records.", fr: "Les admins peuvent gérer les catégories, sections, produits et commandes.", ja: "管理者はカテゴリ、ゲーム区分、商品、注文記録を管理できます。", ko: "관리자는 분류, 게임 구역, 상품, 주문 기록을 관리할 수 있습니다.", es: "Los administradores pueden gestionar categorías, secciones, productos y pedidos." },
    "查看分区": { "zh-TW": "查看分區", en: "View Sections", fr: "Voir sections", ja: "区分を見る", ko: "구역 보기", es: "Ver secciones" },
    "查看商品": { "zh-TW": "查看商品", en: "View Products", fr: "Voir produits", ja: "商品を見る", ko: "상품 보기", es: "Ver productos" },
    "查看详情": { "zh-TW": "查看詳情", en: "View Details", fr: "Voir détails", ja: "詳細を見る", ko: "상세 보기", es: "Ver detalles" },
    "进入": { "zh-TW": "進入", en: "Open", fr: "Ouvrir", ja: "開く", ko: "열기", es: "Abrir" },
    "接单": { "zh-TW": "接單", en: "Accept", fr: "Accepter", ja: "受注", ko: "수락", es: "Aceptar" },
    "完成": { "zh-TW": "完成", en: "Complete", fr: "Terminer", ja: "完了", ko: "완료", es: "Completar" },
    "取消订单": { "zh-TW": "取消訂單", en: "Cancel Order", fr: "Annuler commande", ja: "注文をキャンセル", ko: "주문 취소", es: "Cancelar pedido" },
    "立即下单": { "zh-TW": "立即下單", en: "Order Now", fr: "Commander", ja: "今すぐ注文", ko: "바로 주문", es: "Pedir ahora" },
    "浏览服务": { "zh-TW": "瀏覽服務", en: "Browse Services", fr: "Parcourir", ja: "サービスを見る", ko: "서비스 보기", es: "Ver servicios" },
    "登录": { "zh-TW": "登入", en: "Sign In", fr: "Connexion", ja: "ログイン", ko: "로그인", es: "Iniciar sesión" },
    "注册": { "zh-TW": "註冊", en: "Register", fr: "Inscription", ja: "登録", ko: "가입", es: "Registrarse" },
    "注册并登录": { "zh-TW": "註冊並登入", en: "Register and Sign In", fr: "S'inscrire et se connecter", ja: "登録してログイン", ko: "가입 후 로그인", es: "Registrarse e iniciar sesión" },
    "登录 IMPULSE J": { "zh-TW": "登入 IMPULSE J", en: "Sign In to IMPULSE J", fr: "Connexion à IMPULSE J", ja: "IMPULSE J にログイン", ko: "IMPULSE J 로그인", es: "Iniciar sesión en IMPULSE J" },
    "注册 IMPULSE J": { "zh-TW": "註冊 IMPULSE J", en: "Register for IMPULSE J", fr: "Inscription à IMPULSE J", ja: "IMPULSE J に登録", ko: "IMPULSE J 가입", es: "Registrarse en IMPULSE J" },
    "用户名": { "zh-TW": "使用者名稱", en: "Username", fr: "Nom d'utilisateur", ja: "ユーザー名", ko: "사용자 이름", es: "Usuario" },
    "用户名或邮箱": { "zh-TW": "使用者名稱或電子郵件", en: "Username or Email", fr: "Nom d'utilisateur ou e-mail", ja: "ユーザー名またはメール", ko: "사용자 이름 또는 이메일", es: "Usuario o correo" },
    "账号或邮箱": { "zh-TW": "帳號或電子郵件", en: "Username or Email", fr: "Nom d'utilisateur ou e-mail", ja: "ユーザー名またはメール", ko: "사용자 이름 또는 이메일", es: "Usuario o correo" },
    "邮箱": { "zh-TW": "電子郵件", en: "Email", fr: "E-mail", ja: "メール", ko: "이메일", es: "Correo electrónico" },
    "邮箱验证码": { "zh-TW": "電子郵件驗證碼", en: "Email Code", fr: "Code e-mail", ja: "メール認証コード", ko: "이메일 인증 코드", es: "Código de email" },
    "6 位验证码": { "zh-TW": "6 位驗證碼", en: "6-digit code", fr: "Code à 6 chiffres", ja: "6桁コード", ko: "6자리 코드", es: "Código de 6 dígitos" },
    "发送验证码": { "zh-TW": "發送驗證碼", en: "Send Code", fr: "Envoyer le code", ja: "コード送信", ko: "인증 코드 보내기", es: "Enviar código" },
    "账户密码登录": { "zh-TW": "帳號密碼登入", en: "Password Sign-In", fr: "Connexion par mot de passe", ja: "パスワードログイン", ko: "비밀번호 로그인", es: "Acceso con contraseña" },
    "邮箱验证码登录": { "zh-TW": "電子郵件驗證碼登入", en: "Email Code Sign-In", fr: "Connexion par code e-mail", ja: "メールコードログイン", ko: "이메일 코드 로그인", es: "Acceso con código" },
    "邮箱安全登录": { "zh-TW": "電子郵件安全登入", en: "Secure Email Sign-In", fr: "Connexion sécurisée par e-mail", ja: "メール安全ログイン", ko: "이메일 보안 로그인", es: "Inicio seguro por email" },
    "创建安全账户": { "zh-TW": "建立安全帳戶", en: "Create Secure Account", fr: "Créer un compte sécurisé", ja: "安全なアカウント作成", ko: "보안 계정 만들기", es: "Crear cuenta segura" },
    "需要邮箱验证码完成身份确认。": { "zh-TW": "需要電子郵件驗證碼完成身分確認。", en: "An email code is required to verify your identity.", fr: "Un code e-mail est requis pour confirmer votre identité.", ja: "本人確認にはメールコードが必要です。", ko: "본인 확인을 위해 이메일 코드가 필요합니다.", es: "Se requiere un código de email para verificar tu identidad." },
    "使用用户名或邮箱和密码登录。": { "zh-TW": "使用使用者名稱或電子郵件與密碼登入。", en: "Sign in with your username or email and password.", fr: "Connectez-vous avec votre nom d'utilisateur ou e-mail et votre mot de passe.", ja: "ユーザー名またはメールとパスワードでログインします。", ko: "사용자 이름 또는 이메일과 비밀번호로 로그인하세요.", es: "Inicia sesión con usuario o correo y contraseña." },
    "使用邮箱和 6 位验证码登录。": { "zh-TW": "使用電子郵件和 6 位驗證碼登入。", en: "Sign in with your email and a 6-digit code.", fr: "Connectez-vous avec votre e-mail et un code à 6 chiffres.", ja: "メールと6桁コードでログインします。", ko: "이메일과 6자리 코드로 로그인하세요.", es: "Inicia sesión con email y un código de 6 dígitos." },
    "可以使用账户密码登录，也可以切换为邮箱验证码登录。": { "zh-TW": "可以使用帳號密碼登入，也可以切換為電子郵件驗證碼登入。", en: "Use a password, or switch to email code sign-in.", fr: "Utilisez un mot de passe ou passez au code e-mail.", ja: "パスワード、またはメールコードでログインできます。", ko: "비밀번호로 로그인하거나 이메일 코드 로그인으로 전환할 수 있습니다.", es: "Usa contraseña o cambia al código por email." },
    "使用邮箱、密码和 6 位邮件验证码进入账户。": { "zh-TW": "使用電子郵件、密碼和 6 位郵件驗證碼進入帳戶。", en: "Use email, password, and a 6-digit email code to enter your account.", fr: "Utilisez e-mail, mot de passe et code à 6 chiffres.", ja: "メール、パスワード、6桁コードでログインします。", ko: "이메일, 비밀번호, 6자리 인증 코드로 로그인합니다.", es: "Usa email, contraseña y código de 6 dígitos." },
    "注册后将使用邮箱作为唯一登录凭证。": { "zh-TW": "註冊後將使用電子郵件作為唯一登入憑證。", en: "After registration, email is your login credential.", fr: "Après inscription, l'e-mail servira d'identifiant.", ja: "登録後はメールがログイン資格情報になります。", ko: "가입 후 이메일이 로그인 정보가 됩니다.", es: "Tras registrarte, el email será tu credencial." },
    "密码": { "zh-TW": "密碼", en: "Password", fr: "Mot de passe", ja: "パスワード", ko: "비밀번호", es: "Contraseña" },
    "确认密码": { "zh-TW": "確認密碼", en: "Confirm Password", fr: "Confirmer le mot de passe", ja: "パスワード確認", ko: "비밀번호 확인", es: "Confirmar contraseña" },
    "用户ID": { "zh-TW": "使用者ID", en: "User ID", fr: "ID utilisateur", ja: "ユーザーID", ko: "사용자 ID", es: "ID de usuario" },
    "头像": { "zh-TW": "頭像", en: "Avatar", fr: "Avatar", ja: "アバター", ko: "아바타", es: "Avatar" },
    "修改头像": { "zh-TW": "修改頭像", en: "Change Avatar", fr: "Modifier l'avatar", ja: "アバター変更", ko: "아바타 변경", es: "Cambiar avatar" },
    "上传图像": { "zh-TW": "上傳圖像", en: "Upload Image", fr: "Téléverser une image", ja: "画像をアップロード", ko: "이미지 업로드", es: "Subir imagen" },
    "移除头像": { "zh-TW": "移除頭像", en: "Remove Avatar", fr: "Supprimer l'avatar", ja: "アバター削除", ko: "아바타 제거", es: "Quitar avatar" },
    "已上传图片": { "zh-TW": "已上傳圖片", en: "Image Uploaded", fr: "Image téléversée", ja: "画像アップロード済み", ko: "이미지 업로드됨", es: "Imagen subida" },
    "用户等级": { "zh-TW": "使用者等級", en: "User Level", fr: "Niveau utilisateur", ja: "ユーザーレベル", ko: "사용자 등급", es: "Nivel de usuario" },
    "剩余资金": { "zh-TW": "剩餘資金", en: "Remaining Funds", fr: "Solde restant", ja: "残高", ko: "잔여 자금", es: "Fondos restantes" },
    "余额": { en: "Balance" },
    "国家或地区": { "zh-TW": "國家或地區", en: "Country or Region", fr: "Pays ou région", ja: "国または地域", ko: "국가 또는 지역", es: "País o región" },
    "生日": { "zh-TW": "生日", en: "Birthday", fr: "Date de naissance", ja: "誕生日", ko: "생일", es: "Cumpleaños" },
    "国家或地区 *": { "zh-TW": "國家或地區 *", en: "Country or Region *", fr: "Pays ou région *", ja: "国または地域 *", ko: "국가 또는 지역 *", es: "País o región *" },
    "生日 *": { "zh-TW": "生日 *", en: "Birthday *", fr: "Date de naissance *", ja: "誕生日 *", ko: "생일 *", es: "Cumpleaños *" },
    "性别": { "zh-TW": "性別", en: "Gender", fr: "Genre", ja: "性別", ko: "성별", es: "Género" },
    "注销账户": { "zh-TW": "註銷帳戶", en: "Delete Account", fr: "Supprimer le compte", ja: "アカウント削除", ko: "계정 삭제", es: "Eliminar cuenta" },
    "修改密码": { "zh-TW": "修改密碼", en: "Change Password", fr: "Modifier le mot de passe", ja: "パスワード変更", ko: "비밀번호 변경", es: "Cambiar contraseña" },
    "绑定邮箱": { "zh-TW": "綁定電子郵件", en: "Bound Email", fr: "E-mail lié", ja: "連携メール", ko: "연결 이메일", es: "Email vinculado" },
    "修改绑定邮箱": { "zh-TW": "修改綁定電子郵件", en: "Change Bound Email", fr: "Modifier l'e-mail lié", ja: "連携メールを変更", ko: "연결 이메일 변경", es: "Cambiar email vinculado" },
    "通知邮箱": { "zh-TW": "通知電子郵件", en: "Notification Email", fr: "E-mail de notification", ja: "通知メール", ko: "알림 이메일", es: "Email de notificación" },
    "注册时填写账户资料；带 * 的项目为必填，注册后不可修改。": { "zh-TW": "註冊時填寫帳戶資料；帶 * 的項目為必填，註冊後不可修改。", en: "Complete account details during registration; fields marked * are required and cannot be changed later.", fr: "Renseignez les informations du compte à l'inscription ; les champs * sont obligatoires et non modifiables ensuite.", ja: "登録時にアカウント情報を入力します。* の項目は必須で、後から変更できません。", ko: "가입 시 계정 정보를 입력하세요. * 표시 항목은 필수이며 이후 변경할 수 없습니다.", es: "Completa los datos al registrarte; los campos con * son obligatorios y no se podrán modificar después." },
    "可选。上传不大于 5MB 的图像，系统会在圆框内居中截取。": { "zh-TW": "可選。上傳不大於 5MB 的圖像，系統會在圓框內置中截取。", en: "Optional. Upload an image up to 5MB; it will be centered and cropped in a circle.", fr: "Facultatif. Image jusqu'à 5 Mo, centrée et recadrée en cercle.", ja: "任意。5MB以下の画像をアップロードすると、円形に中央切り抜きされます。", ko: "선택 사항. 5MB 이하 이미지를 업로드하면 원형으로 중앙 크롭됩니다.", es: "Opcional. Sube una imagen de hasta 5 MB; se centrará y recortará en círculo." },
    "语言已切换": { "zh-TW": "語言已切換", en: "Language Changed", fr: "Langue modifiée", ja: "言語を変更しました", ko: "언어 변경됨", es: "Idioma cambiado" },
    "语言已保存": { "zh-TW": "語言已儲存", en: "Language Saved", fr: "Langue enregistrée", ja: "言語を保存しました", ko: "언어 저장됨", es: "Idioma guardado" },
    "正在准备翻译": { "zh-TW": "正在準備翻譯", en: "Preparing Translation", fr: "Préparation de la traduction", ja: "翻訳を準備中", ko: "번역 준비 중", es: "Preparando traducción" },
    "翻译脚本未加载": { "zh-TW": "翻譯腳本未載入", en: "Translation Script Not Loaded", fr: "Script de traduction non chargé", ja: "翻訳スクリプト未読込", ko: "번역 스크립트 미로드", es: "Script de traducción no cargado" },
    "账户积分": { "zh-TW": "帳戶積分", en: "Account Points", fr: "Points du compte", ja: "アカウントポイント", ko: "계정 포인트", es: "Puntos de cuenta" },
    "充值积分": { "zh-TW": "儲值積分", en: "Recharge Points", fr: "Recharger des points", ja: "ポイントをチャージ", ko: "포인트 충전", es: "Recargar puntos" },
    "余额不足": { "zh-TW": "餘額不足", en: "Insufficient Balance", fr: "Solde insuffisant", ja: "残高不足", ko: "잔액 부족", es: "Saldo insuficiente" },
    "账户不可用": { "zh-TW": "帳戶不可用", en: "Account Unavailable", fr: "Compte indisponible", ja: "アカウント利用不可", ko: "계정 사용 불가", es: "Cuenta no disponible" },
    "提交订单": { "zh-TW": "提交訂單", en: "Submit Order", fr: "Envoyer la commande", ja: "注文を送信", ko: "주문 제출", es: "Enviar pedido" },
    "预约服务": { "zh-TW": "預約服務", en: "Reserve Service", fr: "Réserver le service", ja: "サービスを予約", ko: "서비스 예약", es: "Reservar servicio" },
    "提交预约": { "zh-TW": "提交預約", en: "Submit Reservation", fr: "Envoyer la réservation", ja: "予約を送信", ko: "예약 제출", es: "Enviar reserva" },
    "联系方式": { "zh-TW": "聯絡方式", en: "Contact", fr: "Contact", ja: "連絡先", ko: "연락처", es: "Contacto" },
    "预约时间": { "zh-TW": "預約時間", en: "Reservation Time", fr: "Heure de réservation", ja: "予約時間", ko: "예약 시간", es: "Hora de reserva" },
    "无人接单自动退单时间（分钟）": { "zh-TW": "無人接單自動退單時間（分鐘）", en: "Auto-cancel if unaccepted (minutes)", fr: "Annulation auto sans prise (minutes)", ja: "未受注時の自動キャンセル時間（分）", ko: "미수락 자동 취소 시간(분)", es: "Cancelación automática sin aceptar (minutos)" },
    "备注": { "zh-TW": "備註", en: "Notes", fr: "Notes", ja: "備考", ko: "비고", es: "Notas" },
    "简体中文": { "zh-TW": "簡體中文", en: "Simplified Chinese", fr: "Chinois simplifié", ja: "簡体字中国語", ko: "중국어 간체", es: "Chino simplificado" },
    "繁体中文": { "zh-TW": "繁體中文", en: "Traditional Chinese", fr: "Chinois traditionnel", ja: "繁体字中国語", ko: "중국어 번체", es: "Chino tradicional" },
    "英语": { "zh-TW": "英語", en: "English", fr: "Anglais", ja: "英語", ko: "영어", es: "Inglés" },
    "法语": { "zh-TW": "法語", en: "French", fr: "Français", ja: "フランス語", ko: "프랑스어", es: "Francés" },
    "日语": { "zh-TW": "日語", en: "Japanese", fr: "Japonais", ja: "日本語", ko: "일본어", es: "Japonés" },
    "韩语": { "zh-TW": "韓語", en: "Korean", fr: "Coréen", ja: "韓国語", ko: "한국어", es: "Coreano" },
    "西班牙语": { "zh-TW": "西班牙語", en: "Spanish", fr: "Espagnol", ja: "スペイン語", ko: "스페인어", es: "Español" },
    "选择语言后，页面会通过内嵌 Google Translate 尝试自动转译。翻译质量与可用性取决于网络和 Google 服务状态。": {
      "zh-TW": "選擇語言後，頁面會透過內嵌 Google Translate 嘗試自動轉譯。翻譯品質與可用性取決於網路和 Google 服務狀態。",
      en: "After choosing a language, the page will use embedded Google Translate for editable content. Quality and availability depend on network access to Google services.",
      fr: "Après le choix d'une langue, la page utilise Google Translate intégré pour le contenu modifiable. La qualité dépend de l'accès au service Google.",
      ja: "言語を選ぶと、編集可能な内容は内蔵 Google Translate で翻訳を試みます。品質と可用性は Google サービスへの接続状況に依存します。",
      ko: "언어를 선택하면 편집 가능한 콘텐츠는 내장 Google Translate로 번역을 시도합니다. 품질과 사용 가능 여부는 Google 서비스 접속 상태에 따라 달라집니다.",
      es: "Al elegir un idioma, la página usará Google Translate integrado para el contenido editable. La calidad depende del acceso a Google."
    }
  };

  Object.assign(UiDictionary, {
    "英文名称": { en: "English Name" },
    "中文名称": { en: "Chinese Name" },
    "英文描述": { en: "English Description" },
    "中文描述": { en: "Chinese Description" },
    "英文平台": { en: "English Platform" },
    "中文平台": { en: "Chinese Platform" },
    "英文服务时长": { en: "English Duration" },
    "中文服务时长": { en: "Chinese Duration" },
    "英文标签": { en: "English Badge" },
    "中文标签": { en: "Chinese Badge" },
    "图标 class": { en: "Icon Class" },
    "价格": { en: "Price" },
    "名称": { en: "Name" },
    "描述": { en: "Description" },
    "平台": { en: "Platform" },
    "游戏": { en: "Game" },
    "状态": { en: "Status" },
    "当前": { en: "Current" },
    "未填写": { en: "Not provided" },
    "无": { en: "None" },
    "自动退单": { en: "Auto-cancel" },
    "退款": { en: "Refund" },
    "标签": { en: "Badge" },
    "服务时长": { en: "Service Duration" },
    "新增分类": { en: "Add Category" },
    "新增游戏分区": { en: "Add Game Section" },
    "新增商品": { en: "Add Product" },
    "编辑分类": { en: "Edit Category" },
    "编辑游戏分区": { en: "Edit Game Section" },
    "编辑商品": { en: "Edit Product" },
    "删除分类": { en: "Delete Category" },
    "删除游戏分区": { en: "Delete Game Section" },
    "删除商品": { en: "Delete Product" },
    "编辑内容": { en: "Edit Content" },
    "删除内容": { en: "Delete Content" },
    "删除分类？": { en: "Delete category?" },
    "删除游戏分区？": { en: "Delete game section?" },
    "删除商品？": { en: "Delete product?" },
    "删除内容？": { en: "Delete content?" },
    "分类已保存": { en: "Category Saved" },
    "分区已保存": { en: "Section Saved" },
    "商品已保存": { en: "Product Saved" },
    "关于我们": { en: "About Us" },
    "服务条款": { en: "Terms of Service" },
    "隐私政策": { en: "Privacy Policy" },
    "帮助中心": { en: "Help Center" },
    "删除后会立即更新本地数据。": { en: "This will immediately update local data." },
    "暂无分类。": { en: "No categories yet." },
    "暂无游戏分区。": { en: "No game sections yet." },
    "暂无商品。": { en: "No products yet." },
    "暂无描述。": { en: "No description yet." },
    "暂无详细描述。": { en: "No detailed description yet." },
    "分类不存在。": { en: "Category not found." },
    "游戏分区不存在。": { en: "Game section not found." },
    "商品不存在": { en: "Product Not Found" },
    "商品列表": { en: "Product List" },
    "搜索结果": { en: "Search Results" },
    "输入关键词后查看匹配内容。": { en: "Enter a keyword to view matching content." },
    "没有找到匹配内容。": { en: "No matching content found." },
    "请输入搜索关键词。": { en: "Please enter a search keyword." },
    "暂无匹配商品。": { en: "No matching products." },
    "分类与分区": { en: "Categories and Sections" },
    "我的账户": { en: "My Account" },
    "查看本地订单、预约和账户状态。": { en: "View local orders, reservations, and account status." },
    "登录后可查看订单与预约。": { en: "Sign in to view orders and reservations." },
    "当前账户暂不可充值。": { en: "This account cannot be recharged right now." },
    "当前余额：": { en: "Current balance: " },
    "本次还需": { en: "Still needed" },
    "充值成功": { en: "Recharge Successful" },
    "充值失败": { en: "Recharge Failed" },
    "未找到当前账户。": { en: "Current account not found." },
    "请稍后重试。": { en: "Please try again later." },
    "请先登录": { en: "Please Sign In" },
    "登录后才可以充值积分。": { en: "Sign in before recharging points." },
    "登录后即可提交订单或预约。": { en: "Sign in to submit an order or reservation." },
    "提交成功": { en: "Submitted" },
    "订单已进入待处理。": { en: "The order is now pending." },
    "预约已进入待处理。": { en: "The reservation is now pending." },
    "订单创建失败，请稍后重试。": { en: "Order creation failed. Please try again later." },
    "余额不足，请先充值。": { en: "Insufficient balance. Please recharge first." },
    "自动退单时间至少为 1 分钟。": { en: "Auto-cancel time must be at least 1 minute." },
    "角色信息、段位、期望目标或其他要求": { en: "Character info, rank, goals, or other requirements" },
    "微信 / QQ / 手机号": { en: "WeChat / QQ / phone number" },
    "订单不存在": { en: "Order Not Found" },
    "尚未有人接单": { en: "Not Accepted Yet" },
    "员工接单后即可打开聊天框。": { en: "The chat opens after a Vector accepts the order." },
    "Vector 接单后即可打开聊天框。": { "zh-TW": "Vector 接單後即可打開聊天框。", en: "The chat opens after a Vector accepts the order.", fr: "Le chat s'ouvre après acceptation par un Vector.", ja: "Vector が受注するとチャットを開けます。", ko: "Vector가 주문을 수락하면 채팅이 열립니다.", es: "El chat se abre cuando un Vector acepta el pedido." },
    "无权查看": { en: "No Permission" },
    "只有订单顾客、接单员工或管理员可以打开聊天。": { en: "Only the order Gamer, assigned Vector, or admin can open this chat." },
    "只有订单 Gamer、接单 Vector 或管理员可以打开聊天。": { "zh-TW": "只有訂單 Gamer、接單 Vector 或管理員可以打開聊天。", en: "Only the order Gamer, assigned Vector, or admin can open this chat.", fr: "Seuls le Gamer de la commande, le Vector assigné ou un admin peuvent ouvrir ce chat.", ja: "注文の Gamer、担当 Vector、または管理者だけがこのチャットを開けます。", ko: "주문 Gamer, 담당 Vector 또는 관리자만 이 채팅을 열 수 있습니다.", es: "Solo el Gamer del pedido, el Vector asignado o un administrador pueden abrir este chat." },
    "联系": { en: "Contact" },
    "接单": { en: "Accept" },
    "接单时间": { en: "Accepted At" },
    "超时无人接单自动退单": { en: "Auto-cancel deadline" },
    "已退款": { en: "Refunded" },
    "退单退款": { en: "Return Refund" },
    "已结算": { en: "Settled" },
    "离线": { en: "Offline" },
    "完成": { en: "Complete" },
    "发送": { en: "Send" },
    "输入消息": { en: "Type a message" },
    "图片": { en: "Image" },
    "聊天图片": { en: "Chat Image" },
    "可以发送文字或图片。": { en: "You can send text or images." },
    "请输入内容": { en: "Please enter content." },
    "请选择图片文件。": { en: "Please choose an image file." },
    "图片格式不支持": { en: "Unsupported Image Format" },
    "加急": { en: "Rush" },
    "退单": { en: "Return" },
    "举报": { en: "Report" },
    "小费": { en: "Tip" },
    "申请加急": { en: "Request Rush" },
    "申请退单": { en: "Request Return" },
    "举报员工": { en: "Report Vector" },
    "举报 Vector": { "zh-TW": "舉報 Vector", en: "Report Vector", fr: "Signaler Vector", ja: "Vector を報告", ko: "Vector 신고", es: "Reportar Vector" },
    "员工接单后才可以举报。": { en: "You can report only after a Vector accepts the order." },
    "Vector 接单后才可以举报。": { "zh-TW": "Vector 接單後才可以舉報。", en: "You can report only after a Vector accepts the order.", fr: "Vous pouvez signaler seulement après acceptation par un Vector.", ja: "Vector が受注した後にのみ報告できます。", ko: "Vector가 주문을 수락한 후에만 신고할 수 있습니다.", es: "Solo puedes reportar después de que un Vector acepte el pedido." },
    "支付小费": { en: "Pay Tip" },
    "账户密码": { en: "Account Password" },
    "确认支付": { en: "Confirm Payment" },
    "确认退单": { en: "Confirm Return" },
    "提交举报": { en: "Submit Report" },
    "举报类型": { en: "Report Type" },
    "举报说明": { en: "Report Details" },
    "服务态度": { en: "Service Attitude" },
    "拖延或失联": { en: "Delay or Lost Contact" },
    "违规行为": { en: "Rule Violation" },
    "骚扰或不当言论": { en: "Harassment or Inappropriate Speech" },
    "其他": { en: "Other" },
    "请描述具体情况、时间和证据": { en: "Describe what happened, timing, and evidence" },
    "小费积分": { en: "Tip Points" },
    "等待 Vector 确认。": { "zh-TW": "等待 Vector 確認。", en: "Waiting for Vector confirmation.", fr: "En attente de confirmation Vector.", ja: "Vector の確認待ちです。", ko: "Vector 확인 대기 중입니다.", es: "Esperando confirmación de Vector." },
    "接受后需要在 Gamer 规定期限内结单。": { "zh-TW": "接受後需要在 Gamer 規定期限內結單。", en: "After accepting, the order must be completed within the Gamer deadline.", fr: "Après acceptation, la commande doit être terminée dans le délai fixé par Gamer.", ja: "承認後は Gamer が指定した期限内に完了する必要があります。", ko: "수락 후 Gamer가 정한 기한 내에 완료해야 합니다.", es: "Tras aceptar, el pedido debe completarse dentro del plazo de Gamer." },
    "拒绝后加急费用会退回 Gamer。": { "zh-TW": "拒絕後加急費用會退回 Gamer。", en: "If declined, the rush fee returns to the Gamer.", fr: "En cas de refus, les frais d'urgence reviennent au Gamer.", ja: "拒否すると至急料金は Gamer に返金されます。", ko: "거절하면 긴급 비용은 Gamer에게 반환됩니다.", es: "Si se rechaza, la tarifa urgente vuelve al Gamer." },
    "Gamer 同意后，违约订单结单时 Vector 可额外获得原费用的 50%。": { "zh-TW": "Gamer 同意後，違約訂單結單時 Vector 可額外獲得原費用的 50%。", en: "If the Gamer agrees, the Vector can receive an additional 50% of the original fee when the breached order is completed.", fr: "Si le Gamer accepte, le Vector peut recevoir 50 % supplémentaires du prix initial à la clôture de la commande en retard.", ja: "Gamer が同意すると、違反済み注文の完了時に Vector は元料金の追加 50% を受け取れます。", ko: "Gamer가 동의하면 위반 주문 완료 시 Vector는 원래 금액의 추가 50%를 받을 수 있습니다.", es: "Si el Gamer acepta, el Vector puede recibir un 50 % adicional del precio original al completar el pedido incumplido." },
    "订单需要先由 Vector 接单。": { "zh-TW": "訂單需要先由 Vector 接單。", en: "The order must be accepted by a Vector first.", fr: "La commande doit d'abord être acceptée par un Vector.", ja: "注文は先に Vector が受注する必要があります。", ko: "주문은 먼저 Vector가 수락해야 합니다.", es: "El pedido debe ser aceptado primero por un Vector." },
    "积分已返还至 Gamer 账户。": { "zh-TW": "積分已返還至 Gamer 帳戶。", en: "Points were returned to the Gamer account.", fr: "Les points ont été renvoyés au compte Gamer.", ja: "ポイントは Gamer アカウントに返還されました。", ko: "포인트가 Gamer 계정으로 반환되었습니다.", es: "Los puntos se devolvieron a la cuenta Gamer." },
    "一键核对": { en: "One-Click Audit" },
    "一键清空日志": { en: "Clear Logs" },
    "今日概览": { en: "Today Overview" },
    "现有单目": { en: "Active Orders" },
    "已结单目": { en: "Completed Orders" },
    "预约单目": { en: "Reservations" },
    "个人日志": { en: "Personal Log" },
    "员工工作台": { en: "Vector Workspace" },
    "Vector 工作台": { "zh-TW": "Vector 工作台", en: "Vector Workspace", fr: "Espace Vector", ja: "Vector ワークスペース", ko: "Vector 작업 공간", es: "Espacio Vector" },
    "查看当前进行中的订单，跟进交付进度和沟通状态。": { en: "View active orders and follow delivery progress and communication status." },
    "复查历史完成订单，确认结算、评价与售后记录。": { en: "Review completed orders, settlement, ratings, and after-sales records." },
    "管理未来预约，确认服务时间、人员与客户备注。": { en: "Manage upcoming reservations, service time, staffing, and Gamer notes." },
    "管理未来预约，确认服务时间、人员与 Gamer 备注。": { en: "Manage upcoming reservations, service time, staffing, and Gamer notes." },
    "记录本日工作进展、异常事项与交付备注。": { en: "Record today’s work progress, exceptions, and delivery notes." },
    "记录服务进展、Gamer 备注或异常事项": { "zh-TW": "記錄服務進度、Gamer 備註或異常事項", en: "Record service progress, Gamer notes, or exceptions", fr: "Noter l'avancement, les remarques Gamer ou les exceptions", ja: "サービス進捗、Gamer メモ、例外事項を記録", ko: "서비스 진행, Gamer 메모 또는 예외 사항 기록", es: "Registra progreso, notas de Gamer o incidencias" },
    "订单处理、预约跟进、结单记录与个人日志集中在一个工作视图里。": { en: "Order handling, reservation follow-up, completion records, and logs in one workspace." },
    "普通 Gamer 可浏览、注册、下单和预约；Vector 账号可处理订单；管理员账号可维护内容与数据。": { "zh-TW": "普通 Gamer 可瀏覽、註冊、下單和預約；Vector 帳號可處理訂單；管理員帳號可維護內容與資料。", en: "Gamers can browse, register, place orders, and reserve services; Vector accounts can handle orders; admin accounts maintain content and data.", fr: "Les Gamers peuvent parcourir, s'inscrire, commander et réserver; les comptes Vector traitent les commandes; les administrateurs maintiennent le contenu et les données.", ja: "Gamer は閲覧、登録、注文、予約ができ、Vector アカウントは注文を処理し、管理者はコンテンツとデータを管理します。", ko: "Gamer는 탐색, 가입, 주문, 예약을 할 수 있고 Vector 계정은 주문을 처리하며 관리자는 콘텐츠와 데이터를 관리합니다.", es: "Los Gamers pueden explorar, registrarse, pedir y reservar; las cuentas Vector gestionan pedidos; los administradores mantienen contenido y datos." },
    "顾客": { "zh-TW": "Gamer", en: "Gamer", fr: "Gamer", ja: "Gamer", ko: "Gamer", es: "Gamer" },
    "员工": { "zh-TW": "Vector", en: "Vector", fr: "Vector", ja: "Vector", ko: "Vector", es: "Vector" },
    "用户": { en: "Users" },
    "账本": { en: "Ledger" },
    "日志": { en: "Logs" },
    "顾客、员工账户、资金、封禁与注销管理。": { en: "Manage Gamer and Vector accounts, funds, bans, and deletion." },
    "Gamer / Vector 账户、资金、封禁与注销管理。": { en: "Manage Gamer and Vector accounts, funds, bans, and deletion." },
    "查看顾客账户、积分、订单与限制状态。": { en: "View Gamer accounts, points, orders, and restrictions." },
    "查看员工账户、积分、订单与兑现记录。": { en: "View Vector accounts, points, orders, and payout records." },
    "查看 Gamer 账户、积分、订单与限制状态。": { en: "View Gamer accounts, points, orders, and restrictions." },
    "查看 Vector 账户、积分、订单与兑现记录。": { en: "View Vector accounts, points, orders, and payout records." },
    "查看顾客": { en: "View Gamer" },
    "查看员工": { en: "View Vector" },
    "查看 Gamer": { en: "View Gamer" },
    "查看 Vector": { en: "View Vector" },
    "统一检索充值单、消费单与兑现单。": { en: "Search recharge, consumption, and payout orders in one place." },
    "实时资金流水与统计参考。": { en: "Real-time fund flows and statistical reference." },
    "记录后台与关键业务操作。": { en: "Record admin and key business actions." },
    "充值单": { en: "Recharge Orders" },
    "消费单": { en: "Consumption Orders" },
    "兑现单": { en: "Payout Orders" },
    "全部": { en: "All" },
    "用户ID": { en: "User ID" },
    "账户概览": { en: "Account Overview" },
    "角色": { en: "Role" },
    "邮箱": { en: "Email" },
    "通知邮箱": { en: "Notification Email" },
    "账户状态": { en: "Account Status" },
    "已隐藏": { en: "Hidden" },
    "正常": { en: "Normal" },
    "账户密码已隐藏，管理员界面不会展示或导出明文密码。": { en: "Account password is hidden. The admin interface does not display or export plaintext passwords." },
    "资金": { en: "Funds" },
    "在线状态": { en: "Online Status" },
    "注册时间": { en: "Registration Time" },
    "返回控制台": { en: "Back to Console" },
    "返回用户分区": { en: "Back to Users" },
    "返回列表": { en: "Back to List" },
    "充值记录": { en: "Recharge Records" },
    "订单记录": { en: "Order Records" },
    "兑现记录": { en: "Payout Records" },
    "参数修正": { en: "Parameter Correction" },
    "封禁或注销": { en: "Ban or Delete" },
    "资金核对": { en: "Funds Audit" },
    "资金手动修改": { en: "Manual Funds Edit" },
    "保存资金修改": { en: "Save Funds Change" },
    "封禁": { en: "Ban" },
    "解封": { en: "Unban" },
    "注销": { en: "Delete" },
    "封禁时长": { en: "Ban Duration" },
    "3 个月": { en: "3 months" },
    "6 个月": { en: "6 months" },
    "1 年": { en: "1 year" },
    "3 年": { en: "3 years" },
    "5 年": { en: "5 years" },
    "10 年": { en: "10 years" },
    "输入二级密码": { en: "Enter Secondary Password" },
    "管理员密码": { en: "Admin Password" },
    "该分区需要二级密码才能打开。": { en: "This section requires a secondary password." },
    "管理员密码不正确。": { en: "Admin password is incorrect." },
    "该操作需要输入管理员密码。": { en: "This action requires the admin password." },
    "该操作需要输入账户密码。": { en: "This action requires your account password." },
    "密码不正确。": { en: "Incorrect password." },
    "验证码不正确。": { en: "Incorrect verification code." },
    "验证码已过期，请重新发送。": { en: "The verification code has expired. Please send a new one." },
    "验证码已发送": { en: "Code Sent" },
    "验证码已发送，请查看邮箱。": { en: "Verification code sent. Please check your inbox." },
    "正在发送验证码...": { en: "Sending verification code..." },
    "邮件接口未配置或暂不可用。": { en: "Email endpoint is not configured or is temporarily unavailable." },
    "演示验证码": { en: "Demo code" },
    "已退出登录": { en: "Signed Out" },
    "当前已回到客户模式。": { en: "You are back in Gamer Mode." },
    "当前已回到 Gamer 模式。": { en: "You are back in Gamer Mode." },
    "欢迎回来": { en: "Welcome Back" },
    "用户名已存在。": { en: "Username already exists." },
    "邮箱已被注册。": { en: "Email is already registered." },
    "请输入用户名、邮箱和密码。": { en: "Please enter username, email, and password." },
    "请输入有效邮箱。": { en: "Please enter a valid email." },
    "密码至少需要 6 位。": { en: "Password must be at least 6 characters." },
    "两次输入的密码不一致。": { en: "The two passwords do not match." },
    "请输入国家或地区。": { en: "Please enter country or region." },
    "请选择生日。": { en: "Please choose a birthday." },
    "邮箱或密码不正确。": { en: "Email or password is incorrect." },
    "账号或密码不正确。": { en: "Username or password is incorrect." },
    "该邮箱未注册。": { en: "This email is not registered." },
    "账户密码不正确。": { en: "Account password is incorrect." },
    "验证失败。": { en: "Verification Failed" },
    "请输入账户密码，或使用邮箱验证码完成验证。": { en: "Enter your account password or verify with an email code." },
    "修改用户名": { en: "Change Username" },
    "修改性别": { en: "Change Gender" },
    "头像预览": { en: "Avatar Preview" },
    "上传一张不大于 5MB 的图像，系统会在圆框内居中截取显示。": { en: "Upload an image up to 5MB. It will be centered and cropped in a circle." },
    "请先选择一张图像。": { en: "Please choose an image first." },
    "请选择图像文件。": { en: "Please choose an image file." },
    "图像读取失败，请换一张图片。": { en: "Image reading failed. Please choose another image." },
    "头像图片不能大于 5MB。": { en: "Avatar image cannot exceed 5MB." },
    "展示图片": { en: "Display Image" },
    "当前图片": { en: "Current Image" },
    "未上传图片": { en: "No Image Uploaded" },
    "选择图像": { en: "Choose Image" },
    "移除展示图片": { en: "Remove Display Image" },
    "展示图片不能大于 2MB。": { en: "Display image cannot exceed 2MB." },
    "仅支持图片文件，最大 2MB。": { en: "Image files only, up to 2MB." },
    "正在上传图片...": { en: "Uploading image..." },
    "图片已保存为本地数据。": { en: "Image saved as local data." },
    "图片上传失败，已保留为本地数据。": { en: "Image upload failed. Local data was kept." },
    "头像保存失败，请换用更小的图片。": { en: "Avatar saving failed. Please use a smaller image." },
    "头像已更新": { en: "Avatar Updated" },
    "头像已移除": { en: "Avatar Removed" },
    "用户名已更新": { en: "Username Updated" },
    "性别已更新": { en: "Gender Updated" },
    "修改密码验证": { en: "Change Password Verification" },
    "修改绑定邮箱验证": { en: "Change Email Verification" },
    "修改密码需要账户密码，或发送到原绑定邮箱的 6 位验证码。": { en: "Changing password requires your account password or a 6-digit code sent to the original email." },
    "修改绑定邮箱需要账户密码，或发送到原绑定邮箱的 6 位验证码。": { en: "Changing bound email requires your account password or a 6-digit code sent to the original email." },
    "当前账户没有可用邮箱。": { en: "This account has no available email." },
    "当前绑定邮箱：": { en: "Current bound email: " },
    "新邮箱": { en: "New Email" },
    "新密码": { en: "New Password" },
    "确认新密码": { en: "Confirm New Password" },
    "密码已修改": { en: "Password Changed" },
    "绑定邮箱已修改": { en: "Bound Email Changed" },
    "已向原邮箱和新邮箱发送英文通知。": { en: "English notifications were sent to the old and new email addresses." },
    "请输入有效通知邮箱。": { en: "Please enter a valid notification email." },
    "联系设置已保存": { en: "Contact Settings Saved" },
    "邮件通知语言固定为英语。": { en: "Email notifications are always sent in English." },
    "通知邮箱默认为绑定邮箱，可单独修改。所有邮件通知均以英语发送。": { en: "Notification email defaults to the bound email and can be changed. All email notifications are sent in English." },
    "提交入职申请": { en: "Submit Vector Application" },
    "提交 Vector 申请": { en: "Submit Vector Application" },
    "成为 Vector": { "zh-TW": "成為 Vector", en: "Become a Vector", fr: "Devenir Vector", ja: "Vector になる", ko: "Vector 되기", es: "Convertirse en Vector" },
    "退出后将回到 Gamer 模式。": { "zh-TW": "登出後將回到 Gamer 模式。", en: "After signing out, you will return to Gamer Mode.", fr: "Après déconnexion, vous reviendrez au mode Gamer.", ja: "ログアウト後は Gamer モードに戻ります。", ko: "로그아웃하면 Gamer 모드로 돌아갑니다.", es: "Al cerrar sesión volverás al modo Gamer." },
    "管理账户资料、安全验证、通知邮箱与 Vector 申请。": { "zh-TW": "管理帳戶資料、安全驗證、通知信箱與 Vector 申請。", en: "Manage account details, security verification, notification email, and Vector application.", fr: "Gérer les informations du compte, la sécurité, l'e-mail de notification et la candidature Vector.", ja: "アカウント情報、認証、通知メール、Vector 申請を管理します。", ko: "계정 정보, 보안 인증, 알림 이메일, Vector 신청을 관리합니다.", es: "Gestiona datos de cuenta, seguridad, email de notificación y solicitud Vector." },
    "陪玩/代打 Vector": { "zh-TW": "陪玩/代打 Vector", en: "Companion / Boosting Vector", fr: "Vector accompagnement / boosting", ja: "コンパニオン / 代行 Vector", ko: "동행 / 대리 Vector", es: "Vector de acompañamiento / boosting" },
    "申请方向": { en: "Application Direction" },
    "游戏经历与可服务项目": { en: "Game Experience and Services" },
    "联系邮箱或方式": { en: "Contact Email or Method" },
    "提交申请": { en: "Submit Application" },
    "入职申请已提交": { en: "Vector Application Submitted" },
    "Vector 申请已提交": { en: "Vector Application Submitted" },
    "管理员可在日志中查看记录。": { en: "Admins can view the record in logs." },
    "归档备份邮箱": { en: "Archive Backup Email" },
    "最近备份：": { en: "Latest backup: " },
    "指定备份邮箱": { en: "Set Backup Email" },
    "立即归档检查": { en: "Run Archive Check" },
    "设置归档备份邮箱": { en: "Set Archive Backup Email" },
    "备份邮箱": { en: "Backup Email" },
    "备份邮箱已保存": { en: "Backup Email Saved" },
    "请先设置备份邮箱": { en: "Set a Backup Email First" },
    "超过 30 天的日志和已关闭单号需要先发送备份。": { en: "Logs and closed order records older than 30 days must be backed up first." },
    "后端暂不可用": { en: "Backend Unavailable" },
    "归档清理需要连接后端和邮件服务。": { en: "Archive cleanup requires the backend and email service." },
    "归档失败": { en: "Archive Failed" },
    "归档检查完成": { en: "Archive Check Complete" },
    "输入消息，Enter 发送，Shift + Enter 换行": { en: "Type a message. Enter to send, Shift + Enter for a new line" },
    "待发送图片": { en: "Image to Send" },
    "移除图片": { en: "Remove Image" },
    "图片过大": { en: "Image Too Large" },
    "聊天图片请控制在 3MB 内。": { en: "Chat images must be under 3MB." },
    "编辑模式": { en: "Edit Mode" },
    "右键仍可编辑或删除，也可以使用这里的快捷按钮批量处理。": { en: "Right-click editing still works. You can also use these quick controls for batch actions." },
    "新增分类": { en: "Add Category" },
    "新增游戏分区": { en: "Add Game Section" },
    "新增商品": { en: "Add Product" },
    "批量管理": { en: "Batch Manage" },
    "退出批量": { en: "Exit Batch" },
    "全选": { en: "Select All" },
    "清空选择": { en: "Clear Selection" },
    "删除选中": { en: "Delete Selected" },
    "已选择": { en: "Selected" },
    "项": { en: "items" },
    "批量删除？": { en: "Batch Delete?" },
    "将删除已选内容，并同步删除其下级关联内容。": { en: "Selected content will be deleted, including related child content." },
    "请选择要删除的内容。": { en: "Select items to delete first." },
    "已进入批量管理": { en: "Batch Manage Enabled" },
    "已退出批量管理": { en: "Batch Manage Disabled" },
    "已删除选中内容": { en: "Selected Content Deleted" },
    "选择语言后，英文和简体中文使用本地翻译；其他语言会尝试使用内嵌 Google Translate。": { en: "English and Simplified Chinese use local translations; other languages try embedded Google Translate." }
  });

  function normalizeLanguageCode(code) {
    const value = String(code || "").trim();
    return Languages.some((item) => item.code === value) ? value : DefaultLanguage;
  }

  function activeLanguage() {
    return normalizeLanguageCode(localStorage.getItem(Keys.language) || DefaultLanguage);
  }

  function isLocalLanguage(code) {
    return LocalLanguageCodes.includes(normalizeLanguageCode(code));
  }

  function contentLanguage(code = activeLanguage()) {
    const normalized = normalizeLanguageCode(code);
    if (normalized === "zh-CN" || normalized === "zh-TW") {
      return "zh-CN";
    }
    return LocalContentLanguageCodes.includes(normalized) ? normalized : DefaultLanguage;
  }

  function reverseLocalPhrase(text, lang) {
    const entry = Object.entries(UiDictionary).find(([, value]) => value && value[lang] === text);
    return entry ? entry[0] : text;
  }

  function staticPhraseIn(text, lang = activeLanguage()) {
    const normalized = normalizeLanguageCode(lang);
    if (normalized === "zh-CN") {
      return reverseLocalPhrase(text, "en");
    }
    const exact = UiDictionary[text];
    if (exact && exact[normalized]) {
      return exact[normalized];
    }
    return text;
  }

  function localizeStaticPhrase(text) {
    const lang = activeLanguage();
    const staticResult = staticPhraseIn(text, lang);
    if (staticResult !== text) {
      return staticResult;
    }
    if (text.startsWith("语言选择：")) {
      return `${localizeStaticPhrase("语言选择")}：${text.slice("语言选择：".length)}`;
    }
    if (text.startsWith("当前：")) {
      const currentLabel = {
        "zh-TW": "目前",
        en: "Current",
        fr: "Actuel",
        ja: "現在",
        ko: "현재",
        es: "Actual"
      };
      return `${currentLabel[lang] || "当前"}：${text.slice("当前：".length)}`;
    }
    if (text.startsWith("预约 ")) {
      return `${localizeStaticPhrase("预约")} ${text.slice(3)}`;
    }
    return text;
  }

  function languageName(code, locale = activeLanguage()) {
    const language = Languages.find((item) => item.code === code);
    if (!language) {
      return code;
    }
    return language.names[locale] || language.label || language.nativeName;
  }

  function markNoTranslate(node) {
    if (!node || !node.classList) {
      return;
    }
    node.classList.add("notranslate");
    node.setAttribute("translate", "no");
  }

  function protectedText(text, className = "") {
    return h("span", {
      className: `${className} notranslate`.trim(),
      translate: "no",
      text
    });
  }

  function hasProtectedRoleTerm(text) {
    return /\b(?:Gamer|Vector)\b/.test(String(text || ""));
  }

  function financialText(value, className = "financial-value") {
    return protectedText(formatPrice(value), className);
  }

  const KnownContentTranslations = {
    "专业教练": "Professional Coaching",
    "职业思路、地图理解、枪法细节与排位规划一站提升。": "Improve professional decision-making, map knowledge, aim details, and ranked planning in one place.",
    "语音陪玩": "Voice Companion",
    "高质量语音陪伴，轻松开黑、上分、娱乐局都能安排。": "High-quality voice companionship for relaxed team play, climbing, and casual matches.",
    "雇佣兵": "Mercenary",
    "强力队友即时支援，攻坚、护航、目标执行更稳定。": "High-skill teammates on demand for pushes, escorting, and reliable objective execution.",
    "账号交易": "Account Trading",
    "精选游戏账号展示，信息清晰，交易流程可继续扩展。": "Curated game accounts with clear information and room to expand the transaction flow.",
    "《暗区突围》手游": "Arena Breakout Mobile",
    "手游端摸金、撤离、物资规划与战术协作服务。": "Mobile extraction, loot planning, evacuation routes, and tactical coordination services.",
    "《暗区突围》端游": "Arena Breakout PC",
    "端游射击节奏、装备配置、地图路线与组队服务。": "PC shooting tempo, gear setup, map routing, and squad services.",
    "《三角洲行动》手游": "Delta Force Mobile",
    "移动端战场协同、干员搭配、任务推进与段位服务。": "Mobile battlefield coordination, operator pairing, mission progress, and rank services.",
    "《三角洲行动》端游": "Delta Force PC",
    "端游攻防、载具配合、战术突破和高强度陪练。": "PC attack and defense, vehicle teamwork, tactical breakthroughs, and high-intensity practice.",
    "手游": "Mobile",
    "端游": "PC",
    "基础提升课": "Fundamentals Coaching",
    "教练根据你的对局习惯制定训练计划，覆盖地图理解、装备选择、枪法节奏和复盘建议。": "A coach builds a training plan around your match habits, covering map knowledge, gear choices, shooting rhythm, and review advice.",
    "90 分钟": "90 minutes",
    "入门": "Starter",
    "进阶冲分课": "Ranked Climb Coaching",
    "重点优化决策、队伍沟通、残局处理和高强度排位稳定性。": "Focused improvement for decision-making, team comms, clutch play, and ranked consistency.",
    "3 小时": "3 hours",
    "进阶": "Advanced",
    "录像复盘套餐": "VOD Review Package",
    "提交对局录像后获得细致复盘，标注关键失误、可复用打法与下一阶段训练重点。": "Submit match footage for a detailed review with key mistakes, reusable plays, and next-step training priorities.",
    "1 份报告": "1 report",
    "复盘": "Review",
    "周训练计划": "Weekly Training Plan",
    "连续训练安排，包含课前诊断、阶段目标、复盘和训练反馈。": "A continuous training schedule with pre-session diagnosis, stage goals, reviews, and training feedback.",
    "7 天": "7 days",
    "套餐": "Bundle",
    "双小时语音陪玩": "Two-Hour Voice Companion",
    "轻松开黑体验，支持娱乐、任务推进和基础协作，适合日常放松和熟悉地图。": "Relaxed team play for casual matches, task progress, and basic coordination while you unwind or learn maps.",
    "2 小时": "2 hours",
    "轻松": "Relaxed",
    "晚间黄金档陪玩": "Prime-Time Companion",
    "固定黄金时段服务，沟通稳定，适合组队上分、活动任务和连续开黑安排。": "Reliable prime-time sessions for ranked squads, event tasks, and planned team runs.",
    "热门": "Popular",
    "车队氛围组": "Squad Vibe Team",
    "多人语音车队陪玩，节奏轻快，兼顾胜率和氛围。": "Multi-person voice squad play with a light rhythm, balancing win rate and atmosphere.",
    "组队": "Squad",
    "新人熟悉路线": "Beginner Route Tour",
    "陪同熟悉地图路线、撤离点、任务节点和基础操作节奏。": "Guided practice for map routes, extraction points, task nodes, and basic operating rhythm.",
    "新人": "Newcomer",
    "强力护航单局": "One-Match Escort",
    "高水平队友协助完成单局目标，提供路线判断、交火支援和撤离保障。": "High-level teammates help complete one-match objectives with route calls, firefight support, and extraction cover.",
    "单局": "Single match",
    "即时": "Instant",
    "目标任务执行": "Objective Task Run",
    "围绕指定任务制定执行方案，包含队伍配合、路线推进和关键节点保护。": "An execution plan around a specified task, including team coordination, route progress, and key-node protection.",
    "3 单": "3 runs",
    "任务": "Task",
    "高强度攻坚套餐": "High-Intensity Push Package",
    "面向困难局和连续目标，提供更完整的团队支援与战术执行体验。": "Fuller team support and tactical execution for hard matches and continuous objectives.",
    "5 单": "5 runs",
    "攻坚": "Push",
    "排位护航组": "Ranked Escort Squad",
    "适合集中冲分，安排稳定车队与明确战术分工。": "Built for focused rank climbing with a stable squad and clear tactical roles.",
    "半日": "Half day",
    "排位": "Ranked",
    "入门成品账号": "Starter Ready Account",
    "适合快速入坑的基础账号，展示等级、常用资源和主要可用内容。": "A basic ready-to-use account for quick entry, showing level, common resources, and available content.",
    "即时咨询": "Instant consultation",
    "进阶收藏账号": "Advanced Collection Account",
    "拥有更完整资源和角色积累，适合想节省养成时间的玩家。": "A more complete account with accumulated resources and characters for players who want to save build time.",
    "客服确认": "Support confirmation",
    "稀有高配账号": "Rare High-Spec Account",
    "高价值账号展示项，后续可扩展为资质审核、担保交易和客服确认流程。": "A high-value account listing that can later support qualification checks, escrow, and support confirmation.",
    "专员审核": "Specialist review",
    "账号估值服务": "Account Valuation Service",
    "根据资源、段位、皮肤、历史投入和市场情况给出参考估值。": "A reference valuation based on resources, rank, skins, historical spend, and market conditions.",
    "估值": "Valuation"
  };

  function localizedPair(en = "", zh = "") {
    const english = String(en || zh || "").trim();
    const chinese = String(zh || en || "").trim();
    return { en: english, "zh-CN": chinese };
  }

  function localizedI18n(values, fallback = "") {
    const lang = contentLanguage();
    if (values && typeof values === "object") {
      return values[lang] || values.en || values["zh-CN"] || fallback;
    }
    return fallback;
  }

  function knownContentPair(value = "") {
    const chinese = String(value || "").trim();
    return localizedPair(KnownContentTranslations[chinese] || chinese, chinese);
  }

  function ensureContentI18n(item, fields = ContentTextFields) {
    const next = { ...(item || {}) };
    fields.forEach((field) => {
      const key = `${field}I18n`;
      const existing = next[key] && typeof next[key] === "object" ? next[key] : {};
      const fallback = knownContentPair(next[field] || "");
      const en = String(existing.en || fallback.en || next[field] || "").trim();
      const zh = String(existing["zh-CN"] || existing.zh || fallback["zh-CN"] || next[field] || "").trim();
      next[key] = localizedPair(en, zh);
      next[field] = zh || en;
    });
    return next;
  }

  function localizedContent(item, field, fallback = "") {
    const key = `${field}I18n`;
    const values = item?.[key];
    const lang = contentLanguage();
    if (values && typeof values === "object") {
      return values[lang] || values.en || values["zh-CN"] || item?.[field] || fallback;
    }
    const pair = knownContentPair(item?.[field] || fallback);
    return pair[lang] || pair.en || pair["zh-CN"] || fallback;
  }

  function localizedOrderContent(order, field, fallback = "") {
    const values = order?.[`${field}I18n`];
    const lang = contentLanguage();
    if (values && typeof values === "object") {
      return values[lang] || values.en || values["zh-CN"] || order?.[field] || fallback;
    }
    return order?.[field] || fallback;
  }

  function contentValues(item, field) {
    const ensured = ensureContentI18n(item, [field]);
    return ensured[`${field}I18n`] || localizedPair();
  }

  function searchContentText(item, fields = ContentTextFields) {
    return fields.flatMap((field) => {
      const values = item?.[`${field}I18n`] || {};
      return [item?.[field], values.en, values["zh-CN"]];
    }).filter(Boolean).join(" ");
  }

  const StaffSections = [
    {
      id: "active",
      title: "现有单目",
      description: "查看当前进行中的订单，跟进交付进度和沟通状态。",
      icon: "fa-solid fa-list-check"
    },
    {
      id: "completed",
      title: "已结单目",
      description: "复查历史完成订单，确认结算、评价与售后记录。",
      icon: "fa-solid fa-circle-check"
    },
    {
      id: "reserved",
      title: "预约单目",
      description: "管理未来预约，确认服务时间、人员与 Gamer 备注。",
      icon: "fa-regular fa-calendar-check"
    },
    {
      id: "log",
      title: "个人日志",
      description: "记录本日工作进展、异常事项与交付备注。",
      icon: "fa-solid fa-pen-to-square"
    }
  ];

  const State = {
    route: { name: "home", params: {} },
    currentUser: null,
    mode: "customer",
    adminUnlocked: {},
    adminUserSearch: "",
    adminOrderSearch: "",
    adminOrderType: "all",
    adminBatch: {
      active: false,
      type: "",
      routeKey: "",
      selected: []
    }
  };

  const Dom = {};

  function $(selector) {
    return document.querySelector(selector);
  }

  function clear(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function append(parent, children) {
    children.flat(Infinity).forEach((child) => {
      if (child === null || child === undefined || child === false) {
        return;
      }
      if (child instanceof Node) {
        parent.appendChild(child);
        return;
      }
      parent.appendChild(document.createTextNode(String(child)));
    });
  }

  function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) {
        return;
      }
      if (key === "className") {
        node.className = value;
        return;
      }
      if (key === "text") {
        node.textContent = value;
        return;
      }
      if (key === "value") {
        node.value = value;
        return;
      }
      if (key === "dataset") {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          if (dataValue !== undefined && dataValue !== null) {
            node.dataset[dataKey] = String(dataValue);
          }
        });
        return;
      }
      if (key === "ariaLabel") {
        node.setAttribute("aria-label", value);
        return;
      }
      if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        node.addEventListener(eventName, (event) => {
          const loader = eventName === "click" && shouldShowInteractionLoader(node)
            ? UI.beginInteractionLoading(node)
            : null;
          try {
            const result = value(event);
            if (result && typeof result.then === "function") {
              result.finally(() => loader?.done());
            } else {
              loader?.doneSoon();
            }
            return result;
          } catch (error) {
            loader?.done();
            throw error;
          }
        });
        return;
      }
      if (key === "required") {
        node.required = Boolean(value);
        return;
      }
      node.setAttribute(key, value === true ? "" : value);
    });
    append(node, children);
    return node;
  }

  function icon(className) {
    return h("i", { className, "aria-hidden": "true" });
  }

  function shouldShowInteractionLoader(node) {
    if (!node || node.dataset?.noLoading === "true") {
      return false;
    }
    if (node.disabled || node.getAttribute?.("aria-disabled") === "true") {
      return false;
    }
    return node.matches?.("button, [role='button'], .button, .icon-button, .account-button, .avatar-button");
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
  }

  function userEmail(user) {
    if (user?.email) {
      return normalizeEmail(user.email);
    }
    const legacyName = normalize(user?.username).replace(/[^a-z0-9._+-]/g, "");
    return legacyName ? `${legacyName}@impulse.local` : "";
  }

  function padNumber(value, length) {
    return String(value).padStart(length, "0");
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

  function utc8DayKey(value) {
    const parts = utc8Parts(value);
    return `${parts.year}-${padNumber(parts.month, 2)}-${padNumber(parts.day, 2)}`;
  }

  function createUserPublicId(createdAt, sequence) {
    const parts = utc8Parts(createdAt);
    return [
      padNumber(parts.month, 2),
      padNumber(parts.day, 2),
      padNumber(parts.year, 4),
      padNumber(parts.hour, 2),
      padNumber(parts.minute, 2),
      padNumber(parts.second, 2),
      padNumber(sequence, 4)
    ].join("");
  }

  function defaultEmailNotices() {
    return Object.fromEntries(EmailNoticeTypes.map((item) => [item.key, true]));
  }

  function clampUserLevel(value) {
    const level = Math.trunc(Number(value) || 0);
    return Math.max(0, Math.min(5, level));
  }

  function genderLabel(value) {
    return (GenderOptions.find((item) => item.value === value) || GenderOptions[0]).label;
  }

  function profileAvatarText(profile, username = "") {
    const avatar = String(profile?.avatar || "").trim();
    if (avatar) {
      return avatar.slice(0, 4).toUpperCase();
    }
    return String(username || profile?.username || "U").slice(0, 2).toUpperCase();
  }

  function profileAvatarNode(profile, username = "", className = "profile-avatar") {
    const image = String(profile?.avatarImage || "").trim();
    return h("div", { className: `${className} notranslate`, translate: "no" },
      image
        ? h("img", { src: image, alt: "头像" })
        : profileAvatarText(profile, username)
    );
  }

  function cropAvatarFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve({ image: "", name: "" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        reject(new Error("请选择图像文件。"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("头像图片不能大于 5MB。"));
        return;
      }
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.addEventListener("load", () => {
        const canvas = document.createElement("canvas");
        const outputSize = 512;
        const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
        const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
        const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
        canvas.width = outputSize;
        canvas.height = outputSize;
        const context = canvas.getContext("2d");
        context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);
        URL.revokeObjectURL(objectUrl);
        resolve({ image: canvas.toDataURL("image/jpeg", 0.88), name: file.name });
      });
      image.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("图像读取失败，请换一张图片。"));
      });
      image.src = objectUrl;
    });
  }

  function readDisplayImageFile(file, maxBytes = DisplayImageMaxBytes) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve({ image: "", name: "" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        reject(new Error("请选择图像文件。"));
        return;
      }
      if (file.size > maxBytes) {
        reject(new Error("展示图片不能大于 2MB。"));
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        resolve({ image: String(reader.result || ""), name: file.name });
      });
      reader.addEventListener("error", () => {
        reject(new Error("图像读取失败，请换一张图片。"));
      });
      reader.readAsDataURL(file);
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function timestampMs(value) {
    const time = new Date(value || "").getTime();
    return Number.isFinite(time) ? time : 0;
  }

  function formatPrice(value) {
    const number = Number(value) || 0;
    const locale = contentLanguage() === "zh-CN" ? "zh-CN" : "en-US";
    const unit = contentLanguage() === "zh-CN" ? "积分" : "pts";
    return `${number.toLocaleString(locale, { minimumFractionDigits: 0 })} ${unit}`;
  }

  function formatDate(value) {
    if (!value) {
      return localizeStaticPhrase("未设置");
    }
    return new Date(value).toLocaleString(contentLanguage() === "zh-CN" ? "zh-CN" : "en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatFullDate(value) {
    if (!value) {
      return localizeStaticPhrase("未设置");
    }
    return new Date(value).toLocaleString(contentLanguage() === "zh-CN" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function addMonths(date, months) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + Number(months));
    return next;
  }

  function isBanned(profile) {
    return Boolean(profile && profile.bannedUntil && new Date(profile.bannedUntil) > new Date());
  }

  function isProfileOnline(profile) {
    if (!profile || profile.deleted) {
      return false;
    }
    if (State.currentUser && normalize(State.currentUser.username) === normalize(profile.username)) {
      return true;
    }
    if (!profile.lastOnlineAt) {
      return false;
    }
    const lastSeen = new Date(profile.lastOnlineAt);
    return Number.isFinite(lastSeen.getTime()) && Date.now() - lastSeen.getTime() <= OnlineWindowMs;
  }

  function isAutoCancelDue(order, now = new Date()) {
    if (!order || order.status !== "pending" || order.handledBy || order.refundedAt || !order.autoCancelAt) {
      return false;
    }
    const deadline = new Date(order.autoCancelAt);
    return Number.isFinite(deadline.getTime()) && deadline <= now;
  }

  function isRushBreached(order, now = new Date()) {
    const rush = order?.rush;
    if (!rush || rush.status !== "accepted" || !rush.deadlineAt || order.status !== "processing") {
      return false;
    }
    const deadline = new Date(rush.deadlineAt);
    return Number.isFinite(deadline.getTime()) && deadline < now;
  }

  function canReturnOrder(order, now = new Date()) {
    if (!order || order.type !== "order" || order.status !== "processing" || !order.handledBy || order.returnRefundedAt || order.settledAt) {
      return false;
    }
    const acceptedAt = order.acceptedAt ? new Date(order.acceptedAt) : null;
    const withinWindow = acceptedAt && Number.isFinite(acceptedAt.getTime()) && now - acceptedAt <= ReturnWindowMs;
    const rushAllowsReturn = ["breached", "continue_requested", "continue_declined"].includes(order.rush?.status);
    return Boolean(withinWindow || rushAllowsReturn);
  }

  function rushStatusLabel(rush) {
    if (!rush) {
      return "";
    }
    const labels = {
      pending: "加急待 Vector 确认",
      accepted: "加急已接受",
      declined: "加急已拒绝",
      breached: "加急已违约",
      continue_requested: "Vector 申请继续完成",
      continued: "Gamer 已同意继续",
      continue_declined: "Gamer 拒绝继续"
    };
    return labels[rush.status] ? localizeStaticPhrase(labels[rush.status]) : "";
  }

  function mailboxCategory(categoryId) {
    return MailboxCategories.find((item) => item.id === categoryId) || MailboxCategories[1];
  }

  function mailboxNoticeBody(profile, notice, context = {}) {
    return [
      `Hello ${profile?.username || "there"},`,
      context.orderId ? `Order ID: ${context.orderId}.` : "",
      context.itemName ? `Item: ${context.itemName}.` : "",
      context.amount ? `Amount: ${context.amount}.` : "",
      "This notice is also stored in your IMPULSE J in-app mailbox and cannot be unsent."
    ].filter(Boolean).join(" ");
  }

  function chatMailboxBody(order, message) {
    const sender = message.sender || "SYSTEM";
    const content = message.text
      ? message.text
      : message.imageData
        ? "[Image attachment]"
        : "[No text content]";
    return [
      `Order ID: ${order?.id || "unknown"}.`,
      `From: ${sender}.`,
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
    if (!senderKey || !participants.some((name) => normalize(name) === senderKey)) {
      return participants;
    }
    return participants.filter((name) => normalize(name) !== senderKey);
  }

  function userStatus(profile) {
    if (!profile || profile.deleted) {
      return localizeStaticPhrase("已注销");
    }
    if (isBanned(profile)) {
      return `${localizeStaticPhrase("封禁")} ${formatDate(profile.bannedUntil)}`;
    }
    if (State.currentUser && State.currentUser.username === profile.username) {
      return localizeStaticPhrase("在线");
    }
    return isProfileOnline(profile) ? localizeStaticPhrase("在线") : localizeStaticPhrase("离线");
  }

  const Storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
      if (typeof window.__impulseBackendSync === "function") {
        window.__impulseBackendSync(key);
      }
    },
    remove(key) {
      localStorage.removeItem(key);
    }
  };

  const Verification = {
    codes: {},
    key(purpose, email) {
      return `${purpose}:${normalizeEmail(email)}`;
    },
    generate(purpose, email) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      this.codes[this.key(purpose, email)] = {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000
      };
      return code;
    },
    verify(purpose, email, code) {
      const record = this.codes[this.key(purpose, email)];
      if (!record || Date.now() > record.expiresAt) {
        return { ok: false, message: "验证码已过期，请重新发送。" };
      }
      if (String(code || "").trim() !== record.code) {
        return { ok: false, message: "验证码不正确。" };
      }
      delete this.codes[this.key(purpose, email)];
      return { ok: true };
    }
  };

  const Mail = {
    endpoint: "/api/send-email",
    escapeHtml(value) {
      return String(value || "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      })[char]);
    },
    htmlFromText(text) {
      return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;white-space:pre-wrap;">${this.escapeHtml(text)}</div>`;
    },
    async send(to, subject, text, html = "", attachments = []) {
      if (!isEmail(to) || !subject || !text) {
        return { ok: false, configured: false, error: "Invalid email payload." };
      }
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: normalizeEmail(to),
            subject,
            text,
            html: html || this.htmlFromText(text),
            attachments
          })
        });
        const result = await response.json().catch(() => ({}));
        return {
          ok: response.ok && result.ok,
          configured: result.configured !== false,
          id: result.id || "",
          error: result.error || ""
        };
      } catch (error) {
        return { ok: false, configured: false, error: error.message || "Email endpoint is unavailable." };
      }
    },
    async sendVerificationCode(to, code) {
      const subject = "Your IMPULSE J verification code";
      const text = [
        `Your IMPULSE J verification code is ${code}.`,
        "It expires in 5 minutes.",
        "If you did not request this code, you can ignore this email."
      ].join("\n");
      return this.send(to, subject, text);
    },
    sendEnglishEmail(to, subject, body, attachments = []) {
      return this.send(to, subject, body, "", attachments);
    }
  };

  const Backend = {
    endpoint: "/api/backend",
    bootstrapped: false,
    online: false,
    hydrating: false,
    storage: "unknown",
    syncTimer: null,
    managedKeys: new Set([Keys.users, Keys.profiles, Keys.categories, Keys.games, Keys.products, Keys.orders, Keys.orderChats, Keys.mailboxMessages, Keys.ledger, Keys.adminLogs, Keys.systemSettings]),
    token() {
      return localStorage.getItem(Keys.backendToken) || "";
    },
    setToken(token) {
      if (token) {
        localStorage.setItem(Keys.backendToken, token);
      } else {
        localStorage.removeItem(Keys.backendToken);
      }
    },
    snapshot() {
      return {
        users: Storage.get(Keys.users, []),
        profiles: Storage.get(Keys.profiles, []),
        categories: Storage.get(Keys.categories, []),
        games: Storage.get(Keys.games, {}),
        products: Storage.get(Keys.products, {}),
        orders: Storage.get(Keys.orders, []),
        orderChats: Storage.get(Keys.orderChats, {}),
        mailboxMessages: Storage.get(Keys.mailboxMessages, {}),
        ledger: Storage.get(Keys.ledger, []),
        adminLogs: Storage.get(Keys.adminLogs, []),
        systemSettings: Storage.get(Keys.systemSettings, {})
      };
    },
    mergeArrayBy(localItems = [], remoteItems = [], keyFn) {
      const merged = new Map();
      (Array.isArray(localItems) ? localItems : []).forEach((item) => {
        const key = keyFn(item);
        if (key) merged.set(key, item);
      });
      (Array.isArray(remoteItems) ? remoteItems : []).forEach((item) => {
        const key = keyFn(item);
        if (key) merged.set(key, { ...(merged.get(key) || {}), ...item });
      });
      return Array.from(merged.values());
    },
    mergeRecordLists(localRecord = {}, remoteRecord = {}) {
      const result = { ...(localRecord || {}) };
      Object.entries(remoteRecord || {}).forEach(([key, remoteList]) => {
        const localList = Array.isArray(result[key]) ? result[key] : [];
        result[key] = this.mergeArrayBy(localList, remoteList, (item) => item?.id || `${item?.title || ""}:${item?.createdAt || ""}`);
      });
      return result;
    },
    mergeChats(localChats = {}, remoteChats = {}) {
      const result = { ...(localChats || {}) };
      Object.entries(remoteChats || {}).forEach(([orderId, messages]) => {
        result[orderId] = this.mergeArrayBy(result[orderId] || [], messages, (item) => item?.id || `${item?.sender || ""}:${item?.createdAt || ""}:${item?.text || ""}`);
      });
      return result;
    },
    mergeSnapshot(remoteSnapshot) {
      const local = this.snapshot();
      return {
        users: this.mergeArrayBy(local.users, remoteSnapshot.users, (item) => normalize(item?.username || item?.email)),
        profiles: this.mergeArrayBy(local.profiles, remoteSnapshot.profiles, (item) => item?.id || normalize(item?.username)),
        categories: this.mergeArrayBy(local.categories, remoteSnapshot.categories, (item) => item?.id),
        games: this.mergeRecordLists(local.games, remoteSnapshot.games),
        products: this.mergeRecordLists(local.products, remoteSnapshot.products),
        orders: this.mergeArrayBy(local.orders, remoteSnapshot.orders, (item) => item?.id),
        orderChats: this.mergeChats(local.orderChats, remoteSnapshot.orderChats),
        mailboxMessages: this.mergeChats(local.mailboxMessages, remoteSnapshot.mailboxMessages),
        ledger: this.mergeArrayBy(local.ledger, remoteSnapshot.ledger, (item) => item?.id),
        adminLogs: this.mergeArrayBy(local.adminLogs, remoteSnapshot.adminLogs, (item) => item?.id),
        systemSettings: {
          ...(remoteSnapshot.systemSettings || {}),
          ...(local.systemSettings || {}),
          backupEmail: local.systemSettings?.backupEmail || remoteSnapshot.systemSettings?.backupEmail || "",
          backupHistory: this.mergeArrayBy(local.systemSettings?.backupHistory, remoteSnapshot.systemSettings?.backupHistory, (item) => item?.id || `${item?.type || ""}:${item?.createdAt || ""}:${item?.subject || ""}`)
        }
      };
    },
    shouldPreserveLocal() {
      return this.storage === "temporary-file" || this.storage === "unknown";
    },
    hydrate(snapshot, options = {}) {
      if (!snapshot || typeof snapshot !== "object") {
        return;
      }
      const nextSnapshot = options.preserveLocal ? this.mergeSnapshot(snapshot) : snapshot;
      this.hydrating = true;
      try {
        if (Array.isArray(nextSnapshot.users)) Storage.set(Keys.users, nextSnapshot.users);
        if (Array.isArray(nextSnapshot.profiles)) Storage.set(Keys.profiles, nextSnapshot.profiles);
        if (Array.isArray(nextSnapshot.categories)) Storage.set(Keys.categories, nextSnapshot.categories);
        if (nextSnapshot.games && typeof nextSnapshot.games === "object") Storage.set(Keys.games, nextSnapshot.games);
        if (nextSnapshot.products && typeof nextSnapshot.products === "object") Storage.set(Keys.products, nextSnapshot.products);
        if (Array.isArray(nextSnapshot.orders)) Storage.set(Keys.orders, nextSnapshot.orders);
        if (nextSnapshot.orderChats && typeof nextSnapshot.orderChats === "object") Storage.set(Keys.orderChats, nextSnapshot.orderChats);
        if (nextSnapshot.mailboxMessages && typeof nextSnapshot.mailboxMessages === "object") Storage.set(Keys.mailboxMessages, nextSnapshot.mailboxMessages);
        if (Array.isArray(nextSnapshot.ledger)) Storage.set(Keys.ledger, nextSnapshot.ledger);
        if (Array.isArray(nextSnapshot.adminLogs)) Storage.set(Keys.adminLogs, nextSnapshot.adminLogs);
        if (nextSnapshot.systemSettings && typeof nextSnapshot.systemSettings === "object") Storage.set(Keys.systemSettings, nextSnapshot.systemSettings);
      } finally {
        this.hydrating = false;
      }
    },
    async request(action, payload = {}) {
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {})
          },
          body: JSON.stringify({ action, payload })
        });
        const result = await response.json().catch(() => ({}));
        this.online = response.ok || Boolean(result && result.message);
        if (result?.backend?.storage) {
          this.storage = result.backend.storage;
        }
        return { ...result, httpOk: response.ok };
      } catch (error) {
        this.online = false;
        return { ok: false, offline: true, message: error.message || "Backend unavailable." };
      }
    },
    async bootstrap() {
      const result = await this.request("bootstrap", { snapshot: this.snapshot() });
      this.bootstrapped = true;
      if (result.ok && result.snapshot) {
        this.hydrate(result.snapshot, { preserveLocal: this.shouldPreserveLocal() });
        return true;
      }
      return false;
    },
    queueSync(reason = "frontend-change") {
      if (!this.bootstrapped || this.hydrating || !this.online) {
        return;
      }
      window.clearTimeout(this.syncTimer);
      this.syncTimer = window.setTimeout(() => this.syncNow(reason), 650);
    },
    async syncNow(reason = "frontend-change") {
      if (this.hydrating || !this.online) {
        return;
      }
      await this.request("saveSnapshot", { reason, snapshot: this.snapshot() });
    },
    async sendVerification(purpose, email) {
      const result = await this.request("sendVerification", { purpose, email });
      return result;
    },
    async loginPassword(identity, password) {
      const result = await this.request("loginPassword", { identity, password });
      return this.applyAuthResult(result);
    },
    async loginCode(email, code) {
      const result = await this.request("loginCode", { email, code });
      return this.applyAuthResult(result);
    },
    async register(values) {
      const result = await this.request("register", values);
      return this.applyAuthResult(result);
    },
    applyMutationResult(result) {
      if (result?.ok && result.snapshot) {
        this.hydrate(result.snapshot, { preserveLocal: this.shouldPreserveLocal() });
      }
      return result;
    },
    async adjustFunds(profileId, amountPoints, reason, meta = {}) {
      return this.applyMutationResult(await this.request("adjustFunds", { profileId, amountPoints, reason, meta, snapshot: this.snapshot() }));
    },
    async createOrder(payload) {
      return this.applyMutationResult(await this.request("createOrder", { order: payload, snapshot: this.snapshot() }));
    },
    async updateOrderStatus(orderId, status) {
      return this.applyMutationResult(await this.request("updateOrderStatus", { orderId, status }));
    },
    async addChatMessage(orderId, message) {
      return this.applyMutationResult(await this.request("addChatMessage", { orderId, ...message }));
    },
    async uploadAsset(payload) {
      return this.request("uploadAsset", payload);
    },
    async setBackupEmail(email) {
      return this.applyMutationResult(await this.request("setBackupEmail", { email }));
    },
    async runRetentionCleanup() {
      return this.applyMutationResult(await this.request("runRetentionCleanup", {}));
    },
    async updatePassword(password) {
      return this.applyMutationResult(await this.request("updatePassword", { password }));
    },
    async updateEmail(email) {
      return this.applyMutationResult(await this.request("updateEmail", { email }));
    },
    applyAuthResult(result) {
      if (!result || !result.ok) {
        return result || { ok: false, message: "Backend unavailable." };
      }
      if (result.token) {
        this.setToken(result.token);
      }
      if (result.snapshot) {
        this.hydrate(result.snapshot, { preserveLocal: this.shouldPreserveLocal() });
      }
      if (result.user) {
        Session.start(result.user, { skipBackendLog: true });
      }
      return { ok: true };
    },
    async logout() {
      await this.request("logout", {});
      this.setToken("");
    }
  };

  window.__impulseBackendSync = (key) => {
    if (Backend.managedKeys.has(key)) {
      Backend.queueSync(key);
    }
  };

  const Seed = {
    categories() {
      return [
        {
          id: "coaching",
          title: "专业教练",
          description: "职业思路、地图理解、枪法细节与排位规划一站提升。",
          titleI18n: localizedPair("Professional Coaching", "专业教练"),
          descriptionI18n: localizedPair("Improve professional decision-making, map knowledge, aim details, and ranked planning in one place.", "职业思路、地图理解、枪法细节与排位规划一站提升。"),
          icon: "fa-solid fa-chalkboard-user"
        },
        {
          id: "companion",
          title: "语音陪玩",
          description: "高质量语音陪伴，轻松开黑、上分、娱乐局都能安排。",
          titleI18n: localizedPair("Voice Companion", "语音陪玩"),
          descriptionI18n: localizedPair("High-quality voice companionship for relaxed team play, climbing, and casual matches.", "高质量语音陪伴，轻松开黑、上分、娱乐局都能安排。"),
          icon: "fa-solid fa-headset"
        },
        {
          id: "mercenary",
          title: "雇佣兵",
          description: "强力队友即时支援，攻坚、护航、目标执行更稳定。",
          titleI18n: localizedPair("Mercenary", "雇佣兵"),
          descriptionI18n: localizedPair("High-skill teammates on demand for pushes, escorting, and reliable objective execution.", "强力队友即时支援，攻坚、护航、目标执行更稳定。"),
          icon: "fa-solid fa-helmet-battle"
        },
        {
          id: "accounts",
          title: "账号交易",
          description: "精选游戏账号展示，信息清晰，交易流程可继续扩展。",
          titleI18n: localizedPair("Account Trading", "账号交易"),
          descriptionI18n: localizedPair("Curated game accounts with clear information and room to expand the transaction flow.", "精选游戏账号展示，信息清晰，交易流程可继续扩展。"),
          icon: "fa-solid fa-id-card"
        }
      ];
    },
    games() {
      return [
        {
          slug: "arena-mobile",
          title: "《暗区突围》手游",
          description: "手游端摸金、撤离、物资规划与战术协作服务。",
          titleI18n: localizedPair("Arena Breakout Mobile", "《暗区突围》手游"),
          descriptionI18n: localizedPair("Mobile extraction, loot planning, evacuation routes, and tactical coordination services.", "手游端摸金、撤离、物资规划与战术协作服务。"),
          icon: "fa-solid fa-mobile-screen-button",
          platform: "手游",
          platformI18n: localizedPair("Mobile", "手游")
        },
        {
          slug: "arena-pc",
          title: "《暗区突围》端游",
          description: "端游射击节奏、装备配置、地图路线与组队服务。",
          titleI18n: localizedPair("Arena Breakout PC", "《暗区突围》端游"),
          descriptionI18n: localizedPair("PC shooting tempo, gear setup, map routing, and squad services.", "端游射击节奏、装备配置、地图路线与组队服务。"),
          icon: "fa-solid fa-desktop",
          platform: "端游",
          platformI18n: localizedPair("PC", "端游")
        },
        {
          slug: "delta-mobile",
          title: "《三角洲行动》手游",
          description: "移动端战场协同、干员搭配、任务推进与段位服务。",
          titleI18n: localizedPair("Delta Force Mobile", "《三角洲行动》手游"),
          descriptionI18n: localizedPair("Mobile battlefield coordination, operator pairing, mission progress, and rank services.", "移动端战场协同、干员搭配、任务推进与段位服务。"),
          icon: "fa-solid fa-crosshairs",
          platform: "手游",
          platformI18n: localizedPair("Mobile", "手游")
        },
        {
          slug: "delta-pc",
          title: "《三角洲行动》端游",
          description: "端游攻防、载具配合、战术突破和高强度陪练。",
          titleI18n: localizedPair("Delta Force PC", "《三角洲行动》端游"),
          descriptionI18n: localizedPair("PC attack and defense, vehicle teamwork, tactical breakthroughs, and high-intensity practice.", "端游攻防、载具配合、战术突破和高强度陪练。"),
          icon: "fa-solid fa-computer",
          platform: "端游",
          platformI18n: localizedPair("PC", "端游")
        }
      ];
    },
    productProfiles() {
      return {
        coaching: [
          ["基础提升课", "Fundamentals Coaching", 199, "教练根据你的对局习惯制定训练计划，覆盖地图理解、装备选择、枪法节奏和复盘建议。", "A coach builds a training plan around your match habits, covering map knowledge, gear choices, shooting rhythm, and review advice.", "90 分钟", "90 minutes", "入门", "Starter"],
          ["进阶冲分课", "Ranked Climb Coaching", 399, "重点优化决策、队伍沟通、残局处理和高强度排位稳定性。", "Focused improvement for decision-making, team comms, clutch play, and ranked consistency.", "3 小时", "3 hours", "进阶", "Advanced"],
          ["录像复盘套餐", "VOD Review Package", 129, "提交对局录像后获得细致复盘，标注关键失误、可复用打法与下一阶段训练重点。", "Submit match footage for a detailed review with key mistakes, reusable plays, and next-step training priorities.", "1 份报告", "1 report", "复盘", "Review"],
          ["周训练计划", "Weekly Training Plan", 699, "连续训练安排，包含课前诊断、阶段目标、复盘和训练反馈。", "A continuous training schedule with pre-session diagnosis, stage goals, reviews, and training feedback.", "7 天", "7 days", "套餐", "Bundle"]
        ],
        companion: [
          ["双小时语音陪玩", "Two-Hour Voice Companion", 88, "轻松开黑体验，支持娱乐、任务推进和基础协作，适合日常放松和熟悉地图。", "Relaxed team play for casual matches, task progress, and basic coordination while you unwind or learn maps.", "2 小时", "2 hours", "轻松", "Relaxed"],
          ["晚间黄金档陪玩", "Prime-Time Companion", 168, "固定黄金时段服务，沟通稳定，适合组队上分、活动任务和连续开黑安排。", "Reliable prime-time sessions for ranked squads, event tasks, and planned team runs.", "3 小时", "3 hours", "热门", "Popular"],
          ["车队氛围组", "Squad Vibe Team", 258, "多人语音车队陪玩，节奏轻快，兼顾胜率和氛围。", "Multi-person voice squad play with a light rhythm, balancing win rate and atmosphere.", "3 小时", "3 hours", "组队", "Squad"],
          ["新人熟悉路线", "Beginner Route Tour", 98, "陪同熟悉地图路线、撤离点、任务节点和基础操作节奏。", "Guided practice for map routes, extraction points, task nodes, and basic operating rhythm.", "2 小时", "2 hours", "新人", "Newcomer"]
        ],
        mercenary: [
          ["强力护航单局", "One-Match Escort", 99, "高水平队友协助完成单局目标，提供路线判断、交火支援和撤离保障。", "High-level teammates help complete one-match objectives with route calls, firefight support, and extraction cover.", "单局", "Single match", "即时", "Instant"],
          ["目标任务执行", "Objective Task Run", 229, "围绕指定任务制定执行方案，包含队伍配合、路线推进和关键节点保护。", "An execution plan around a specified task, including team coordination, route progress, and key-node protection.", "3 单", "3 runs", "任务", "Task"],
          ["高强度攻坚套餐", "High-Intensity Push Package", 369, "面向困难局和连续目标，提供更完整的团队支援与战术执行体验。", "Fuller team support and tactical execution for hard matches and continuous objectives.", "5 单", "5 runs", "攻坚", "Push"],
          ["排位护航组", "Ranked Escort Squad", 499, "适合集中冲分，安排稳定车队与明确战术分工。", "Built for focused rank climbing with a stable squad and clear tactical roles.", "半日", "Half day", "排位", "Ranked"]
        ],
        accounts: [
          ["入门成品账号", "Starter Ready Account", 299, "适合快速入坑的基础账号，展示等级、常用资源和主要可用内容。", "A basic ready-to-use account for quick entry, showing level, common resources, and available content.", "即时咨询", "Instant consultation", "入门", "Starter"],
          ["进阶收藏账号", "Advanced Collection Account", 899, "拥有更完整资源和角色积累，适合想节省养成时间的玩家。", "A more complete account with accumulated resources and characters for players who want to save build time.", "客服确认", "Support confirmation", "进阶", "Advanced"],
          ["稀有高配账号", "Rare High-Spec Account", 1999, "高价值账号展示项，后续可扩展为资质审核、担保交易和客服确认流程。", "A high-value account listing that can later support qualification checks, escrow, and support confirmation.", "专员审核", "Specialist review", "稀有", "Rare"],
          ["账号估值服务", "Account Valuation Service", 59, "根据资源、段位、皮肤、历史投入和市场情况给出参考估值。", "A reference valuation based on resources, rank, skins, historical spend, and market conditions.", "1 份报告", "1 report", "估值", "Valuation"]
        ]
      };
    },
    all() {
      const categories = this.categories();
      const gameTemplates = this.games();
      const profiles = this.productProfiles();
      const games = {};
      const products = {};

      categories.forEach((category) => {
        games[category.id] = gameTemplates.map((game) => ({
          id: `${category.id}-${game.slug}`,
          title: game.title,
          description: game.description,
          titleI18n: game.titleI18n,
          descriptionI18n: game.descriptionI18n,
          icon: game.icon,
          platform: game.platform,
          platformI18n: game.platformI18n
        }));

        games[category.id].forEach((game) => {
          products[game.id] = profiles[category.id].map(([titleZh, titleEn, price, descriptionZh, descriptionEn, durationZh, durationEn, badgeZh, badgeEn], index) => ({
            id: `${game.id}-p${index + 1}`,
            title: `${game.title} · ${titleZh}`,
            titleI18n: localizedPair(`${game.titleI18n.en} · ${titleEn}`, `${game.title} · ${titleZh}`),
            description: descriptionZh,
            descriptionI18n: localizedPair(descriptionEn, descriptionZh),
            price,
            duration: durationZh,
            durationI18n: localizedPair(durationEn, durationZh),
            badge: badgeZh,
            badgeI18n: localizedPair(badgeEn, badgeZh),
            icon: category.icon
          }));
        });
      });

      return { categories, games, products };
    }
  };

  const Data = {
    initialize() {
      if (!Array.isArray(Storage.get(Keys.users, null))) {
        Storage.set(Keys.users, []);
      }
      if (!Array.isArray(Storage.get(Keys.orders, null))) {
        Storage.set(Keys.orders, []);
      }
      if (!Storage.get(Keys.orderChats, null) || Array.isArray(Storage.get(Keys.orderChats, null))) {
        Storage.set(Keys.orderChats, {});
      }
      if (!Storage.get(Keys.mailboxMessages, null) || typeof Storage.get(Keys.mailboxMessages, null) !== "object" || Array.isArray(Storage.get(Keys.mailboxMessages, null))) {
        Storage.set(Keys.mailboxMessages, {});
      }
      if (!Array.isArray(Storage.get(Keys.ledger, null))) {
        Storage.set(Keys.ledger, []);
      }
      if (!Array.isArray(Storage.get(Keys.adminLogs, null))) {
        Storage.set(Keys.adminLogs, []);
      }
      if (!Storage.get(Keys.systemSettings, null) || typeof Storage.get(Keys.systemSettings, null) !== "object" || Array.isArray(Storage.get(Keys.systemSettings, null))) {
        Storage.set(Keys.systemSettings, { backupEmail: "", backupHistory: [] });
      }

      const categories = Storage.get(Keys.categories, null);
      if (!Array.isArray(categories) || categories.length === 0) {
        this.resetContent();
        return;
      }

      const games = Storage.get(Keys.games, {});
      const products = Storage.get(Keys.products, {});
      categories.forEach((category) => {
        if (!Array.isArray(games[category.id])) {
          games[category.id] = [];
        }
        games[category.id].forEach((game) => {
          if (!Array.isArray(products[game.id])) {
            products[game.id] = [];
          }
        });
      });
      Storage.set(Keys.games, games);
      Storage.set(Keys.products, products);
      this.ensureContentI18n();
      Storage.set(Keys.dataVersion, 3);
      this.ensureProfiles();
      this.pruneExpiredChats();
    },
    resetContent() {
      const seed = Seed.all();
      Storage.set(Keys.categories, seed.categories);
      Storage.set(Keys.games, seed.games);
      Storage.set(Keys.products, seed.products);
      Storage.set(Keys.dataVersion, 3);
      this.ensureProfiles();
      this.pruneExpiredChats();
    },
    users() {
      return Storage.get(Keys.users, []);
    },
    allUsers() {
      return [...BuiltInUsers, ...this.users()];
    },
    findUser(username) {
      return this.allUsers().find((user) => normalize(user.username) === normalize(username));
    },
    findUserByEmail(email) {
      return this.allUsers().find((user) => userEmail(user) === normalizeEmail(email));
    },
    saveUser(user) {
      const users = this.users();
      users.push({ ...user, email: normalizeEmail(user.email), createdAt: user.createdAt || new Date().toISOString() });
      Storage.set(Keys.users, users);
      this.ensureProfiles();
      this.log("用户注册", `${user.username} 注册为${RoleDisplayNames[user.role] || "Gamer"}`);
    },
    profiles() {
      return Storage.get(Keys.profiles, []);
    },
    saveProfiles(profiles) {
      Storage.set(Keys.profiles, profiles);
    },
    ledger() {
      return Storage.get(Keys.ledger, []);
    },
    saveLedger(ledger) {
      Storage.set(Keys.ledger, ledger);
    },
    chats() {
      return Storage.get(Keys.orderChats, {});
    },
    saveChats(chats) {
      Storage.set(Keys.orderChats, chats);
    },
    mailboxes() {
      const boxes = Storage.get(Keys.mailboxMessages, {});
      return boxes && typeof boxes === "object" && !Array.isArray(boxes) ? boxes : {};
    },
    saveMailboxes(mailboxes) {
      Storage.set(Keys.mailboxMessages, mailboxes && typeof mailboxes === "object" && !Array.isArray(mailboxes) ? mailboxes : {});
    },
    mailbox(username) {
      const key = normalize(username);
      return (this.mailboxes()[key] || [])
        .filter((message) => !message.deletedAt)
        .slice()
        .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
    },
    unreadMailboxCount(username) {
      return this.mailbox(username).filter((message) => !message.readAt).length;
    },
    addMailboxMessage(username, payload = {}) {
      const recipient = this.findUser(username);
      const recipientUsername = recipient?.username || username;
      if (!recipientUsername) {
        return null;
      }
      const key = normalize(recipientUsername);
      if (!key) {
        return null;
      }
      const now = new Date().toISOString();
      const category = mailboxCategory(payload.category || "system").id;
      const body = String(payload.body || payload.preview || "").trim();
      const entry = {
        id: payload.id || createId("mail"),
        recipientUsername,
        category,
        subject: String(payload.subject || "系统通知").trim(),
        preview: String(payload.preview || body.slice(0, 120) || "系统通知").trim(),
        body,
        sender: String(payload.sender || "IMPULSE J System").trim(),
        source: String(payload.source || "system").trim(),
        sourceId: String(payload.sourceId || "").trim(),
        orderId: String(payload.orderId || "").trim(),
        readAt: payload.readAt || "",
        createdAt: payload.createdAt || now
      };
      const boxes = this.mailboxes();
      const list = Array.isArray(boxes[key]) ? boxes[key] : [];
      boxes[key] = [entry, ...list.filter((item) => item.id !== entry.id)];
      this.saveMailboxes(boxes);
      return entry;
    },
    markMailboxRead(username, messageId) {
      const key = normalize(username);
      if (!key || !messageId) {
        return null;
      }
      const boxes = this.mailboxes();
      const list = Array.isArray(boxes[key]) ? boxes[key] : [];
      let selected = null;
      const now = new Date().toISOString();
      boxes[key] = list.map((message) => {
        if (message.id !== messageId) {
          return message;
        }
        selected = { ...message, readAt: message.readAt || now };
        return selected;
      });
      this.saveMailboxes(boxes);
      return selected;
    },
    markMailboxCategoryRead(username, categoryId = "all") {
      const key = normalize(username);
      if (!key) {
        return 0;
      }
      const boxes = this.mailboxes();
      const list = Array.isArray(boxes[key]) ? boxes[key] : [];
      const now = new Date().toISOString();
      let updated = 0;
      boxes[key] = list.map((message) => {
        if ((categoryId === "all" || message.category === categoryId) && !message.deletedAt && !message.readAt) {
          updated += 1;
          return { ...message, readAt: now };
        }
        return message;
      });
      this.saveMailboxes(boxes);
      return updated;
    },
    deleteReadMailboxMessages(username, categoryId = "all") {
      const key = normalize(username);
      if (!key) {
        return 0;
      }
      const boxes = this.mailboxes();
      const list = Array.isArray(boxes[key]) ? boxes[key] : [];
      const now = new Date().toISOString();
      let deleted = 0;
      boxes[key] = list.map((message) => {
        if (!message.deletedAt && message.readAt && (categoryId === "all" || message.category === categoryId)) {
          deleted += 1;
          return { ...message, deletedAt: now };
        }
        return message;
      });
      this.saveMailboxes(boxes);
      return deleted;
    },
    addChatMailboxNotifications(order, message) {
      chatMailboxRecipients(order, message).forEach((username) => {
        this.addMailboxMessage(username, {
          category: "chat",
          subject: message.sender === "SYSTEM" || message.type === "system" ? "订单聊天更新" : "新聊天消息",
          preview: message.text || (message.imageData ? "[Image attachment]" : "订单聊天更新"),
          body: chatMailboxBody(order, message),
          sender: message.sender || "SYSTEM",
          source: "chat",
          sourceId: message.id,
          orderId: order?.id || ""
        });
      });
    },
    chatMessages(orderId) {
      return this.chats()[orderId] || [];
    },
    pruneExpiredChats(now = Date.now()) {
      const cutoff = now - ChatRetentionMs;
      const chats = this.chats();
      let changed = false;
      Object.keys(chats).forEach((orderId) => {
        const list = Array.isArray(chats[orderId]) ? chats[orderId] : [];
        const next = list.filter((message) => {
          const time = new Date(message.createdAt || "").getTime();
          return Number.isFinite(time) && time >= cutoff;
        });
        if (next.length !== list.length) {
          changed = true;
          if (next.length) {
            chats[orderId] = next;
          } else {
            delete chats[orderId];
          }
        }
      });
      if (changed) {
        this.saveChats(chats);
      }
      return changed;
    },
    addChatMessage(orderId, message) {
      const chats = this.chats();
      const sender = message.sender || (State.currentUser ? State.currentUser.username : "SYSTEM");
      const entry = {
        id: createId("msg"),
        orderId,
        sender,
        role: State.currentUser ? State.currentUser.role : "system",
        type: "text",
        text: "",
        imageData: "",
        readBy: sender === "SYSTEM" ? ["SYSTEM"] : [sender],
        readAt: sender === "SYSTEM" ? { SYSTEM: new Date().toISOString() } : { [sender]: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        ...message
      };
      chats[orderId] = [...(chats[orderId] || []), entry];
      this.saveChats(chats);
      this.addChatMailboxNotifications(this.orderById(orderId), entry);
      return entry;
    },
    markChatRead(orderId, username) {
      if (!username) {
        return;
      }
      const chats = this.chats();
      const now = new Date().toISOString();
      chats[orderId] = (chats[orderId] || []).map((message) => {
        if (message.type === "system" || normalize(message.sender) === normalize(username)) {
          return message;
        }
        const readBy = Array.isArray(message.readBy) ? message.readBy : [];
        if (readBy.some((item) => normalize(item) === normalize(username))) {
          return message;
        }
        return {
          ...message,
          readBy: [...readBy, username],
          readAt: { ...(message.readAt || {}), [username]: now }
        };
      });
      this.saveChats(chats);
    },
    unreadChatCount(orderId, username) {
      if (!username) {
        return 0;
      }
      return this.chatMessages(orderId).filter((message) => {
        if (message.type === "system" || normalize(message.sender) === normalize(username)) {
          return false;
        }
        const readBy = Array.isArray(message.readBy) ? message.readBy : [];
        return !readBy.some((item) => normalize(item) === normalize(username));
      }).length;
    },
    adminLogs() {
      return Storage.get(Keys.adminLogs, []);
    },
    saveAdminLogs(logs) {
      Storage.set(Keys.adminLogs, logs);
    },
    systemSettings() {
      const settings = Storage.get(Keys.systemSettings, {});
      return {
        backupEmail: normalizeEmail(settings.backupEmail || ""),
        backupHistory: Array.isArray(settings.backupHistory) ? settings.backupHistory : []
      };
    },
    saveSystemSettings(settings) {
      const next = {
        ...this.systemSettings(),
        ...(settings || {})
      };
      Storage.set(Keys.systemSettings, {
        ...next,
        backupEmail: normalizeEmail(next.backupEmail || "")
      });
    },
    log(action, detail = "") {
      const actor = State.currentUser ? State.currentUser.username : "SYSTEM";
      const log = {
        id: createId("log"),
        action,
        detail,
        actor,
        createdAt: new Date().toISOString()
      };
      Storage.set(Keys.adminLogs, [log, ...this.adminLogs()]);
      return log;
    },
    ensureProfiles() {
      const existing = this.profiles();
      const byUsername = new Map(existing.map((profile) => [normalize(profile.username), profile]));
      const next = [];
      this.allUsers().forEach((user) => {
        if (user.role === "admin") {
          return;
        }
        const key = normalize(user.username);
        const current = byUsername.get(key);
        next.push({
          id: current?.id || "",
          legacyId: current?.id || "",
          username: user.username,
          role: user.role || "customer",
          funds: Number(current?.funds) || 0,
          createdAt: current?.createdAt || user.createdAt || new Date().toISOString(),
          avatar: current?.avatar || "",
          avatarImage: current?.avatarImage || user.avatarImage || "",
          avatarImageName: current?.avatarImageName || user.avatarImageName || "",
          level: clampUserLevel(current?.level),
          countryRegion: current?.countryRegion || user.countryRegion || "未设置",
          birthday: current?.birthday || user.birthday || "",
          gender: current?.gender || user.gender || "unset",
          notificationEmail: current?.notificationEmail || userEmail(user),
          emailNotices: { ...defaultEmailNotices(), ...(current?.emailNotices || {}) },
          employmentApplication: current?.employmentApplication || null,
          bannedUntil: current?.bannedUntil || "",
          deleted: Boolean(current?.deleted),
          deletedAt: current?.deletedAt || "",
          lastOnlineAt: current?.lastOnlineAt || ""
        });
      });

      const idChanges = new Map();
      const usedIds = new Set();
      const groups = new Map();
      next.forEach((profile) => {
        const dayKey = utc8DayKey(profile.createdAt);
        groups.set(dayKey, [...(groups.get(dayKey) || []), profile]);
      });
      groups.forEach((profiles) => {
        profiles
          .slice()
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.username.localeCompare(b.username))
          .forEach((profile, index) => {
            const oldId = profile.legacyId;
            let nextId = UserIdPattern.test(profile.id) && !usedIds.has(profile.id)
              ? profile.id
              : createUserPublicId(profile.createdAt, index + 1);
            let sequence = index + 1;
            while (usedIds.has(nextId)) {
              sequence += 1;
              nextId = createUserPublicId(profile.createdAt, sequence);
            }
            profile.id = nextId;
            usedIds.add(nextId);
            if (oldId && oldId !== nextId) {
              idChanges.set(oldId, nextId);
            }
            delete profile.legacyId;
          });
      });

      if (idChanges.size) {
        Storage.set(Keys.ledger, this.ledger().map((entry) => (
          idChanges.has(entry.userId) ? { ...entry, userId: idChanges.get(entry.userId) } : entry
        )));
      }

      existing.forEach((profile) => {
        if (!next.some((item) => normalize(item.username) === normalize(profile.username))) {
          const preserved = { ...profile };
          if (!UserIdPattern.test(preserved.id || "")) {
            preserved.id = createUserPublicId(preserved.createdAt || new Date().toISOString(), next.length + 1);
          }
          preserved.emailNotices = { ...defaultEmailNotices(), ...(preserved.emailNotices || {}) };
          preserved.level = clampUserLevel(preserved.level);
          next.push(preserved);
        }
      });
      this.saveProfiles(next);
      return next;
    },
    profileByUsername(username) {
      return this.profiles().find((profile) => normalize(profile.username) === normalize(username));
    },
    profileById(profileId) {
      return this.profiles().find((profile) => profile.id === profileId);
    },
    saveProfile(profile) {
      this.saveProfiles(this.profiles().map((item) => (item.id === profile.id ? profile : item)));
    },
    currentProfile() {
      return State.currentUser ? this.profileByUsername(State.currentUser.username) : null;
    },
    updateStoredUser(username, patch) {
      const users = this.users();
      const index = users.findIndex((user) => normalize(user.username) === normalize(username));
      if (index < 0) {
        return { ok: false, message: "内置账号暂不支持修改该信息。" };
      }
      users[index] = { ...users[index], ...patch };
      Storage.set(Keys.users, users);
      return { ok: true, user: users[index] };
    },
    renameUser(oldUsername, newUsername) {
      const nextUsername = String(newUsername || "").trim();
      if (!nextUsername) {
        return { ok: false, message: "请输入新的用户名。" };
      }
      if (normalize(oldUsername) !== normalize(nextUsername) && this.findUser(nextUsername)) {
        return { ok: false, message: "用户名已存在。" };
      }
      const updated = this.updateStoredUser(oldUsername, { username: nextUsername });
      if (!updated.ok) {
        return updated;
      }
      this.saveProfiles(this.profiles().map((profile) => (
        normalize(profile.username) === normalize(oldUsername) ? { ...profile, username: nextUsername } : profile
      )));
      this.saveOrders(this.orders().map((order) => ({
        ...order,
        customerUsername: normalize(order.customerUsername) === normalize(oldUsername) ? nextUsername : order.customerUsername,
        handledBy: normalize(order.handledBy) === normalize(oldUsername) ? nextUsername : order.handledBy
      })));
      Storage.set(Keys.ledger, this.ledger().map((entry) => (
        normalize(entry.username) === normalize(oldUsername) ? { ...entry, username: nextUsername } : entry
      )));
      const chats = this.chats();
      Object.keys(chats).forEach((orderId) => {
        chats[orderId] = (chats[orderId] || []).map((message) => {
          const readBy = Array.isArray(message.readBy)
            ? message.readBy.map((name) => (normalize(name) === normalize(oldUsername) ? nextUsername : name))
            : message.readBy;
          const readAt = Object.fromEntries(Object.entries(message.readAt || {}).map(([name, value]) => [
            normalize(name) === normalize(oldUsername) ? nextUsername : name,
            value
          ]));
          return {
            ...message,
            sender: normalize(message.sender) === normalize(oldUsername) ? nextUsername : message.sender,
            readBy,
            readAt
          };
        });
      });
      this.saveChats(chats);
      const mailboxes = this.mailboxes();
      const oldMailboxKey = normalize(oldUsername);
      const nextMailboxKey = normalize(nextUsername);
      if (oldMailboxKey && nextMailboxKey && oldMailboxKey !== nextMailboxKey) {
        const oldMessages = Array.isArray(mailboxes[oldMailboxKey]) ? mailboxes[oldMailboxKey] : [];
        const nextMessages = Array.isArray(mailboxes[nextMailboxKey]) ? mailboxes[nextMailboxKey] : [];
        mailboxes[nextMailboxKey] = [...oldMessages, ...nextMessages].map((message) => ({
          ...message,
          recipientUsername: normalize(message.recipientUsername) === oldMailboxKey ? nextUsername : message.recipientUsername,
          sender: normalize(message.sender) === oldMailboxKey ? nextUsername : message.sender
        }));
        delete mailboxes[oldMailboxKey];
        this.saveMailboxes(mailboxes);
      }
      if (State.currentUser && normalize(State.currentUser.username) === normalize(oldUsername)) {
        State.currentUser = { ...State.currentUser, username: nextUsername };
        Storage.set(Keys.currentUser, State.currentUser);
      }
      this.log("修改用户名", `${oldUsername} -> ${nextUsername}`);
      return { ok: true };
    },
    updateCurrentUserPassword(password) {
      if (String(password || "").length < 6) {
        return { ok: false, message: "密码至少需要 6 位。" };
      }
      return this.updateStoredUser(State.currentUser?.username, { password });
    },
    updateCurrentUserEmail(email) {
      const normalizedEmail = normalizeEmail(email);
      if (!isEmail(normalizedEmail)) {
        return { ok: false, message: "请输入有效邮箱。" };
      }
      const currentUsername = State.currentUser?.username;
      const owner = this.findUserByEmail(normalizedEmail);
      if (owner && normalize(owner.username) !== normalize(currentUsername)) {
        return { ok: false, message: "该邮箱已被其他账户绑定。" };
      }
      const user = this.findUser(currentUsername);
      const previousEmail = userEmail(user);
      const updated = this.updateStoredUser(currentUsername, { email: normalizedEmail });
      if (!updated.ok) {
        return updated;
      }
      const profile = this.currentProfile();
      if (profile && (!profile.notificationEmail || normalizeEmail(profile.notificationEmail) === previousEmail)) {
        this.saveProfile({ ...profile, notificationEmail: normalizedEmail });
      }
      this.recordEnglishEmail(previousEmail, "IMPULSE J email binding changed", "Your IMPULSE J account email address has been changed. If this was not you, please contact support immediately.");
      this.recordEnglishEmail(normalizedEmail, "IMPULSE J email binding confirmed", "Your IMPULSE J account is now bound to this email address.");
      this.log("修改绑定邮箱", `${currentUsername} ${previousEmail} -> ${normalizedEmail}`);
      return { ok: true, previousEmail, email: normalizedEmail };
    },
    recordEnglishEmail(to, subject, body) {
      if (!isEmail(to)) {
        return null;
      }
      Mail.sendEnglishEmail(to, subject, body).then((result) => {
        if (result.ok) {
          this.log("Email sent", `To: ${to} / Subject: ${subject} / Provider ID: ${result.id || "n/a"}`);
        }
      });
      return this.log("English email", `To: ${to} / Subject: ${subject} / Body: ${body}`);
    },
    notifyUser(profile, noticeKey, context = {}) {
      if (!profile || profile.deleted) {
        return null;
      }
      const notice = EmailNoticeTypes.find((item) => item.key === noticeKey);
      if (!notice) {
        return null;
      }
      const body = mailboxNoticeBody(profile, notice, context);
      const mailboxEntry = this.addMailboxMessage(profile.username, {
        category: MailboxNoticeCategories[noticeKey] || "system",
        subject: notice.subject,
        preview: [context.itemName, context.amount, context.orderId].filter(Boolean).join(" / ") || notice.subject,
        body,
        sender: "IMPULSE J System",
        source: "notice",
        sourceId: noticeKey,
        orderId: context.orderId || ""
      });
      if (profile.emailNotices?.[noticeKey] === false) {
        return mailboxEntry;
      }
      const user = this.findUser(profile.username);
      const to = normalizeEmail(profile.notificationEmail || userEmail(user));
      if (!isEmail(to)) {
        return mailboxEntry;
      }
      return this.recordEnglishEmail(to, notice.subject, body);
    },
    touchCurrentUser() {
      if (!State.currentUser) {
        return;
      }
      const profile = this.profileByUsername(State.currentUser.username);
      if (profile) {
        this.saveProfile({ ...profile, lastOnlineAt: new Date().toISOString() });
      }
    },
    adjustFunds(profileId, amountPoints, reason, meta = {}) {
      const profile = this.profileById(profileId);
      if (!profile) {
        return { ok: false, reason: "profile-missing" };
      }
      const before = Number(profile.funds) || 0;
      const delta = Number(amountPoints || 0);
      const after = before + delta;
      if (after < 0 && !meta.allowNegative) {
        this.log("资金变动失败", `${profile.username} ${reason}：余额不足，${before} -> ${after}`);
        return { ok: false, reason: "insufficient", before, after, profile };
      }
      const nextProfile = { ...profile, funds: after };
      this.saveProfile(nextProfile);
      const entry = {
        id: createId("flow"),
        userId: profile.id,
        username: profile.username,
        role: profile.role,
        type: meta.type || "manual",
        title: reason,
        amountPoints: delta,
        amountMoney: Number(meta.amountMoney || 0),
        before,
        after,
        orderId: meta.orderId || "",
        itemName: meta.itemName || "",
        operator: State.currentUser ? State.currentUser.username : "SYSTEM",
        createdAt: new Date().toISOString()
      };
      this.saveLedger([entry, ...this.ledger()]);
      this.log("资金流水", `${profile.username} ${reason}：${before} -> ${after}`);
      if (meta.type === "recharge" && delta > 0) {
        this.notifyUser(nextProfile, "rechargeSuccess", {
          amount: `${delta} points`,
          itemName: meta.itemName || reason
        });
      }
      return { ok: true, profile: nextProfile, entry };
    },
    categories() {
      return Storage.get(Keys.categories, []);
    },
    games() {
      return Storage.get(Keys.games, {});
    },
    products() {
      return Storage.get(Keys.products, {});
    },
    orders() {
      return Storage.get(Keys.orders, []);
    },
    orderById(orderId) {
      return this.orders().find((order) => order.id === orderId);
    },
    saveCategories(categories) {
      Storage.set(Keys.categories, categories);
    },
    saveGames(games) {
      Storage.set(Keys.games, games);
    },
    saveProducts(products) {
      Storage.set(Keys.products, products);
    },
    saveOrders(orders) {
      Storage.set(Keys.orders, orders);
    },
    ensureContentI18n() {
      const categories = this.categories().map((category) => ensureContentI18n(category, ["title", "description"]));
      const games = this.games();
      const products = this.products();
      const validCategoryIds = new Set(categories.map((category) => category.id));
      Object.entries(games).forEach(([categoryId, list]) => {
        if (!validCategoryIds.has(categoryId) || !Array.isArray(list)) {
          games[categoryId] = [];
          return;
        }
        games[categoryId] = list.map((game) => ensureContentI18n(game, ["title", "description", "platform"]));
        games[categoryId].forEach((game) => {
          products[game.id] = Array.isArray(products[game.id]) ? products[game.id] : [];
          products[game.id] = products[game.id].map((product) => ensureContentI18n(product, ["title", "description", "duration", "badge"]));
        });
      });
      Storage.set(Keys.categories, categories);
      Storage.set(Keys.games, games);
      Storage.set(Keys.products, products);
    },
    saveOrder(order) {
      this.saveOrders(this.orders().map((item) => (item.id === order.id ? order : item)));
      return order;
    },
    patchOrder(orderId, updater) {
      let nextOrder = null;
      this.saveOrders(this.orders().map((order) => {
        if (order.id !== orderId) {
          return order;
        }
        nextOrder = typeof updater === "function" ? updater(clone(order)) : { ...order, ...updater };
        return nextOrder;
      }));
      return nextOrder;
    },
    category(categoryId) {
      return this.categories().find((category) => category.id === categoryId);
    },
    game(categoryId, gameId) {
      return (this.games()[categoryId] || []).find((game) => game.id === gameId);
    },
    product(gameId, productId) {
      return (this.products()[gameId] || []).find((product) => product.id === productId);
    },
    findProduct(productId) {
      for (const category of this.categories()) {
        for (const game of this.games()[category.id] || []) {
          const product = (this.products()[game.id] || []).find((item) => item.id === productId);
          if (product) {
            return { product, game, category };
          }
        }
      }
      return null;
    },
    allProductsWithMeta() {
      const items = [];
      this.categories().forEach((category) => {
        (this.games()[category.id] || []).forEach((game) => {
          (this.products()[game.id] || []).forEach((product) => {
            items.push({ product, game, category });
          });
        });
      });
      return items;
    },
    upsertCategory(category) {
      category = ensureContentI18n(category, ["title", "description"]);
      const categories = this.categories();
      const exists = categories.some((item) => item.id === category.id);
      this.saveCategories(exists ? categories.map((item) => (item.id === category.id ? category : item)) : [...categories, category]);
      const games = this.games();
      if (!games[category.id]) {
        games[category.id] = [];
        this.saveGames(games);
      }
    },
    upsertGame(categoryId, game) {
      game = ensureContentI18n(game, ["title", "description", "platform"]);
      const games = this.games();
      const list = games[categoryId] || [];
      const exists = list.some((item) => item.id === game.id);
      games[categoryId] = exists ? list.map((item) => (item.id === game.id ? game : item)) : [...list, game];
      this.saveGames(games);
      const products = this.products();
      if (!products[game.id]) {
        products[game.id] = [];
        this.saveProducts(products);
      }
    },
    upsertProduct(gameId, product) {
      product = ensureContentI18n(product, ["title", "description", "duration", "badge"]);
      const products = this.products();
      const list = products[gameId] || [];
      const exists = list.some((item) => item.id === product.id);
      products[gameId] = exists ? list.map((item) => (item.id === product.id ? product : item)) : [...list, product];
      this.saveProducts(products);
    },
    deleteCategory(categoryId) {
      const games = this.games();
      const products = this.products();
      (games[categoryId] || []).forEach((game) => {
        delete products[game.id];
      });
      delete games[categoryId];
      this.saveCategories(this.categories().filter((category) => category.id !== categoryId));
      this.saveGames(games);
      this.saveProducts(products);
    },
    deleteGame(categoryId, gameId) {
      const games = this.games();
      games[categoryId] = (games[categoryId] || []).filter((game) => game.id !== gameId);
      const products = this.products();
      delete products[gameId];
      this.saveGames(games);
      this.saveProducts(products);
    },
    deleteProduct(gameId, productId) {
      const products = this.products();
      products[gameId] = (products[gameId] || []).filter((product) => product.id !== productId);
      this.saveProducts(products);
    },
    createOrder(payload) {
      const profile = this.profileByUsername(payload.customerUsername);
      const price = Math.max(0, Number(payload.price || 0));
      if (!profile || profile.deleted || isBanned(profile)) {
        return { ok: false, reason: "profile-unavailable" };
      }
      if ((Number(profile.funds) || 0) < price) {
        return { ok: false, reason: "insufficient", balance: Number(profile.funds) || 0, required: price };
      }
      const order = {
        id: createId("order"),
        status: "pending",
        createdAt: new Date().toISOString(),
        completedAt: "",
        handledBy: "",
        acceptedAt: "",
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
        ...payload,
        contact: String(payload.contact || "").trim(),
        price
      };
      this.saveOrders([order, ...this.orders()]);
      const deduction = this.adjustFunds(profile.id, -price, `${OrderTypeLabels[order.type] || "订单"}消费`, {
        type: "consume",
        amountMoney: price,
        orderId: order.id,
        itemName: order.productTitle
      });
      if (!deduction.ok) {
        this.saveOrders(this.orders().filter((item) => item.id !== order.id));
        return { ok: false, reason: deduction.reason, balance: deduction.before, required: price };
      }
      this.log("创建订单", `${order.customerUsername} 提交 ${order.productTitle}`);
      this.notifyUser(profile, "orderSuccess", {
        orderId: order.id,
        itemName: order.productTitle,
        amount: `${price} points`
      });
      return { ok: true, order };
    },
    updateOrder(orderId, patch) {
      const updatedAt = new Date().toISOString();
      this.saveOrders(this.orders().map((order) => {
        if (order.id !== orderId) {
          return order;
        }
        const next = { ...order, ...patch, updatedAt };
        if (patch.status === "completed" && !next.completedAt) {
          next.completedAt = updatedAt;
        }
        if (State.currentUser && State.currentUser.role === "staff" && !next.handledBy) {
          next.handledBy = State.currentUser.username;
        }
        if (patch.status === "processing" && next.handledBy && !next.acceptedAt) {
          next.acceptedAt = updatedAt;
        }
        return next;
      }));
      this.log("更新订单", `${orderId} ${patch.status ? `状态变更为 ${StatusLabels[patch.status] || patch.status}` : "参数变更"}`);
    },
    refundOrder(order, reason = "订单退款") {
      const current = typeof order === "string" ? this.orderById(order) : order;
      if (!current || current.refundedAt) {
        return { ok: false, reason: "not-refundable" };
      }
      const profile = this.profileByUsername(current.customerUsername);
      if (!profile) {
        return { ok: false, reason: "profile-missing" };
      }
      const refundedAt = new Date().toISOString();
      const rushRefund = current.rush?.status === "pending" ? Number(current.rush.fee || 0) : 0;
      const refundAmount = Number(current.price || 0) + rushRefund;
      const refund = this.adjustFunds(profile.id, refundAmount, reason, {
        type: "refund",
        amountMoney: refundAmount,
        orderId: current.id,
        itemName: current.productTitle
      });
      if (!refund.ok) {
        return refund;
      }
      this.saveOrders(this.orders().map((item) => (item.id === current.id ? {
        ...item,
        status: "cancelled",
        completedAt: item.completedAt || refundedAt,
        refundedAt,
        refundReason: reason,
        rush: item.rush?.status === "pending" ? { ...item.rush, status: "cancelled", refundedAt } : item.rush,
        updatedAt: refundedAt
      } : item)));
      this.log("订单退款", `${current.id} ${current.customerUsername} 返还 ${refundAmount} 积分`);
      this.notifyUser(profile, "returnSuccess", {
        orderId: current.id,
        itemName: current.productTitle,
        amount: `${refundAmount} points`
      });
      return { ok: true };
    },
    processAutoRefunds() {
      const dueOrders = this.orders().filter((order) => isAutoCancelDue(order));
      dueOrders.forEach((order) => {
        this.refundOrder(order, "超时无人接单自动退单");
      });
      return dueOrders.length > 0;
    },
    processRushBreaches() {
      const dueOrders = this.orders().filter((order) => isRushBreached(order));
      dueOrders.forEach((order) => {
        const breachedAt = new Date().toISOString();
        this.patchOrder(order.id, (current) => ({
          ...current,
          rush: { ...current.rush, status: "breached", breachedAt },
          updatedAt: breachedAt
        }));
        this.addChatMessage(order.id, {
          sender: "SYSTEM",
          role: "system",
          type: "system",
          text: "加急期限已违约，Gamer 退单权限已恢复。"
        });
        this.log("加急违约", `${order.id} 超过 ${formatFullDate(order.rush.deadlineAt)}`);
      });
      return dueOrders.length > 0;
    },
    requestRush(orderId, days) {
      const order = this.orderById(orderId);
      const customer = order ? this.profileByUsername(order.customerUsername) : null;
      const deadlineDays = Math.min(30, Math.max(1, Math.ceil(Number(days) || 1)));
      const fee = Math.ceil(Number(order?.price || 0) * RushFeeRate);
      if (!order || order.status !== "processing" || !order.handledBy) {
        return { ok: false, reason: "unavailable" };
      }
      if (["pending", "accepted", "breached", "continue_requested", "continued"].includes(order.rush?.status)) {
        return { ok: false, reason: "rush-active" };
      }
      const paid = this.adjustFunds(customer?.id, -fee, "订单加急费", {
        type: "rush",
        amountMoney: fee,
        orderId: order.id,
        itemName: order.productTitle
      });
      if (!paid.ok) {
        return paid;
      }
      const requestedAt = new Date().toISOString();
      const deadlineAt = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString();
      this.patchOrder(order.id, (current) => ({
        ...current,
        rush: {
          status: "pending",
          fee,
          deadlineDays,
          deadlineAt,
          requestedAt,
          requestedBy: order.customerUsername
        },
        updatedAt: requestedAt
      }));
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: `Gamer 已支付 ${fee} 积分申请加急，要求 ${formatFullDate(deadlineAt)} 前结单。`
      });
      this.log("申请加急", `${order.customerUsername} 为 ${order.id} 支付 ${fee} 积分`);
      return { ok: true, fee, deadlineAt };
    },
    respondRush(orderId, accepted) {
      const order = this.orderById(orderId);
      if (!order || order.rush?.status !== "pending") {
        return { ok: false, reason: "unavailable" };
      }
      const respondedAt = new Date().toISOString();
      if (!accepted) {
        const customer = this.profileByUsername(order.customerUsername);
        if (customer && Number(order.rush.fee || 0) > 0) {
          this.adjustFunds(customer.id, Number(order.rush.fee || 0), "加急被拒退回", {
            type: "refund",
            amountMoney: Number(order.rush.fee || 0),
            orderId: order.id,
            itemName: order.productTitle
          });
        }
      }
      this.patchOrder(order.id, (current) => ({
        ...current,
        rush: {
          ...current.rush,
          status: accepted ? "accepted" : "declined",
          respondedAt,
          respondedBy: State.currentUser ? State.currentUser.username : ""
        },
        updatedAt: respondedAt
      }));
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: accepted ? `Vector 已接受加急，结单期限为 ${formatFullDate(order.rush.deadlineAt)}。` : "Vector 已拒绝加急申请，加急费用已退回。"
      });
      this.log(accepted ? "接受加急" : "拒绝加急", `${order.id} ${State.currentUser?.username || ""}`);
      this.notifyUser(this.profileByUsername(order.customerUsername), "rushReply", {
        orderId: order.id,
        itemName: order.productTitle,
        amount: accepted ? "Rush request accepted" : "Rush request declined"
      });
      return { ok: true };
    },
    requestContinueAfterBreach(orderId) {
      const order = this.orderById(orderId);
      if (!order || order.rush?.status !== "breached") {
        return { ok: false, reason: "unavailable" };
      }
      const requestedAt = new Date().toISOString();
      this.patchOrder(order.id, (current) => ({
        ...current,
        rush: { ...current.rush, status: "continue_requested", continueRequestedAt: requestedAt },
        updatedAt: requestedAt
      }));
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: "Vector 申请继续完成违约加急订单，等待 Gamer 确认。"
      });
      this.log("申请继续完成", `${order.id} ${State.currentUser?.username || ""}`);
      return { ok: true };
    },
    answerContinueAfterBreach(orderId, accepted) {
      const order = this.orderById(orderId);
      if (!order || order.rush?.status !== "continue_requested") {
        return { ok: false, reason: "unavailable" };
      }
      const answeredAt = new Date().toISOString();
      this.patchOrder(order.id, (current) => ({
        ...current,
        rush: {
          ...current.rush,
          status: accepted ? "continued" : "continue_declined",
          continueAnsweredAt: answeredAt,
          continueAccepted: accepted
        },
        updatedAt: answeredAt
      }));
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: accepted ? "Gamer 已同意 Vector 继续完成订单。" : "Gamer 已拒绝 Vector 继续完成申请。"
      });
      this.log(accepted ? "同意继续完成" : "拒绝继续完成", `${order.id} ${order.customerUsername}`);
      return { ok: true };
    },
    returnOrder(orderId) {
      const order = this.orderById(orderId);
      if (!canReturnOrder(order)) {
        return { ok: false, reason: "window-closed" };
      }
      const customer = this.profileByUsername(order.customerUsername);
      if (!customer) {
        return { ok: false, reason: "profile-missing" };
      }
      const refundedAt = new Date().toISOString();
      const refundAmount = Math.ceil(Number(order.price || 0) * ReturnRefundRate);
      const refund = this.adjustFunds(customer.id, refundAmount, "接单后退单退款", {
        type: "refund",
        amountMoney: refundAmount,
        orderId: order.id,
        itemName: order.productTitle
      });
      if (!refund.ok) {
        return refund;
      }
      this.patchOrder(order.id, (current) => ({
        ...current,
        status: "cancelled",
        completedAt: current.completedAt || refundedAt,
        returnRefundedAt: refundedAt,
        returnRefundAmount: refundAmount,
        refundReason: "Vector 接单后 Gamer 退单",
        updatedAt: refundedAt
      }));
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: `Gamer 已退单，系统返还 ${refundAmount} 积分。`
      });
      this.log("Gamer 退单", `${order.id} 返还 ${refundAmount} 积分`);
      this.notifyUser(customer, "returnSuccess", {
        orderId: order.id,
        itemName: order.productTitle,
        amount: `${refundAmount} points`
      });
      return { ok: true, refundAmount };
    },
    tipOrder(orderId, amount) {
      const order = this.orderById(orderId);
      const tip = Math.max(0, Number(amount || 0));
      const customer = order ? this.profileByUsername(order.customerUsername) : null;
      const staff = order ? this.profileByUsername(order.handledBy) : null;
      if (!order || !customer || !staff || tip <= 0 || order.status === "pending" || order.status === "cancelled") {
        return { ok: false, reason: "unavailable" };
      }
      const outgoing = this.adjustFunds(customer.id, -tip, "订单小费支出", {
        type: "tip",
        amountMoney: tip,
        orderId: order.id,
        itemName: order.productTitle
      });
      if (!outgoing.ok) {
        return outgoing;
      }
      this.adjustFunds(staff.id, tip, "订单小费收入", {
        type: "tip",
        amountMoney: tip,
        orderId: order.id,
        itemName: order.productTitle
      });
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: `Gamer 已向 Vector 支付 ${tip} 积分小费。`
      });
      this.log("支付小费", `${order.id} ${order.customerUsername} -> ${order.handledBy} ${tip} 积分`);
      return { ok: true, tip };
    },
    reportOrder(orderId, reason, description) {
      const order = this.orderById(orderId);
      if (!order || !order.handledBy) {
        return { ok: false, reason: "unavailable" };
      }
      const report = {
        id: createId("report"),
        reporter: State.currentUser ? State.currentUser.username : "",
        target: order.handledBy,
        reason,
        description,
        status: "submitted",
        createdAt: new Date().toISOString()
      };
      this.patchOrder(order.id, (current) => ({
        ...current,
        reports: [report, ...(current.reports || [])],
        updatedAt: report.createdAt
      }));
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: "Gamer 已提交举报，管理员可在日志和订单记录中追踪。"
      });
      this.log("提交举报", `${order.id} ${report.reporter} 举报 ${order.handledBy}：${reason}`);
      return { ok: true, report };
    },
    settleOrder(orderId) {
      const order = this.orderById(orderId);
      if (!order || order.settledAt || order.status !== "completed" || !order.handledBy) {
        return { ok: false, reason: "unavailable" };
      }
      const staff = this.profileByUsername(order.handledBy);
      const customer = this.profileByUsername(order.customerUsername);
      if (!staff) {
        return { ok: false, reason: "staff-missing" };
      }
      const price = Number(order.price || 0);
      const rush = order.rush || {};
      let staffPayout = price;
      let customerRefund = 0;
      let settlementNote = "正常结算";
      if (rush.status === "accepted") {
        staffPayout += Number(rush.fee || 0);
        settlementNote = "加急按期结算";
      }
      if (["breached", "continue_requested", "continue_declined"].includes(rush.status)) {
        staffPayout = Math.ceil(price * 0.1);
        customerRefund = Math.max(0, price - staffPayout);
        settlementNote = "加急违约结算";
      }
      if (rush.status === "continued") {
        staffPayout = Math.ceil(price * 0.6);
        customerRefund = Math.max(0, price - staffPayout);
        settlementNote = "违约后继续完成结算";
      }
      const settledAt = new Date().toISOString();
      if (staffPayout > 0) {
        this.adjustFunds(staff.id, staffPayout, "订单结算收入", {
          type: "settlement",
          amountMoney: staffPayout,
          orderId: order.id,
          itemName: order.productTitle
        });
      }
      if (customer && customerRefund > 0) {
        this.adjustFunds(customer.id, customerRefund, settlementNote.includes("违约") ? "加急违约退款" : "订单结算退款", {
          type: "refund",
          amountMoney: customerRefund,
          orderId: order.id,
          itemName: order.productTitle
        });
      }
      this.patchOrder(order.id, (current) => ({
        ...current,
        settledAt,
        settlement: { staffPayout, customerRefund, note: settlementNote },
        updatedAt: settledAt
      }));
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: `${settlementNote}：Vector 获得 ${staffPayout} 积分${customerRefund ? `，Gamer 退回 ${customerRefund} 积分` : ""}。`
      });
      this.log("订单结算", `${order.id} ${settlementNote}，Vector ${staffPayout}，Gamer 退款 ${customerRefund}`);
      if (customer) {
        this.notifyUser(customer, "completionSuccess", {
          orderId: order.id,
          itemName: order.productTitle,
          amount: `${price} points`
        });
      }
      return { ok: true, staffPayout, customerRefund };
    },
    metrics() {
      const products = this.allProductsWithMeta();
      const orders = this.orders();
      return {
        categories: this.categories().length,
        games: Object.values(this.games()).reduce((total, list) => total + list.length, 0),
        products: products.length,
        orders: orders.length,
        pending: orders.filter((order) => order.status === "pending").length,
        processing: orders.filter((order) => order.status === "processing").length,
        completed: orders.filter((order) => order.status === "completed").length
      };
    },
    exportSnapshot() {
      return {
        exportedAt: new Date().toISOString(),
        users: this.users().map(({ password, passwordHash, ...safe }) => safe),
        profiles: this.profiles(),
        categories: this.categories(),
        gameCategories: this.games(),
        products: this.products(),
        orders: this.orders(),
        orderChats: this.chats(),
        mailboxMessages: this.mailboxes(),
        ledger: this.ledger(),
        adminLogs: this.adminLogs(),
        systemSettings: this.systemSettings()
      };
    }
  };

  const Session = {
    load() {
      const storedUser = Storage.get(Keys.currentUser, null);
      if (storedUser) {
        const user = Data.findUser(storedUser.username);
        if (user) {
          const profile = Data.profileByUsername(user.username);
          if (!profile || (!profile.deleted && !isBanned(profile))) {
            State.currentUser = { username: user.username, role: user.role };
          } else {
            Storage.remove(Keys.currentUser);
          }
        }
      }
      const storedMode = localStorage.getItem(Keys.currentMode);
      State.mode = this.allowedModes().includes(storedMode) ? storedMode : this.defaultMode();
    },
    defaultMode() {
      if (!State.currentUser) {
        return "customer";
      }
      if (State.currentUser.role === "admin") {
        return "admin";
      }
      if (State.currentUser.role === "staff") {
        return "staff";
      }
      return "customer";
    },
    allowedModes() {
      if (!State.currentUser) {
        return ["customer"];
      }
      if (State.currentUser.role === "admin") {
        return ["customer", "staff", "admin"];
      }
      if (State.currentUser.role === "staff") {
        return ["customer", "staff"];
      }
      return ["customer"];
    },
    setMode(mode) {
      State.mode = this.allowedModes().includes(mode) ? mode : "customer";
      localStorage.setItem(Keys.currentMode, State.mode);
      if (State.mode === "staff") {
        Router.go("home");
        return;
      }
      if (["staff", "admin"].includes(State.route.name) && State.route.name !== State.mode) {
        Router.go("home");
        return;
      }
      App.render();
    },
    cycleMode() {
      const modes = this.allowedModes();
      const currentIndex = modes.indexOf(State.mode);
      this.setMode(modes[(currentIndex + 1) % modes.length]);
    },
    start(user, options = {}) {
      const profile = Data.profileByUsername(user.username);
      State.currentUser = { username: user.username, role: user.role };
      Storage.set(Keys.currentUser, State.currentUser);
      State.mode = this.defaultMode();
      localStorage.setItem(Keys.currentMode, State.mode);
      if (profile) {
        Data.saveProfile({ ...profile, lastOnlineAt: new Date().toISOString() });
      }
      if (!options.skipBackendLog) {
        Data.log("用户登录", user.username);
      }
      return { ok: true };
    },
    ensureUserAvailable(user) {
      const profile = Data.profileByUsername(user.username);
      if (profile?.deleted) {
        return { ok: false, message: "该账户已注销。" };
      }
      if (isBanned(profile)) {
        return { ok: false, message: `该账户已被封禁至 ${formatFullDate(profile.bannedUntil)}。` };
      }
      return { ok: true };
    },
    async loginByPassword(identity, password) {
      const trimmedIdentity = String(identity || "").trim();
      if (!trimmedIdentity || !password) {
        return { ok: false, message: "请输入账号或邮箱和密码。" };
      }
      const backendResult = await Backend.loginPassword(trimmedIdentity, password);
      if (backendResult.ok) {
        return backendResult;
      }
      if (!backendResult.offline) {
        return backendResult;
      }
      const user = isEmail(trimmedIdentity)
        ? Data.findUserByEmail(trimmedIdentity)
        : Data.findUser(trimmedIdentity);
      if (!user || user.password !== password) {
        return { ok: false, message: "账号或密码不正确。" };
      }
      const availability = this.ensureUserAvailable(user);
      if (!availability.ok) {
        return availability;
      }
      return this.start(user);
    },
    async loginByEmailCode(email, code) {
      const normalizedEmail = normalizeEmail(email);
      if (!isEmail(normalizedEmail)) {
        return { ok: false, message: "请输入有效邮箱。" };
      }
      const backendResult = await Backend.loginCode(normalizedEmail, code);
      if (backendResult.ok) {
        return backendResult;
      }
      if (!backendResult.offline) {
        return backendResult;
      }
      const user = Data.findUserByEmail(normalizedEmail);
      if (!user) {
        return { ok: false, message: "该邮箱未注册。" };
      }
      const verified = Verification.verify("login", normalizedEmail, code);
      if (!verified.ok) {
        return verified;
      }
      const availability = this.ensureUserAvailable(user);
      if (!availability.ok) {
        return availability;
      }
      return this.start(user);
    },
    async login(email, password, code) {
      const normalizedEmail = normalizeEmail(email);
      if (!isEmail(normalizedEmail)) {
        return { ok: false, message: "请输入有效邮箱。" };
      }
      const user = Data.findUserByEmail(normalizedEmail);
      if (!user || user.password !== password) {
        return { ok: false, message: "邮箱或密码不正确。" };
      }
      const verified = Verification.verify("login", normalizedEmail, code);
      if (!verified.ok) {
        return verified;
      }
      const availability = this.ensureUserAvailable(user);
      if (!availability.ok) {
        return availability;
      }
      return this.start(user);
    },
    async register(username, email, password, confirmPassword, code, profileFields = {}) {
      const normalizedEmail = normalizeEmail(email);
      if (!username.trim() || !password) {
        return { ok: false, message: "请输入用户名、邮箱和密码。" };
      }
      if (!isEmail(normalizedEmail)) {
        return { ok: false, message: "请输入有效邮箱。" };
      }
      if (password.length < 6) {
        return { ok: false, message: "密码至少需要 6 位。" };
      }
      if (password !== confirmPassword) {
        return { ok: false, message: "两次输入的密码不一致。" };
      }
      if (Data.findUser(username)) {
        return { ok: false, message: "用户名已存在。" };
      }
      if (Data.findUserByEmail(normalizedEmail)) {
        return { ok: false, message: "邮箱已被注册。" };
      }
      if (!String(profileFields.countryRegion || "").trim()) {
        return { ok: false, message: "请输入国家或地区。" };
      }
      if (!profileFields.birthday) {
        return { ok: false, message: "请选择生日。" };
      }
      const backendResult = await Backend.register({
        username,
        email: normalizedEmail,
        password,
        confirmPassword,
        code,
        countryRegion: profileFields.countryRegion,
        birthday: profileFields.birthday,
        gender: profileFields.gender,
        avatarImage: profileFields.avatarImage,
        avatarImageName: profileFields.avatarImageName
      });
      if (backendResult.ok) {
        return backendResult;
      }
      if (!backendResult.offline) {
        return backendResult;
      }
      const verified = Verification.verify("register", normalizedEmail, code);
      if (!verified.ok) {
        return verified;
      }
      Data.saveUser({
        username: username.trim(),
        email: normalizedEmail,
        password,
        role: "customer",
        countryRegion: String(profileFields.countryRegion || "").trim(),
        birthday: profileFields.birthday,
        gender: profileFields.gender || "unset",
        avatarImage: profileFields.avatarImage || "",
        avatarImageName: profileFields.avatarImageName || ""
      });
      return this.start(Data.findUser(username));
    },
    logout() {
      const username = State.currentUser ? State.currentUser.username : "未知用户";
      const profile = State.currentUser ? Data.profileByUsername(State.currentUser.username) : null;
      if (profile) {
        Data.saveProfile({ ...profile, lastOnlineAt: "" });
      }
      Data.log("用户登出", username);
      Backend.logout();
      State.currentUser = null;
      State.mode = "customer";
      Storage.remove(Keys.currentUser);
      Storage.remove(Keys.currentMode);
      Router.go("home");
      UI.toast("已退出登录", "当前已回到 Gamer 模式。");
    }
  };

  const Translation = {
    ready: false,
    loading: false,
    initialized: false,
    scriptId: "google-translate-script",
    elementId: "google_translate_element",
    selected() {
      return activeLanguage();
    },
    selectedLabel() {
      return languageName(this.selected());
    },
    init() {
      if (!document.getElementById(this.elementId)) {
        document.body.appendChild(h("div", { id: this.elementId, className: "translate-engine", "aria-hidden": "true" }));
      }

      window.googleTranslateElementInit = () => {
        if (!window.google || !window.google.translate) {
          return;
        }
        this.ready = true;
        this.initialized = true;
        new window.google.translate.TranslateElement({
          pageLanguage: DefaultLanguage,
          includedLanguages: Languages.map((item) => item.code).join(","),
          autoDisplay: false
        }, this.elementId);
        window.setTimeout(() => this.applySaved(), 300);
      };

      if (!isLocalLanguage(this.selected())) {
        this.loadScript();
      }
    },
    loadScript() {
      if (this.loading || document.getElementById(this.scriptId)) {
        return;
      }
      this.loading = true;
      const script = document.createElement("script");
      script.id = this.scriptId;
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.onerror = () => {
        this.loading = false;
        UI.toast("翻译脚本未加载", "请确认网络可访问 Google Translate。");
      };
      document.body.appendChild(script);
    },
    choose(code) {
      const language = Languages.find((item) => item.code === code) || Languages[0];
      localStorage.setItem(Keys.language, language.code);
      App.render();

      if (isLocalLanguage(language.code)) {
        this.clearCookie();
        UI.toast("语言已切换", languageName(language.code));
        window.setTimeout(() => window.location.reload(), 350);
        return;
      }

      this.setCookie(language.code);
      if (!this.ready) {
        this.loadScript();
        UI.toast("语言已保存", `Google Translate 加载后会尝试切换到${languageName(language.code)}。`);
        return;
      }

      if (this.apply(language.code)) {
        UI.toast("语言已切换", languageName(language.code));
      } else {
        UI.toast("正在准备翻译", "稍后会自动尝试切换。");
      }
    },
    localizeStaticUi(root = document.body) {
      const translateTextNode = (node) => {
        const original = node.nodeValue;
        const trimmed = original.trim();
        if (!trimmed) {
          return;
        }
        if (hasProtectedRoleTerm(trimmed)) {
          markNoTranslate(node.parentElement || node.parentNode);
        }
        const localized = localizeStaticPhrase(trimmed);
        if (localized === trimmed) {
          return;
        }
        node.nodeValue = original.replace(trimmed, localized);
        markNoTranslate(node.parentElement || node.parentNode);
      };

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement || node.parentNode;
          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest && parent.closest(`.translate-engine, ${ProtectedTranslationSelector}`)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }
      textNodes.forEach(translateTextNode);

      root.querySelectorAll?.("[placeholder], [aria-label], [title]").forEach((node) => {
        if (node.closest && node.closest(ProtectedTranslationSelector)) {
          return;
        }
        ["placeholder", "aria-label", "title"].forEach((attr) => {
          const value = node.getAttribute(attr);
          if (!value) {
            return;
          }
          const localized = localizeStaticPhrase(value);
          if (localized !== value) {
            node.setAttribute(attr, localized);
            markNoTranslate(node);
          }
        });
      });
    },
    applySaved() {
      const language = this.selected();
      if (isLocalLanguage(language)) {
        return;
      }
      this.apply(language);
    },
    apply(code) {
      this.setCookie(code);
      const combo = document.querySelector(".goog-te-combo");
      if (!combo) {
        window.setTimeout(() => this.apply(code), 450);
        return false;
      }
      if (combo.value !== code) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
      }
      return true;
    },
    setCookie(code) {
      document.cookie = `googtrans=/${DefaultLanguage}/${code}; path=/`;
      if (window.location.hostname) {
        document.cookie = `googtrans=/${DefaultLanguage}/${code}; path=/; domain=${window.location.hostname}`;
      }
    },
    clearCookie() {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      if (window.location.hostname) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      }
    },
    refresh() {
      if (this.ready && !isLocalLanguage(this.selected())) {
        window.setTimeout(() => this.applySaved(), 250);
      }
    }
  };

  const Router = {
    parse() {
      const raw = window.location.hash.replace(/^#\/?/, "");
      const [path = "", queryString = ""] = raw.split("?");
      const parts = path.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
      const query = new URLSearchParams(queryString);

      if (parts[0] === "category" && parts[1]) {
        return { name: "category", params: { categoryId: parts[1] } };
      }
      if (parts[0] === "products" && parts[1] && parts[2]) {
        return { name: "products", params: { categoryId: parts[1], gameId: parts[2] } };
      }
      if (parts[0] === "search") {
        return { name: "search", params: { q: query.get("q") || "" } };
      }
      if (parts[0] === "account") {
        return { name: "account", params: {} };
      }
      if (parts[0] === "staff") {
        return { name: "staff", params: { section: parts[1] || "active" } };
      }
      if (parts[0] === "admin") {
        return {
          name: "admin",
          params: {
            section: parts[1] || "",
            role: parts[2] || "",
            userId: parts[3] || "",
            tab: parts[4] || ""
          }
        };
      }
      if (["about", "help", ...LegalInfoPages].includes(parts[0])) {
        return { name: "info", params: { page: parts[0] } };
      }
      return { name: "home", params: {} };
    },
    pathFor(name, params = {}) {
      if (name === "category") {
        return `#/category/${encodeURIComponent(params.categoryId)}`;
      }
      if (name === "products") {
        return `#/products/${encodeURIComponent(params.categoryId)}/${encodeURIComponent(params.gameId)}`;
      }
      if (name === "search") {
        return `#/search?q=${encodeURIComponent(params.q || "")}`;
      }
      if (name === "account") {
        return "#/account";
      }
      if (name === "staff") {
        return `#/staff/${encodeURIComponent(params.section || "active")}`;
      }
      if (name === "admin") {
        const pieces = ["admin"];
        if (params.section) {
          pieces.push(params.section);
        }
        if (params.role) {
          pieces.push(params.role);
        }
        if (params.userId) {
          pieces.push(params.userId);
        }
        if (params.tab) {
          pieces.push(params.tab);
        }
        return `#/${pieces.map((piece) => encodeURIComponent(piece)).join("/")}`;
      }
      if (name === "info") {
        return `#/${encodeURIComponent(params.page || "about")}`;
      }
      return "#/";
    },
    go(name, params = {}) {
      const next = this.pathFor(name, params);
      if (window.location.hash === next) {
        App.render();
        return;
      }
      window.location.hash = next;
    },
    resolve(route) {
      if (State.mode === "staff" && !["home", "staff", "account", "info"].includes(route.name)) {
        return { name: "home", params: {} };
      }
      if (route.name === "staff" && State.mode !== "staff") {
        return { name: "home", params: {} };
      }
      if (route.name === "admin" && State.mode !== "admin") {
        return { name: "home", params: {} };
      }
      return route;
    }
  };

  const UI = {
    hideAppLoader() {
      const loader = Dom.appLoader || $("#appLoader");
      document.body.classList.remove("app-loading");
      document.body.classList.add("app-ready");
      if (!loader) {
        return;
      }
      window.setTimeout(() => loader.remove(), 320);
    },
    toast(title, message = "") {
      const item = h("div", { className: "toast" }, h("strong", { text: title }), message ? h("span", { text: message }) : null);
      Dom.toastRoot.appendChild(item);
      Translation.localizeStaticUi(item);
      window.setTimeout(() => item.remove(), 3600);
    },
    closeModal() {
      clear(Dom.modalRoot);
    },
    openModal(card) {
      clear(Dom.modalRoot);
      Dom.modalRoot.appendChild(
        h("div", { className: "modal" },
          h("div", { className: "modal-backdrop", dataset: { action: "close-modal" } }),
          card
        )
      );
      Translation.localizeStaticUi(Dom.modalRoot);
      Translation.refresh();
    },
    beginInteractionLoading(target) {
      if (!shouldShowInteractionLoader(target)) {
        return null;
      }
      const startedAt = Date.now();
      const hadLoading = target.classList.contains("is-interaction-loading");
      target.classList.add("is-interaction-loading");
      target.setAttribute("aria-busy", "true");
      return {
        done: () => {
          const delay = Math.max(0, 220 - (Date.now() - startedAt));
          window.setTimeout(() => {
            if (!hadLoading) {
              target.classList.remove("is-interaction-loading");
              target.removeAttribute("aria-busy");
            }
          }, delay);
        },
        doneSoon: () => {
          window.setTimeout(() => {
            if (!hadLoading) {
              target.classList.remove("is-interaction-loading");
              target.removeAttribute("aria-busy");
            }
          }, 320);
        }
      };
    },
    openConfirm(title, body, onConfirm) {
      const card = h("div", { className: "modal-card slide-up" },
        h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
        h("h2", { text: title }),
        h("p", { text: body }),
        h("div", { className: "modal-actions" },
          h("button", { className: "button button-ghost", type: "button", dataset: { action: "close-modal" } }, "取消"),
          h("button", {
            className: "button button-danger",
            type: "button",
            onClick: () => {
              this.closeModal();
              onConfirm();
            }
          }, "确认")
        )
      );
      this.openModal(card);
    },
    openPasswordPrompt({ title, body, validator, onSuccess }) {
      this.openFormModal({
        title,
        fields: [
          { name: "password", label: "密码", type: "password", required: true }
        ],
        submitLabel: "确认",
        onSubmit: async (values) => {
          if (!await validator(values.password)) {
            return { error: "密码不正确。" };
          }
          onSuccess();
          return null;
        }
      });
      if (body) {
        const heading = Dom.modalRoot.querySelector?.(".modal-card h2");
        if (heading) {
          heading.insertAdjacentElement("afterend", h("p", { text: body }));
          Translation.localizeStaticUi(Dom.modalRoot);
        }
      }
    },
    openFormModal({ title, fields, submitLabel = "保存", onSubmit, wide = false }) {
      const message = h("p", { className: "form-message" });
      const form = h("form", { className: "form-stack" });

      fields.forEach((field) => {
        let input;
        if (field.type === "textarea") {
          input = h("textarea", { name: field.name, value: field.value ?? "", placeholder: field.placeholder || "", required: field.required });
        } else if (field.type === "select") {
          input = h("select", { name: field.name, required: field.required },
            (field.options || []).map((option) => h("option", { value: option.value, selected: option.value === field.value }, option.label))
          );
        } else if (field.type === "image") {
          const hiddenInput = h("input", { name: field.name, type: "hidden", value: field.value ?? "" });
          const preview = h("div", { className: "content-image-preview" });
          const renderPreview = (value) => {
            clear(preview);
            if (value) {
              preview.append(
                h("img", { src: value, alt: field.label || "展示图片" }),
                h("span", { text: "当前图片" })
              );
              Translation.localizeStaticUi(preview);
              return;
            }
            preview.append(
              icon("fa-regular fa-image"),
              h("span", { text: "未上传图片" })
            );
            Translation.localizeStaticUi(preview);
          };
          const fileInput = h("input", { className: "image-file-input", type: "file", accept: field.accept || "image/*" });
          fileInput.addEventListener("change", async () => {
            const file = fileInput.files?.[0];
            if (!file) {
              return;
            }
            try {
              const result = await readDisplayImageFile(file, field.maxSize || DisplayImageMaxBytes);
              hiddenInput.value = result.image;
              renderPreview(result.image);
              message.textContent = "";
              if (Backend.online && Backend.token()) {
                message.textContent = localizeStaticPhrase("正在上传图片...");
                const uploaded = await Backend.uploadAsset({
                  dataUrl: result.image,
                  filename: result.name || file.name,
                  scope: field.assetScope || "content"
                });
                if (uploaded?.ok && uploaded.url) {
                  hiddenInput.value = uploaded.url;
                  renderPreview(uploaded.url);
                  message.textContent = "";
                } else if (uploaded && uploaded.configured !== false) {
                  message.textContent = localizeStaticPhrase("图片上传失败，已保留为本地数据。");
                } else {
                  message.textContent = localizeStaticPhrase("图片已保存为本地数据。");
                }
              }
            } catch (error) {
              message.textContent = localizeStaticPhrase(error.message);
              fileInput.value = "";
            }
          });
          renderPreview(hiddenInput.value);
          input = h("div", { className: "image-upload-field" },
            hiddenInput,
            preview,
            h("div", { className: "image-upload-actions" },
              h("label", { className: "button button-ghost button-small image-upload-button" },
                icon("fa-solid fa-upload"),
                "选择图像",
                fileInput
              ),
              h("button", {
                className: "button button-ghost button-small",
                type: "button",
                onClick: () => {
                  hiddenInput.value = "";
                  fileInput.value = "";
                  renderPreview("");
                  message.textContent = "";
                }
              }, icon("fa-regular fa-trash-can"), "移除展示图片")
            ),
            h("small", { text: "仅支持图片文件，最大 2MB。" })
          );
        } else {
          input = h("input", {
            name: field.name,
            type: field.type || "text",
            value: field.value ?? "",
            min: field.min,
            max: field.max,
            step: field.step,
            placeholder: field.placeholder || "",
            required: field.required
          });
        }
        form.appendChild(
          field.type === "image"
            ? h("div", { className: "field" }, h("span", { text: field.label }), input)
            : h("label", { className: "field" }, field.label, input)
        );
      });

      form.append(
        message,
        h("div", { className: "modal-actions" },
          h("button", { className: "button button-ghost", type: "button", dataset: { action: "close-modal" } }, "取消"),
          h("button", { className: "button button-primary", type: "submit" }, submitLabel)
        )
      );

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(form).entries());
        const submitButton = form.querySelector("button[type='submit']");
        const loader = UI.beginInteractionLoading(submitButton);
        if (submitButton) {
          submitButton.disabled = true;
        }
        let result = null;
        try {
          result = await onSubmit(values);
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
          }
          loader?.done();
        }
        if (result && result.error) {
          message.textContent = result.error;
          return;
        }
        this.closeModal();
      });

      this.openModal(
        h("div", { className: `modal-card slide-up ${wide ? "modal-wide" : ""}` },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: title }),
          form
        )
      );
    },
    statusPill(status) {
      return h("span", {
        className: `status-pill status-value status-${status} notranslate`,
        translate: "no",
        text: localizeStaticPhrase(StatusLabels[status] || status)
      });
    },
    renderTopbar() {
      clear(Dom.topActions);

      if (Session.allowedModes().length > 1) {
        Dom.topActions.appendChild(
          h("button", { className: "button button-ghost button-small", type: "button", dataset: { action: "cycle-mode" } },
            icon("fa-solid fa-repeat"),
            "切换模式"
          )
        );
      }

      if (State.mode === "admin") {
        Dom.topActions.appendChild(
          h("button", { className: "icon-button square", type: "button", dataset: { action: "open-admin" }, ariaLabel: "管理控制台", title: "管理控制台" },
            icon("fa-solid fa-screwdriver-wrench")
          )
        );
      }

      if (!State.currentUser) {
        Dom.topActions.appendChild(
          h("button", { className: "account-button", type: "button", dataset: { action: "open-guest-menu" }, ariaLabel: "账户菜单", title: "账户菜单" },
            icon("fa-regular fa-user")
          )
        );
        return;
      }

      const profile = Data.profileByUsername(State.currentUser.username);
      const unreadMail = Data.unreadMailboxCount(State.currentUser.username);
      Dom.topActions.appendChild(
        h("button", {
          className: "icon-button square mail-button",
          type: "button",
          dataset: { mailboxTrigger: "true" },
          ariaLabel: "邮件中心",
          title: "邮件中心"
        },
          icon("fa-regular fa-envelope"),
          unreadMail ? h("span", { className: "unread-badge mail-unread-badge", text: unreadMail > 99 ? "99+" : String(unreadMail) }) : null
        )
      );
      const avatar = h("button", { className: "avatar-button notranslate", translate: "no", type: "button", dataset: { action: "open-user-menu" }, ariaLabel: "账户菜单", title: "账户菜单" },
        profile?.avatarImage
          ? h("img", { src: profile.avatarImage, alt: "头像" })
          : profileAvatarText(profile, State.currentUser.username)
      );
      const userName = h("button", {
        className: "user-name user-name-button notranslate",
        translate: "no",
        type: "button",
        dataset: { action: "open-user-menu" },
        ariaLabel: "账户菜单",
        title: "账户菜单"
      }, State.currentUser.username);
      Dom.topActions.appendChild(h("div", { className: "user-chip" }, avatar, userName));
    },
    pageMeta() {
      const route = State.route;
      const metrics = Data.metrics();
      if (State.mode === "staff") {
        if (route.name === "staff") {
          const section = StaffSections.find((item) => item.id === route.params.section) || StaffSections[0];
          return {
            kicker: Modes[State.mode],
            title: section.title,
            description: section.description,
            stats: [
              ["待处理", metrics.pending],
              ["进行中", metrics.processing],
              ["已完成", metrics.completed]
            ]
          };
        }
        return {
          kicker: Modes[State.mode],
          title: "Vector 工作台",
          description: "订单处理、预约跟进、结单记录与个人日志集中在一个工作视图里。",
          stats: [
            ["待处理", metrics.pending],
            ["进行中", metrics.processing],
            ["全部订单", metrics.orders]
          ]
        };
      }

      if (route.name === "category") {
        const category = Data.category(route.params.categoryId);
        return {
          kicker: Modes[State.mode],
          title: category ? localizedContent(category, "title") : "游戏分区",
          description: category ? localizedContent(category, "description") : "选择游戏分区查看商品。",
          stats: [
            ["分区", (Data.games()[route.params.categoryId] || []).length],
            ["商品", Data.allProductsWithMeta().filter((item) => item.category.id === route.params.categoryId).length],
            ["模式", Modes[State.mode].replace("模式", "")]
          ]
        };
      }

      if (route.name === "products") {
        const game = Data.game(route.params.categoryId, route.params.gameId);
        return {
          kicker: Modes[State.mode],
          title: game ? localizedContent(game, "title") : "商品列表",
          description: game ? localizedContent(game, "description") : "逐行浏览商品，并查看具体服务详情。",
          stats: [
            ["商品", (Data.products()[route.params.gameId] || []).length],
            ["订单", metrics.orders],
            ["模式", Modes[State.mode].replace("模式", "")]
          ]
        };
      }

      if (route.name === "search") {
        return {
          kicker: Modes[State.mode],
          title: "搜索结果",
          description: route.params.q ? `与“${route.params.q}”相关的服务、游戏和商品。` : "输入关键词后查看匹配内容。",
          stats: [
            ["分类", metrics.categories],
            ["分区", metrics.games],
            ["商品", metrics.products]
          ]
        };
      }

      if (route.name === "account") {
        return {
          kicker: Modes[State.mode],
          title: "我的账户",
          description: "查看本地订单、预约和账户状态。",
          stats: [
            ["我的订单", State.currentUser ? Data.orders().filter((order) => order.customerUsername === State.currentUser.username).length : 0],
            ["待处理", State.currentUser ? Data.orders().filter((order) => order.customerUsername === State.currentUser.username && order.status === "pending").length : 0],
            ["已完成", State.currentUser ? Data.orders().filter((order) => order.customerUsername === State.currentUser.username && order.status === "completed").length : 0]
          ]
        };
      }

      if (route.name === "admin") {
        return {
          kicker: Modes[State.mode],
          title: "管理控制台",
          description: "统一维护商品数据、订单数据和本地演示数据。",
          stats: [
            ["分类", metrics.categories],
            ["商品", metrics.products],
            ["订单", metrics.orders]
          ]
        };
      }

      if (route.name === "info") {
        const isPolicy = LegalInfoPages.includes(route.params.page);
        const titles = {
          about: "关于我们",
          help: "帮助中心",
          ...Object.fromEntries(LegalInfoPages.map((page) => [page, LegalInfoContent[page]?.title || "Policy"]))
        };
        return {
          kicker: BrandName,
          title: titles[route.params.page] || "站点信息",
          description: isPolicy
            ? "English controls this policy page and any related official terms."
            : `${BrandName} - ${BrandTagline}`,
          stats: isPolicy
            ? [["Categories", metrics.categories], ["Game Sections", metrics.games], ["Products", metrics.products]]
            : [["分类", metrics.categories], ["分区", metrics.games], ["商品", metrics.products]]
        };
      }

      return {
        kicker: Modes[State.mode],
        title: State.mode === "admin" ? "管理商品与服务内容" : "选择你需要的游戏服务",
        description: State.mode === "admin"
          ? "管理员可以维护一级分类、游戏分区、商品与订单记录。"
          : "专业教练、语音陪玩、雇佣兵与账号交易集中在一个清爽的购物体验里。",
        stats: [
          ["分类", metrics.categories],
          ["分区", metrics.games],
          ["商品", metrics.products]
        ]
      };
    },
    renderHero() {
      const meta = this.pageMeta();
      const protectedInfo = State.route.name === "info" && LegalInfoPages.includes(State.route.params.page);
      clear(Dom.heroPanel);
      Dom.heroPanel.classList.toggle("notranslate", protectedInfo);
      Dom.heroPanel.classList.toggle("policy-hero", protectedInfo);
      if (protectedInfo) {
        Dom.heroPanel.setAttribute("translate", "no");
        Dom.heroPanel.dataset.noMachineTranslate = "true";
      } else {
        Dom.heroPanel.removeAttribute("translate");
        delete Dom.heroPanel.dataset.noMachineTranslate;
      }
      Dom.heroPanel.append(
        h("div", {},
          h("p", { className: "hero-kicker", text: meta.kicker }),
          h("h1", { text: meta.title }),
          h("p", { text: meta.description })
        ),
        h("div", { className: "hero-stats" },
          meta.stats.map(([label, value]) => h("div", { className: "stat" }, h("strong", { text: value }), h("span", { text: label })))
        )
      );
    },
    renderBreadcrumb() {
      clear(Dom.breadcrumb);
      const add = (label, action) => {
        Dom.breadcrumb.appendChild(h("button", { type: "button", onClick: action }, label));
      };
      const slash = () => Dom.breadcrumb.appendChild(h("span", { text: "/" }));
      add(State.mode === "staff" ? "工作台" : "首页", () => Router.go("home"));

      if (State.route.name === "category" || State.route.name === "products") {
        const category = Data.category(State.route.params.categoryId);
        slash();
        if (State.route.name === "category") {
          Dom.breadcrumb.appendChild(h("span", { text: category ? localizedContent(category, "title") : "分类" }));
        } else {
          add(category ? localizedContent(category, "title") : "分类", () => Router.go("category", { categoryId: State.route.params.categoryId }));
        }
      }

      if (State.route.name === "products") {
        const game = Data.game(State.route.params.categoryId, State.route.params.gameId);
        slash();
        Dom.breadcrumb.appendChild(h("span", { text: game ? localizedContent(game, "title") : "商品" }));
      }

      if (State.route.name === "staff") {
        const section = StaffSections.find((item) => item.id === State.route.params.section);
        slash();
        Dom.breadcrumb.appendChild(h("span", { text: section ? section.title : "详情" }));
      }

      if (State.route.name === "account") {
        slash();
        Dom.breadcrumb.appendChild(h("span", { text: "我的账户" }));
      }

      if (State.route.name === "admin") {
        slash();
        Dom.breadcrumb.appendChild(h("span", { text: "管理控制台" }));
      }
    },
    showMenuAt(x, y, items) {
      clear(Dom.contextMenu);
      items.forEach((item) => {
        if (item.type === "separator") {
          Dom.contextMenu.appendChild(h("div", { className: "menu-separator", role: "separator" }));
          return;
        }
        if (item.type === "summary") {
          Dom.contextMenu.appendChild(item.node || h("div", { className: "menu-summary" },
            item.icon ? h("div", { className: "menu-summary-icon" }, icon(item.icon)) : null,
            h("div", {},
              h("strong", { text: item.title || "" }),
              item.subtitle ? h("span", { text: item.subtitle }) : null
            )
          ));
          return;
        }
        Dom.contextMenu.appendChild(
          h("button", {
            type: "button",
            className: item.destructive ? "destructive" : "",
            onClick: () => {
              this.hideMenu();
              item.action();
            }
          }, item.icon ? icon(item.icon) : null, item.label)
        );
      });
      Dom.contextMenu.classList.remove("hidden");
      const width = Dom.contextMenu.offsetWidth;
      const height = Dom.contextMenu.offsetHeight;
      Dom.contextMenu.style.left = `${Math.max(12, Math.min(x, window.innerWidth - width - 12))}px`;
      Dom.contextMenu.style.top = `${Math.max(12, Math.min(y, window.innerHeight - height - 12))}px`;
      Translation.localizeStaticUi(Dom.contextMenu);
    },
    showMenuFromElement(element, items) {
      const rect = element.getBoundingClientRect();
      this.showMenuAt(rect.right - 12, rect.bottom + 8, items);
    },
    hideMenu() {
      Dom.contextMenu.classList.add("hidden");
    }
  };

  function adminRouteKey(route = State.route) {
    if (route.name === "home") {
      return "home";
    }
    if (route.name === "category") {
      return `category:${route.params.categoryId || ""}`;
    }
    if (route.name === "products") {
      return `products:${route.params.categoryId || ""}:${route.params.gameId || ""}`;
    }
    return route.name || "";
  }

  function adminEditContext(route = State.route) {
    if (State.mode !== "admin") {
      return null;
    }
    if (route.name === "home") {
      return {
        type: "category",
        routeKey: adminRouteKey(route),
        title: "分类",
        addLabel: "新增分类",
        batchLabel: "批量管理",
        itemName: "分类",
        items: Data.categories().map((category) => ({ id: category.id, label: localizedContent(category, "title") }))
      };
    }
    if (route.name === "category") {
      const categoryId = route.params.categoryId;
      return {
        type: "game",
        routeKey: adminRouteKey(route),
        title: "游戏分区",
        addLabel: "新增游戏分区",
        batchLabel: "批量管理",
        itemName: "分区",
        categoryId,
        items: (Data.games()[categoryId] || []).map((game) => ({ id: game.id, label: localizedContent(game, "title") }))
      };
    }
    if (route.name === "products") {
      const gameId = route.params.gameId;
      return {
        type: "product",
        routeKey: adminRouteKey(route),
        title: "商品",
        addLabel: "新增商品",
        batchLabel: "批量管理",
        itemName: "商品",
        categoryId: route.params.categoryId,
        gameId,
        items: (Data.products()[gameId] || []).map((product) => ({ id: product.id, label: localizedContent(product, "title") }))
      };
    }
    return null;
  }

  function ensureAdminBatch(context = adminEditContext()) {
    if (!context || State.adminBatch.routeKey !== context.routeKey || State.adminBatch.type !== context.type) {
      State.adminBatch = {
        active: false,
        type: context?.type || "",
        routeKey: context?.routeKey || "",
        selected: []
      };
    }
    return State.adminBatch;
  }

  function isAdminBatchTarget(type) {
    const context = adminEditContext();
    const batch = ensureAdminBatch(context);
    return Boolean(context && batch.active && batch.type === type);
  }

  function isAdminBatchSelected(type, id) {
    const batch = ensureAdminBatch();
    return Boolean(batch.active && batch.type === type && batch.selected.includes(id));
  }

  function adminEditToolbar(context = adminEditContext()) {
    if (!context) {
      return null;
    }
    const batch = ensureAdminBatch(context);
    const selectedCount = batch.selected.length;
    return h("section", { className: `admin-edit-toolbar ${batch.active ? "batch-active" : ""}` },
      h("div", {},
        h("strong", {}, icon("fa-solid fa-pen-to-square"), localizeStaticPhrase("编辑模式")),
        h("span", { text: "右键仍可编辑或删除，也可以使用这里的快捷按钮批量处理。" })
      ),
      h("div", { className: "row-actions" },
        h("button", { className: "button button-primary button-small", type: "button", dataset: { action: "admin-add-content", manageType: context.type } }, icon("fa-solid fa-plus"), context.addLabel),
        h("button", { className: "button button-ghost button-small", type: "button", dataset: { action: "toggle-admin-batch", manageType: context.type } }, icon("fa-solid fa-list-check"), batch.active ? "退出批量" : context.batchLabel),
        batch.active ? h("button", { className: "button button-ghost button-small", type: "button", dataset: { action: "select-all-admin-batch" } }, icon("fa-regular fa-square-check"), "全选") : null,
        batch.active ? h("button", { className: "button button-ghost button-small", type: "button", dataset: { action: "clear-admin-batch-selection" } }, icon("fa-regular fa-square"), "清空选择") : null,
        batch.active ? h("button", { className: "button button-danger button-small", type: "button", dataset: { action: "delete-admin-batch-selected" } }, icon("fa-solid fa-trash"), "删除选中") : null,
        batch.active ? h("span", { className: "batch-count" }, localizeStaticPhrase("已选择"), " ", selectedCount, " ", localizeStaticPhrase("项")) : null
      )
    );
  }

  const Components = {
    card({ item, action, dataset = {}, buttonText }) {
      const batchActive = isAdminBatchTarget(dataset.manageType);
      const selected = batchActive && isAdminBatchSelected(dataset.manageType, item.id);
      const cardTitle = localizedContent(item, "title");
      const cardDescription = localizedContent(item, "description", "暂无描述。") || "暂无描述。";
      const cardButton = localizeStaticPhrase(buttonText);
      return h("article", {
        className: `card ${dataset.manageType === "game" ? "game-card" : ""} ${batchActive ? "admin-selectable" : ""} ${selected ? "selected" : ""}`,
        role: "button",
        tabIndex: "0",
        dataset: batchActive ? { action: "toggle-admin-batch-item", ...dataset } : { action, ...dataset }
      },
        batchActive ? h("span", { className: "batch-check" }, selected ? icon("fa-solid fa-check") : null) : null,
        item.imageData
          ? h("div", { className: "card-image" }, h("img", { src: item.imageData, alt: cardTitle || "展示图片" }))
          : h("div", { className: "card-icon" }, icon(item.icon || "fa-solid fa-star")),
        h("div", {},
          h("h2", { className: hasProtectedRoleTerm(cardTitle) ? "notranslate" : "", translate: hasProtectedRoleTerm(cardTitle) ? "no" : null, text: cardTitle }),
          h("p", { className: hasProtectedRoleTerm(cardDescription) ? "notranslate" : "", translate: hasProtectedRoleTerm(cardDescription) ? "no" : null, text: cardDescription }),
          localizedContent(item, "platform") ? h("div", { className: "tag-row" }, h("span", { className: "tag", text: localizedContent(item, "platform") })) : null
        ),
        h("div", { className: "card-footer" },
          h("span", { className: `tag ${hasProtectedRoleTerm(cardButton) ? "notranslate" : ""}`, translate: hasProtectedRoleTerm(cardButton) ? "no" : null, text: cardButton })
        )
      );
    },
    productRow({ product, game, category }) {
      const batchActive = isAdminBatchTarget("product");
      const selected = batchActive && isAdminBatchSelected("product", product.id);
      const rowDataset = batchActive
        ? { action: "toggle-admin-batch-item", manageType: "product", manageId: product.id, gameId: game.id }
        : { manageType: "product", manageId: product.id, gameId: game.id };
      return h("article", {
        className: `product-row ${batchActive ? "admin-selectable" : ""} ${selected ? "selected" : ""}`,
        dataset: rowDataset
      },
        batchActive ? h("span", { className: "batch-check" }, selected ? icon("fa-solid fa-check") : null) : null,
        h("div", {},
          h("h3", { className: "row-title", text: localizedContent(product, "title") }),
          h("div", { className: "row-meta" },
            h("span", { text: localizedContent(category, "title") }),
            h("span", { text: localizedContent(game, "title") }),
            localizedContent(product, "duration") ? h("span", { text: localizedContent(product, "duration") }) : null,
            localizedContent(product, "badge") ? h("span", { className: "tag", text: localizedContent(product, "badge") }) : null
          )
        ),
        h("div", { className: "price financial-value notranslate", translate: "no", text: formatPrice(product.price) }),
        h("button", {
          className: "button button-ghost button-small",
          type: "button",
          disabled: batchActive,
          dataset: batchActive ? {} : { action: "view-product", productId: product.id }
        },
          icon("fa-solid fa-eye"),
          "查看详情"
        )
      );
    },
    orderRow(order, mode = "customer") {
      const canManage = mode === "staff" || mode === "admin";
      const canCancel = mode === "customer" && order.status === "pending";
      const contactLocked = order.type === "order" && (!order.handledBy || order.status === "pending");
      const unreadCount = State.currentUser ? Data.unreadChatCount(order.id, State.currentUser.username) : 0;
      const actions = [];
      if (order.type === "order" && (mode === "customer" || (canManage && order.handledBy))) {
        actions.push(h("button", {
          className: `button button-small ${contactLocked ? "button-disabled" : "button-ghost"}`,
          type: "button",
          dataset: { action: "open-order-chat", orderId: order.id }
        }, icon("fa-regular fa-comments"), "联系", unreadCount ? h("span", { className: "unread-badge", text: unreadCount }) : null));
      }
      if (canManage && order.status === "pending") {
        actions.push(h("button", { className: "button button-success button-small", type: "button", dataset: { action: "order-status", orderId: order.id, status: "processing" } }, "接单"));
      }
      if (canManage && order.status === "processing") {
        actions.push(h("button", { className: "button button-primary button-small", type: "button", dataset: { action: "order-status", orderId: order.id, status: "completed" } }, "完成"));
      }
      if (canManage && ["pending", "processing"].includes(order.status)) {
        actions.push(h("button", { className: "button button-ghost button-small", type: "button", dataset: { action: "order-status", orderId: order.id, status: "cancelled" } }, "取消"));
      }
      if (canCancel) {
        actions.push(h("button", { className: "button button-ghost button-small", type: "button", dataset: { action: "cancel-order", orderId: order.id } }, "取消订单"));
      }

      return h("article", { className: "order-row" },
        h("div", {},
          h("h3", { className: "row-title", text: localizedOrderContent(order, "productTitle") }),
          h("div", { className: "row-meta" },
            h("span", {}, localizeStaticPhrase(OrderTypeLabels[order.type] || "订单"), " ", order.id.slice(-6).toUpperCase()),
            h("span", { text: localizedOrderContent(order, "gameTitle") }),
            h("span", { className: "financial-value notranslate", translate: "no", text: formatPrice(order.price) }),
            h("span", { text: formatFullDate(order.createdAt) }),
            order.appointmentAt ? h("span", {}, localizeStaticPhrase("预约"), " ", formatFullDate(order.appointmentAt)) : null,
            order.autoCancelAt && order.status === "pending" ? h("span", {}, localizeStaticPhrase("超时无人接单自动退单"), " ", formatFullDate(order.autoCancelAt)) : null,
            order.acceptedAt ? h("span", {}, localizeStaticPhrase("接单时间"), " ", formatFullDate(order.acceptedAt)) : null,
            rushStatusLabel(order.rush) ? h("span", { className: "tag status-value notranslate", translate: "no", text: rushStatusLabel(order.rush) }) : null,
            order.handledBy ? h("span", {}, localizeStaticPhrase("接单"), " ", h("span", { className: "notranslate", translate: "no", text: order.handledBy })) : null,
            order.refundedAt ? h("span", {}, localizeStaticPhrase("已退款"), " ", formatFullDate(order.refundedAt)) : null,
            order.returnRefundedAt ? h("span", {}, localizeStaticPhrase("退单退款"), " ", financialText(order.returnRefundAmount)) : null,
            order.settledAt ? h("span", {}, localizeStaticPhrase("已结算"), " ", formatFullDate(order.settledAt)) : null,
            canManage ? h("span", {}, protectedText("Gamer", "role-term"), " ", h("span", { className: "notranslate", translate: "no", text: order.customerUsername })) : null,
            UI.statusPill(order.status)
          ),
          order.note ? h("p", { text: order.note }) : null
        ),
        h("div", { className: "row-actions" }, actions)
      );
    },
    empty(text, actionNode = null) {
      return h("div", { className: "empty-state" }, h("div", {}, h("p", { text }), actionNode));
    }
  };

  const Views = {
    render() {
      clear(Dom.contentZone);
      const route = State.route;
      if (route.name === "category") {
        Dom.contentZone.appendChild(this.category(route.params.categoryId));
        return;
      }
      if (route.name === "products") {
        Dom.contentZone.appendChild(this.products(route.params.categoryId, route.params.gameId));
        return;
      }
      if (route.name === "search") {
        Dom.contentZone.appendChild(this.search(route.params.q));
        return;
      }
      if (route.name === "account") {
        Dom.contentZone.appendChild(this.account());
        return;
      }
      if (route.name === "staff") {
        Dom.contentZone.appendChild(this.staffSection(route.params.section));
        return;
      }
      if (route.name === "admin") {
        Dom.contentZone.appendChild(this.admin());
        return;
      }
      if (route.name === "info") {
        Dom.contentZone.appendChild(this.info(route.params.page));
        return;
      }
      Dom.contentZone.appendChild(State.mode === "staff" ? this.staffHome() : this.home());
    },
    home() {
      const categories = Data.categories();
      const content = categories.length ? h("div", { className: "grid" },
        categories.map((category) => Components.card({
          item: category,
          action: "open-category",
          buttonText: "查看分区",
          dataset: { categoryId: category.id, manageType: "category", manageId: category.id }
        }))
      ) : Components.empty("暂无分类。");
      return State.mode === "admin" ? h("div", { className: "admin-stack" }, adminEditToolbar(), content) : content;
    },
    category(categoryId) {
      const category = Data.category(categoryId);
      if (!category) {
        return Components.empty("分类不存在。");
      }
      const games = Data.games()[categoryId] || [];
      const content = games.length ? h("div", { className: "grid grid-two" },
        games.map((game) => Components.card({
          item: game,
          action: "open-products",
          buttonText: "查看商品",
          dataset: { categoryId, gameId: game.id, manageType: "game", manageId: game.id }
        }))
      ) : Components.empty("暂无游戏分区。");
      return State.mode === "admin" ? h("div", { className: "admin-stack" }, adminEditToolbar(), content) : content;
    },
    products(categoryId, gameId) {
      const category = Data.category(categoryId);
      const game = Data.game(categoryId, gameId);
      if (!category || !game) {
        return Components.empty("游戏分区不存在。");
      }
      const products = Data.products()[gameId] || [];
      const content = products.length ? h("div", { className: "product-list" },
        products.map((product) => Components.productRow({ product, game, category }))
      ) : Components.empty("暂无商品。");
      return State.mode === "admin" ? h("div", { className: "admin-stack" }, adminEditToolbar(), content) : content;
    },
    search(query) {
      const q = normalize(query);
      if (!q) {
        return Components.empty("请输入搜索关键词。");
      }
      const categoryMatches = Data.categories().filter((category) => normalize(searchContentText(category, ["title", "description"])).includes(q));
      const gameMatches = [];
      Data.categories().forEach((category) => {
        (Data.games()[category.id] || []).forEach((game) => {
          if (normalize(searchContentText(game, ["title", "description", "platform"])).includes(q)) {
            gameMatches.push({ category, game });
          }
        });
      });
      const productMatches = Data.allProductsWithMeta().filter(({ product, game, category }) => normalize([
        searchContentText(product, ["title", "description", "duration", "badge"]),
        searchContentText(game, ["title", "description", "platform"]),
        searchContentText(category, ["title", "description"])
      ].join(" ")).includes(q));

      if (!categoryMatches.length && !gameMatches.length && !productMatches.length) {
        return Components.empty("没有找到匹配内容。");
      }

      return h("div", { className: "dashboard" },
        h("section", { className: "panel" },
          h("h2", { text: "商品" }),
          productMatches.length
            ? h("div", { className: "product-list" }, productMatches.map((item) => Components.productRow(item)))
            : h("p", { text: "暂无匹配商品。" })
        ),
        h("section", { className: "panel" },
          h("h2", { text: "分类与分区" }),
          h("div", { className: "product-list" },
            categoryMatches.map((category) => h("button", { className: "button button-ghost", type: "button", dataset: { action: "open-category", categoryId: category.id } }, icon(category.icon), localizedContent(category, "title"))),
            gameMatches.map(({ category, game }) => h("button", { className: "button button-ghost", type: "button", dataset: { action: "open-products", categoryId: category.id, gameId: game.id } }, icon(game.icon), localizedContent(game, "title")))
          )
        )
      );
    },
    account() {
      if (!State.currentUser) {
        return Components.empty("登录后可查看订单与预约。", h("button", { className: "button button-primary", type: "button", dataset: { action: "open-login" } }, "登录账户"));
      }
      const profile = Data.profileByUsername(State.currentUser.username);
      const orders = Data.orders().filter((order) => order.customerUsername === State.currentUser.username);
      const wallet = h("section", { className: "panel" },
        h("div", { className: "detail-heading" },
          h("div", {},
            h("h2", { text: "账户积分" }),
            h("p", { text: profile ? `${localizeStaticPhrase("当前余额：")}${formatPrice(profile.funds)}` : "当前账户暂不可充值。" })
          ),
          profile ? h("button", { className: "button button-primary", type: "button", dataset: { action: "open-recharge" } }, icon("fa-solid fa-coins"), "充值积分") : null
        )
      );
      return h("div", { className: "admin-stack" },
        wallet,
        orders.length
          ? h("div", { className: "order-list" }, orders.map((order) => Components.orderRow(order, "customer")))
          : Components.empty("暂无订单。", h("button", { className: "button button-primary", type: "button", dataset: { action: "go-home" } }, "浏览服务"))
      );
    },
    staffHome() {
      const orders = Data.orders();
      const countFor = (section) => {
        if (section === "active") {
          return orders.filter((order) => order.type === "order" && ["pending", "processing"].includes(order.status)).length;
        }
        if (section === "reserved") {
          return orders.filter((order) => order.type === "reservation" && ["pending", "processing"].includes(order.status)).length;
        }
        if (section === "completed") {
          return orders.filter((order) => ["completed", "cancelled"].includes(order.status)).length;
        }
        return "日志";
      };

      return h("div", { className: "grid" },
        StaffSections.map((section) => {
          const count = countFor(section.id);
          const countEn = typeof count === "number" ? count : staticPhraseIn(count, "en");
          const countZh = typeof count === "number" ? count : staticPhraseIn(count, "zh-CN");
          return Components.card({
            item: {
              ...section,
              titleI18n: localizedPair(staticPhraseIn(section.title, "en"), section.title),
              descriptionI18n: localizedPair(`${staticPhraseIn(section.description, "en")} ${staticPhraseIn("当前", "en")}: ${countEn}`, `${section.description} 当前：${countZh}`)
            },
            action: "open-staff-section",
            buttonText: "进入",
            dataset: { section: section.id }
          });
        })
      );
    },
    staffSection(sectionId) {
      if (sectionId === "log") {
        const key = `${Keys.staffLog}:${State.currentUser ? State.currentUser.username : "staff"}`;
        return h("div", { className: "dashboard" },
          h("section", { className: "panel" },
            h("h2", { text: "个人日志" }),
            h("label", { className: "field" },
              "工作记录",
              h("textarea", {
                value: localStorage.getItem(key) || "",
                placeholder: "记录服务进展、Gamer 备注或异常事项",
                onInput: (event) => localStorage.setItem(key, event.target.value)
              })
            )
          ),
          h("section", { className: "panel" },
            h("h2", { text: "今日概览" }),
            h("div", { className: "metric-strip" },
              h("div", { className: "metric" }, h("strong", { text: Data.metrics().pending }), h("span", { text: "待处理" })),
              h("div", { className: "metric" }, h("strong", { text: Data.metrics().processing }), h("span", { text: "进行中" })),
              h("div", { className: "metric" }, h("strong", { text: Data.metrics().completed }), h("span", { text: "已完成" }))
            )
          )
        );
      }

      const orders = Data.orders().filter((order) => {
        if (sectionId === "active") {
          return order.type === "order" && ["pending", "processing"].includes(order.status);
        }
        if (sectionId === "reserved") {
          return order.type === "reservation" && ["pending", "processing"].includes(order.status);
        }
        return ["completed", "cancelled"].includes(order.status);
      });

      if (!orders.length) {
        return Components.empty("暂无相关订单。");
      }
      return h("div", { className: "order-list" }, orders.map((order) => Components.orderRow(order, "staff")));
    },
    admin() {
      const { section } = State.route.params;
      if (!section) {
        return h("div", { className: "grid" },
          AdminSections.map((item) => Components.card({
            item: {
              ...item,
              titleI18n: localizedPair(staticPhraseIn(item.title, "en"), item.title),
              descriptionI18n: localizedPair(staticPhraseIn(item.description, "en"), item.description)
            },
            action: "request-admin-section",
            buttonText: "输入二级密码",
            dataset: { section: item.id }
          }))
        );
      }

      const meta = AdminSections.find((item) => item.id === section);
      if (!meta) {
        return Components.empty("管理分区不存在。");
      }
      if (!State.adminUnlocked[section]) {
        return h("section", { className: "panel gate-panel" },
          h("div", { className: "card-icon" }, icon(meta.icon)),
          h("h2", { text: meta.title }),
          h("p", { text: "该分区需要二级密码才能打开。" }),
          h("div", { className: "modal-actions" },
            h("button", { className: "button button-primary", type: "button", dataset: { action: "unlock-admin-section", section } }, "输入二级密码"),
            h("button", { className: "button button-ghost", type: "button", dataset: { action: "open-admin" } }, "返回控制台")
          )
        );
      }

      if (section === "users") {
        return this.adminUsers();
      }
      if (section === "orders") {
        return this.adminOrders();
      }
      if (section === "ledger") {
        return this.adminLedger();
      }
      return this.adminLogs();
    },
    adminUsers() {
      const { role, userId, tab } = State.route.params;
      if (!role) {
        return h("div", { className: "grid grid-two" },
          Components.card({
            item: {
              title: "Gamer",
              description: "查看 Gamer 账户、积分、订单与限制状态。",
              titleI18n: localizedPair("Gamer", "Gamer"),
              descriptionI18n: localizedPair(staticPhraseIn("查看 Gamer 账户、积分、订单与限制状态。", "en"), "查看 Gamer 账户、积分、订单与限制状态。"),
              icon: "fa-solid fa-user"
            },
            action: "open-admin-user-role",
            buttonText: "查看 Gamer",
            dataset: { role: "customer" }
          }),
          Components.card({
            item: {
              title: "Vector",
              description: "查看 Vector 账户、积分、订单与兑现记录。",
              titleI18n: localizedPair("Vector", "Vector"),
              descriptionI18n: localizedPair(staticPhraseIn("查看 Vector 账户、积分、订单与兑现记录。", "en"), "查看 Vector 账户、积分、订单与兑现记录。"),
              icon: "fa-solid fa-user-tie"
            },
            action: "open-admin-user-role",
            buttonText: "查看 Vector",
            dataset: { role: "staff" }
          })
        );
      }

      const profile = userId ? Data.profileById(userId) : null;
      if (profile) {
        return this.adminUserDetail(profile, tab || (profile.role === "staff" ? "cashout" : "recharge"));
      }

      const query = normalize(State.adminUserSearch);
      const users = Data.profiles().filter((item) => {
        if (item.role !== role) {
          return false;
        }
        return !query || normalize(`${item.id} ${item.username}`).includes(query);
      });

      return h("section", { className: "panel" },
        h("div", { className: "toolbar" },
          h("label", { className: "field" }, "通过 ID 或用户名查询用户",
            h("input", { type: "search", value: State.adminUserSearch, placeholder: "输入用户 ID 或用户名", dataset: { action: "admin-user-search" } })
          ),
          h("div", { className: "row-actions" },
            h("button", { className: "button button-primary", type: "button", dataset: { action: "admin-search-refresh" } }, "查询"),
            h("button", { className: "button button-ghost", type: "button", dataset: { action: "open-admin-users" } }, "返回用户分区")
          )
        ),
        h("div", { className: "admin-table" },
          h("div", { className: "admin-table-head user-grid" },
            h("span", { text: "用户ID" }),
            h("span", { text: "用户名" }),
            h("span", { text: "资金" }),
            h("span", { text: "在线状态" })
          ),
          users.map((item) => h("button", { className: "admin-table-row user-grid", type: "button", dataset: { action: "open-admin-user-detail", role, userId: item.id } },
            h("span", { className: "mono", text: item.id }),
            h("span", { className: "notranslate", translate: "no", text: item.username }),
            h("span", {}, financialText(item.funds)),
            h("span", {}, protectedText(userStatus(item), "status-value"))
          ))
        )
      );
    },
    adminUserDetail(profile, tab) {
      const tabs = profile.role === "staff"
        ? [["cashout", "兑现记录"], ["orders", "订单记录"], ["adjust", "参数修正"], ["restrict", "封禁或注销"]]
        : [["recharge", "充值记录"], ["orders", "订单记录"], ["adjust", "参数修正"], ["restrict", "封禁或注销"]];

      return h("section", { className: "panel" },
        h("div", { className: "detail-heading" },
          h("div", {},
            h("h2", {}, h("span", { className: "notranslate", translate: "no", text: profile.username })),
            h("p", {}, localizeStaticPhrase("用户ID"), "：", h("span", { className: "mono notranslate", translate: "no", text: profile.id }), " / ", localizeStaticPhrase("注册时间"), "：", formatFullDate(profile.createdAt), " / ", localizeStaticPhrase("状态"), "：", userStatus(profile))
          ),
          h("button", { className: "button button-ghost", type: "button", dataset: { action: "open-admin-user-role", role: profile.role } }, "返回列表")
        ),
        this.adminUserOverview(profile),
        h("div", { className: "tabs" },
          tabs.map(([key, label]) => h("button", { className: `tab ${tab === key ? "active" : ""}`, type: "button", dataset: { action: "open-admin-user-tab", role: profile.role, userId: profile.id, tab: key } }, label))
        ),
        this.adminUserTab(profile, tab)
      );
    },
    adminUserOverview(profile) {
      const user = Data.findUser(profile.username) || {};
      const roleLabel = RoleDisplayNames[profile.role] || profile.role || "Gamer";
      const accountState = profile.deleted
        ? localizeStaticPhrase("已注销")
        : isBanned(profile)
          ? `${localizeStaticPhrase("封禁")} ${formatFullDate(profile.bannedUntil)}`
          : localizeStaticPhrase("正常");
      const row = ({ label, value, valueNode, muted = false }) => h("div", { className: "settings-row" },
        h("div", {},
          h("span", { text: `${localizeStaticPhrase(label)}：` }),
          valueNode || h("strong", {
            className: muted ? "muted" : "",
            text: value ? localizeStaticPhrase(value) : localizeStaticPhrase("未设置")
          })
        )
      );

      return h("div", { className: "settings-list admin-user-overview" },
        h("h3", { text: "账户概览" }),
        row({ label: "用户ID", valueNode: protectedText(profile.id, "mono") }),
        row({ label: "用户名", valueNode: protectedText(profile.username) }),
        row({ label: "角色", valueNode: protectedText(roleLabel, "role-term") }),
        row({ label: "邮箱", valueNode: protectedText(userEmail(user) || "未设置") }),
        row({ label: "通知邮箱", valueNode: protectedText(profile.notificationEmail || userEmail(user) || "未设置") }),
        row({ label: "用户等级", value: `Lv${clampUserLevel(profile.level)}` }),
        row({ label: "剩余资金", valueNode: financialText(profile.funds) }),
        row({ label: "国家或地区", valueNode: protectedText(profile.countryRegion || "未设置") }),
        row({ label: "生日", valueNode: protectedText(profile.birthday || "未设置") }),
        row({ label: "性别", value: genderLabel(profile.gender) }),
        row({ label: "注册时间", value: formatFullDate(profile.createdAt) }),
        row({ label: "在线状态", valueNode: protectedText(userStatus(profile), "status-value") }),
        row({ label: "账户状态", valueNode: protectedText(accountState, "status-value") }),
        row({ label: "账户密码", value: "已隐藏", muted: true }),
        h("p", { className: "policy-control-note", text: "账户密码已隐藏，管理员界面不会展示或导出明文密码。" })
      );
    },
    adminUserTab(profile, tab) {
      if (tab === "recharge") {
        const rows = Data.ledger().filter((entry) => entry.userId === profile.id && entry.type === "recharge");
        return this.simpleTable(["单号", "充值项目", "充值积分", "充值金额", "充值时间"], rows.map((entry) => [
          entry.id,
          entry.itemName || entry.title,
          financialText(entry.amountPoints),
          protectedText(`$${entry.amountMoney || 0}`, "financial-value"),
          formatFullDate(entry.createdAt)
        ]));
      }
      if (tab === "cashout") {
        const rows = Data.ledger().filter((entry) => entry.userId === profile.id && entry.type === "cashout");
        return this.simpleTable(["单号", "兑现金额", "兑现时间"], rows.map((entry) => [
          entry.id,
          protectedText(`¥${entry.amountMoney || Math.abs(entry.amountPoints || 0)}`, "financial-value"),
          formatFullDate(entry.createdAt)
        ]));
      }
      if (tab === "orders") {
        const rows = Data.orders().filter((order) => profile.role === "staff" ? order.handledBy === profile.username : order.customerUsername === profile.username);
        return this.simpleTable(["单号", "订单名称", "订单金额", "下单时间", "结单时间"], rows.map((order) => [
          order.id,
          localizedOrderContent(order, "productTitle"),
          financialText(order.price),
          formatFullDate(order.createdAt),
          order.completedAt ? formatFullDate(order.completedAt) : protectedText(localizeStaticPhrase("未结单"), "status-value")
        ]));
      }
      if (tab === "adjust") {
        return h("div", { className: "admin-stack" },
          h("div", { className: "row-actions" },
            h("button", { className: "button button-primary", type: "button", dataset: { action: "audit-user-funds", userId: profile.id } }, "一键核对")
          ),
          h("label", { className: "field" }, "资金手动修改栏",
            h("input", { type: "number", min: "0", step: "1", value: profile.funds, dataset: { action: "manual-funds-input", userId: profile.id } })
          ),
          h("button", { className: "button button-ghost", type: "button", dataset: { action: "manual-funds-save", userId: profile.id } }, "保存资金修改")
        );
      }
      return h("div", { className: "admin-stack" },
        h("p", { text: profile.deleted ? "该账户已注销。" : isBanned(profile) ? `当前封禁至 ${formatFullDate(profile.bannedUntil)}。` : "账户当前未封禁。" }),
        h("div", { className: "row-actions" },
          profile.deleted ? null : isBanned(profile)
            ? h("button", { className: "button button-primary", type: "button", dataset: { action: "unban-user", userId: profile.id } }, "解封")
            : h("button", { className: "button button-ghost", type: "button", dataset: { action: "ban-user", userId: profile.id } }, "封禁"),
          profile.deleted ? null : h("button", { className: "button button-danger", type: "button", dataset: { action: "delete-user", userId: profile.id } }, "注销")
        )
      );
    },
    simpleTable(headers, rows) {
      const cell = (item) => item && item.nodeType
        ? h("span", {}, item)
        : h("span", { text: item });
      return h("div", { className: "admin-table simple-table" },
        h("div", { className: "admin-table-head", style: `grid-template-columns: repeat(${headers.length}, minmax(140px, 1fr));` }, headers.map((item) => h("span", { text: item }))),
        rows.length ? rows.map((row) => h("div", { className: "admin-table-row", style: `grid-template-columns: repeat(${headers.length}, minmax(140px, 1fr));` }, row.map(cell))) : h("div", { className: "admin-empty-row", text: "暂无记录。" })
      );
    },
    adminRecords() {
        const consume = Data.orders().map((order) => ({
        id: order.id,
        type: "consume",
        name: localizedOrderContent(order, "productTitle"),
        amount: order.price,
        user: order.customerUsername,
        status: StatusLabels[order.status] || order.status,
        createdAt: order.createdAt,
        completedAt: order.completedAt || "",
        detail: `${localizeStaticPhrase("游戏")}：${localizedOrderContent(order, "gameTitle")} / ${localizeStaticPhrase("联系方式")}：${order.contact || localizeStaticPhrase("未填写")} / ${localizeStaticPhrase("预约")}：${order.appointmentAt ? formatFullDate(order.appointmentAt) : localizeStaticPhrase("无")} / ${localizeStaticPhrase("自动退单")}：${order.autoCancelAt ? formatFullDate(order.autoCancelAt) : localizeStaticPhrase("未设置")} / ${localizeStaticPhrase("加急")}：${rushStatusLabel(order.rush) || localizeStaticPhrase("无")} / ${localizeStaticPhrase("举报")}：${(order.reports || []).length} / ${localizeStaticPhrase("退款")}：${order.refundedAt ? formatFullDate(order.refundedAt) : localizeStaticPhrase("无")} / ${localizeStaticPhrase("备注")}：${order.note || localizeStaticPhrase("无")}`
      }));
      const flows = Data.ledger().filter((entry) => ["recharge", "cashout"].includes(entry.type)).map((entry) => ({
        id: entry.id,
        type: entry.type,
        name: entry.itemName || entry.title,
        amount: entry.amountPoints,
        user: entry.username,
        status: "已记录",
        createdAt: entry.createdAt,
        completedAt: entry.createdAt,
        detail: `金额：$${entry.amountMoney || 0} / 操作人：${entry.operator}`
      }));
      return [...consume, ...flows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    adminOrders() {
      const typeLabel = { all: "全部", recharge: "充值单", consume: "消费单", cashout: "兑现单" };
      const query = normalize(State.adminOrderSearch);
      const rows = this.adminRecords().filter((record) => {
        const typeOk = State.adminOrderType === "all" || record.type === State.adminOrderType;
        const queryOk = !query || normalize(record.id).includes(query);
        return typeOk && queryOk;
      });
      return h("section", { className: "panel" },
        h("div", { className: "toolbar" },
          h("label", { className: "field" }, "通过单号查询",
            h("input", { type: "search", value: State.adminOrderSearch, placeholder: "输入单号", dataset: { action: "admin-order-search" } })
          ),
          h("div", { className: "row-actions" },
            h("label", { className: "field" }, "分类检索",
              h("select", { dataset: { action: "admin-order-type" } },
                Object.entries(typeLabel).map(([value, label]) => h("option", { value, selected: value === State.adminOrderType }, label))
              )
            ),
            h("button", { className: "button button-primary", type: "button", dataset: { action: "admin-search-refresh" } }, "查询")
          )
        ),
        this.simpleTable(["单号", "类型", "名称", "用户", "金额/积分", "状态", "创建时间", "结单时间", "全部要素"], rows.map((record) => [
          record.id,
          typeLabel[record.type],
          record.name,
          record.user,
          financialText(record.amount),
          protectedText(localizeStaticPhrase(record.status), "status-value"),
          formatFullDate(record.createdAt),
          record.completedAt ? formatFullDate(record.completedAt) : protectedText(localizeStaticPhrase("未结单"), "status-value"),
          protectedText(record.detail, "order-locked-term")
        ]))
      );
    },
    adminLedger() {
      const ledger = Data.ledger();
      const recharge = ledger.filter((entry) => entry.type === "recharge").reduce((sum, entry) => sum + Number(entry.amountPoints || 0), 0);
      const consume = ledger.filter((entry) => entry.type === "consume").reduce((sum, entry) => sum + Math.abs(Number(entry.amountPoints || 0)), 0);
      const refund = ledger.filter((entry) => entry.type === "refund").reduce((sum, entry) => sum + Number(entry.amountPoints || 0), 0);
      const cashout = ledger.filter((entry) => entry.type === "cashout").reduce((sum, entry) => sum + Math.abs(Number(entry.amountPoints || 0)), 0);
      const balance = Data.profiles().reduce((sum, profile) => sum + Number(profile.funds || 0), 0);
      return h("section", { className: "panel" },
        h("div", { className: "metric-strip ledger-strip" },
          h("div", { className: "metric" }, icon("fa-solid fa-arrow-trend-up"), h("strong", { text: recharge }), h("span", { text: "充值积分" })),
          h("div", { className: "metric" }, icon("fa-solid fa-cart-shopping"), h("strong", { text: consume }), h("span", { text: "消费积分" })),
          h("div", { className: "metric" }, icon("fa-solid fa-rotate-left"), h("strong", { text: refund }), h("span", { text: "退款积分" })),
          h("div", { className: "metric" }, icon("fa-solid fa-money-bill-transfer"), h("strong", { text: cashout }), h("span", { text: "兑现积分" })),
          h("div", { className: "metric" }, icon("fa-solid fa-scale-balanced"), h("strong", { text: balance }), h("span", { text: "账户总资金" }))
        ),
        this.simpleTable(["流水号", "类型", "用户", "变动积分", "变动前", "变动后", "关联单号", "操作人", "时间"], ledger.map((entry) => [
          entry.id,
          entry.type,
          entry.username,
          protectedText(entry.amountPoints, "financial-value"),
          protectedText(entry.before, "financial-value"),
          protectedText(entry.after, "financial-value"),
          entry.orderId || "-",
          entry.operator,
          formatFullDate(entry.createdAt)
        ]))
      );
    },
    adminLogs() {
      const settings = Data.systemSettings();
      const history = settings.backupHistory || [];
      return h("section", { className: "panel" },
        h("div", { className: "backup-settings" },
          h("div", {},
            h("strong", { text: "归档备份邮箱" }),
            h("span", { className: "notranslate", translate: "no", text: settings.backupEmail || "未设置" }),
            history[0] ? h("small", { text: `最近备份：${history[0].periodStart} 至 ${history[0].periodEnd} · ${history[0].count} 条` }) : null
          ),
          h("button", { className: "button button-ghost", type: "button", dataset: { action: "set-backup-email" } }, icon("fa-regular fa-envelope"), "指定备份邮箱")
        ),
        h("div", { className: "row-actions" },
          h("button", { className: "button button-ghost", type: "button", dataset: { action: "run-retention-cleanup" } }, icon("fa-solid fa-box-archive"), "立即归档检查"),
          h("button", { className: "button button-danger", type: "button", dataset: { action: "clear-admin-logs" } }, icon("fa-solid fa-trash"), "一键清空日志")
        ),
        this.simpleTable(["日志号", "操作人", "操作", "详情", "时间"], Data.adminLogs().map((log) => [
          log.id,
          log.actor,
          log.action,
          log.detail,
          formatFullDate(log.createdAt)
        ]))
      );
    },
    info(page) {
      if (LegalInfoPages.includes(page)) {
        const content = LegalInfoContent[page] || LegalInfoContent.terms;
        return h("section", {
          className: "panel policy-document official-terms notranslate",
          translate: "no",
          dataset: { noMachineTranslate: "true" }
        },
          h("p", { className: "policy-control-note", text: ControllingLanguageNotice }),
          h("h2", { text: content.title }),
          h("p", { className: "policy-intro", text: content.intro }),
          h("div", { className: "policy-sections" },
            content.sections.map(([heading, body]) => h("section", { className: "policy-section" },
              h("h3", { text: heading }),
              h("p", { text: body })
            ))
          )
        );
      }
      const map = {
        about: ["关于 IMPULSE J", `${BrandName} is driven by gamers' momentum and focuses on a cleaner game-service commerce experience.`],
        help: ["帮助中心", "普通 Gamer 可浏览、注册、下单和预约；Vector 账号可处理订单；管理员账号可维护内容与数据。"]
      };
      const [title, body] = map[page] || map.about;
      return h("section", { className: "panel" }, h("h2", { text: title }), h("p", { text: body }));
    }
  };

  const Auth = {
    open(initialMode = "login") {
      let mode = initialMode;
      let loginMethod = "password";
      const render = () => {
        const isLogin = mode === "login";
        const isEmailCodeLogin = isLogin && loginMethod === "email";
        const message = h("p", { className: "form-message" });
        const codeHint = h("p", { className: "auth-code-hint" });
        const emailInput = h("input", { name: "email", type: "email", autocomplete: "email", placeholder: "name@example.com", required: true });
        const identityInput = h("input", { name: "identity", type: "text", autocomplete: "username", placeholder: "用户名或邮箱", required: true });
        const codeInput = h("input", { name: "code", type: "text", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6", pattern: "[0-9]{6}", placeholder: "6 位验证码", required: true });
        const sendCodeButton = h("button", { className: "button button-ghost button-small", type: "button" }, icon("fa-regular fa-envelope"), "发送验证码");
        let registerAvatarImage = "";
        let registerAvatarName = "";
        const registerAvatarPreview = h("div", { className: "avatar-upload-preview avatar-upload-preview-small" },
          h("span", { className: "notranslate", translate: "no", text: "IMP" })
        );
        const registerAvatarInput = h("input", { name: "avatarFile", type: "file", accept: "image/*" });

        const sendCode = async () => {
          const email = normalizeEmail(emailInput.value);
          if (!isEmail(email)) {
            message.textContent = "请输入有效邮箱。";
            return;
          }
          const purpose = isLogin ? "login" : "register";
          message.textContent = "";
          codeHint.textContent = localizeStaticPhrase("正在发送验证码...");
          sendCodeButton.disabled = true;
          const backendResult = await Backend.sendVerification(purpose, email);
          sendCodeButton.disabled = false;
          if (backendResult.ok) {
            if (backendResult.devCode) {
              codeHint.textContent = contentLanguage() === "zh-CN"
                ? `演示验证码：${backendResult.devCode}，5 分钟内有效。后端邮件服务未配置。`
                : `Demo code: ${backendResult.devCode}. Valid for 5 minutes. Backend email is not configured.`;
              UI.toast("验证码已发送", `演示验证码：${backendResult.devCode}`);
              return;
            }
            codeHint.textContent = localizeStaticPhrase("验证码已发送，请查看邮箱。");
            UI.toast("验证码已发送", "验证码已发送，请查看邮箱。");
            return;
          }
          if (!backendResult.offline) {
            message.textContent = backendResult.message || "验证码发送失败。";
            return;
          }
          if (isLogin && !Data.findUserByEmail(email)) {
            message.textContent = "该邮箱未注册。";
            return;
          }
          if (!isLogin && Data.findUserByEmail(email)) {
            message.textContent = "邮箱已被注册。";
            return;
          }
          const code = Verification.generate(purpose, email);
          const result = await Mail.sendVerificationCode(email, code);
          Data.log("English email", `To: ${email} / Subject: Your IMPULSE J verification code / Body: Your verification code is ${code}.`);
          if (result.ok) {
            codeHint.textContent = localizeStaticPhrase("验证码已发送，请查看邮箱。");
            UI.toast("验证码已发送", "验证码已发送，请查看邮箱。");
            return;
          }
          codeHint.textContent = contentLanguage() === "zh-CN"
            ? `演示验证码：${code}，5 分钟内有效。邮件接口未配置或暂不可用。`
            : `Demo code: ${code}. Valid for 5 minutes. Email endpoint is not configured or is temporarily unavailable.`;
          UI.toast("验证码已发送", `演示验证码：${code}`);
        };

        sendCodeButton.addEventListener("click", sendCode);
        registerAvatarInput.addEventListener("change", () => {
          const file = registerAvatarInput.files?.[0];
          if (!file) {
            return;
          }
          cropAvatarFile(file).then((result) => {
            registerAvatarImage = result.image;
            registerAvatarName = result.name;
            message.textContent = "";
            clear(registerAvatarPreview);
            registerAvatarPreview.appendChild(h("img", { src: registerAvatarImage, alt: "头像预览" }));
          }).catch((error) => {
            message.textContent = error.message;
            registerAvatarInput.value = "";
          });
        });

        const introTitle = isLogin
          ? (isEmailCodeLogin ? "邮箱验证码登录" : "账户密码登录")
          : "创建安全账户";
        const introText = isLogin
          ? (isEmailCodeLogin ? "使用邮箱和 6 位验证码登录。" : "使用用户名或邮箱和密码登录。")
          : "需要邮箱验证码完成身份确认。";
        const methodTabs = isLogin ? h("div", { className: "auth-methods", role: "tablist", ariaLabel: "登录方式" },
          h("button", {
            className: `auth-method ${loginMethod === "password" ? "active" : ""}`,
            type: "button",
            onClick: () => { loginMethod = "password"; render(); }
          }, icon("fa-solid fa-key"), h("span", { text: "账户密码登录" })),
          h("button", {
            className: `auth-method ${loginMethod === "email" ? "active" : ""}`,
            type: "button",
            onClick: () => { loginMethod = "email"; render(); }
          }, icon("fa-regular fa-envelope"), h("span", { text: "邮箱验证码登录" }))
        ) : null;
        const verificationField = h("label", { className: "field" }, "邮箱验证码",
          h("div", { className: "verify-row" }, codeInput, sendCodeButton)
        );
        const authFields = isLogin
          ? (isEmailCodeLogin
            ? [
                h("label", { className: "field" }, "邮箱", emailInput),
                verificationField,
                codeHint
              ]
            : [
                h("label", { className: "field" }, "账号或邮箱", identityInput),
                h("label", { className: "field" }, "密码", h("input", { name: "password", type: "password", autocomplete: "current-password", required: true }))
              ])
          : [
              h("label", { className: "field" }, "邮箱", emailInput),
              h("label", { className: "field" }, "用户名", h("input", { name: "username", type: "text", autocomplete: "username", required: true })),
              h("label", { className: "field" }, "国家或地区 *", h("input", { name: "countryRegion", type: "text", autocomplete: "country-name", required: true, placeholder: "中国 / United States" })),
              h("label", { className: "field" }, "生日 *", h("input", { name: "birthday", type: "date", required: true })),
              h("label", { className: "field" }, "性别", h("select", { name: "gender" },
                GenderOptions.map((option) => h("option", { value: option.value }, option.label))
              )),
              h("label", { className: "field" }, "头像",
                registerAvatarPreview,
                registerAvatarInput,
                h("small", { text: "可选。上传不大于 5MB 的图像，系统会在圆框内居中截取。" })
              ),
              h("label", { className: "field" }, "密码", h("input", { name: "password", type: "password", autocomplete: "new-password", required: true })),
              h("label", { className: "field" }, "确认密码", h("input", { name: "confirmPassword", type: "password", autocomplete: "new-password", required: true })),
              verificationField,
              codeHint
            ];

        const form = h("form", { className: "form-stack auth-form" },
          h("div", { className: "auth-intro" },
            h("div", { className: "auth-mark" }, icon("fa-solid fa-shield-halved")),
            h("div", {},
              h("strong", { text: introTitle }),
              h("span", { text: introText })
            )
          ),
          methodTabs,
          authFields,
          message,
          h("button", { className: "button button-primary button-full", type: "submit" }, isLogin ? "登录" : "注册并登录")
        );

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(form).entries());
          const submitButton = form.querySelector("button[type='submit']");
          const loader = UI.beginInteractionLoading(submitButton);
          if (submitButton) {
            submitButton.disabled = true;
          }
          let result;
          try {
            result = await (isLogin
              ? (isEmailCodeLogin
                  ? Session.loginByEmailCode(values.email, values.code)
                  : Session.loginByPassword(values.identity, values.password))
              : Session.register(values.username, values.email, values.password, values.confirmPassword, values.code, {
                  countryRegion: values.countryRegion,
                  birthday: values.birthday,
                  gender: values.gender,
                  avatarImage: registerAvatarImage,
                  avatarImageName: registerAvatarName
                }));
          } finally {
            if (submitButton) {
              submitButton.disabled = false;
            }
            loader?.done();
          }
          if (!result.ok) {
            message.textContent = result.message;
            return;
          }
          UI.closeModal();
          UI.toast("欢迎回来", State.currentUser.username);
          App.render();
        });

        const card = h("div", { className: "modal-card auth-card slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: isLogin ? "登录 IMPULSE J" : "注册 IMPULSE J" }),
          h("p", { className: "auth-subtitle", text: isLogin ? "可以使用账户密码登录，也可以切换为邮箱验证码登录。" : "注册时填写账户资料；带 * 的项目为必填，注册后不可修改。" }),
          h("div", { className: "tabs" },
            h("button", { className: `tab ${isLogin ? "active" : ""}`, type: "button", onClick: () => { mode = "login"; render(); } }, "登录"),
            h("button", { className: `tab ${!isLogin ? "active" : ""}`, type: "button", onClick: () => { mode = "register"; render(); } }, "注册")
          ),
          form
        );
        UI.openModal(card);
      };
      render();
    }
  };

  const Actions = {
    openProductDetail(productId) {
      const found = Data.findProduct(productId);
      if (!found) {
        UI.toast("商品不存在");
        return;
      }
      const { product, game, category } = found;
      const displayImage = product.imageData || game.imageData || "";
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("div", { className: `product-art ${displayImage ? "has-image" : ""}` },
            displayImage
              ? h("img", { src: displayImage, alt: localizedContent(product, "title") || "展示图片" })
              : icon(product.icon || category.icon || "fa-solid fa-gamepad")
          ),
          h("h2", { text: localizedContent(product, "title") }),
          h("p", { text: localizedContent(product, "description", "暂无详细描述。") || "暂无详细描述。" }),
          h("div", { className: "tag-row" },
            h("span", { className: "tag", text: localizedContent(category, "title") }),
            h("span", { className: "tag", text: localizedContent(game, "title") }),
            localizedContent(product, "duration") ? h("span", { className: "tag", text: localizedContent(product, "duration") }) : null
          ),
          h("strong", { className: "detail-price financial-value notranslate", translate: "no", text: formatPrice(product.price) }),
          h("div", { className: "modal-actions" },
            h("button", { className: "button button-primary", type: "button", onClick: () => this.checkout("order", found) }, icon("fa-solid fa-bolt"), "立即下单"),
            h("button", { className: "button button-ghost", type: "button", onClick: () => this.checkout("reservation", found) }, icon("fa-regular fa-calendar-check"), "预约")
          )
        )
      );
    },
    checkout(type, { product, game, category }) {
      if (!State.currentUser) {
        Auth.open("login");
        UI.toast("请先登录", "登录后即可提交订单或预约。");
        return;
      }
      const profile = Data.profileByUsername(State.currentUser.username);
      const price = Math.max(0, Number(product.price) || 0);
      if (!profile || profile.deleted || isBanned(profile)) {
        UI.toast("账户不可用", "当前账户暂时不能提交订单。");
        return;
      }
      if ((Number(profile.funds) || 0) < price) {
        const shortage = formatPrice(price - Number(profile.funds || 0));
        UI.toast("余额不足", contentLanguage() === "zh-CN" ? `还需 ${shortage}，请先充值。` : `Need ${shortage} more. Please recharge first.`);
        this.openRecharge(profile, price - Number(profile.funds || 0));
        return;
      }
      const fields = [
        type === "reservation" ? { name: "appointmentAt", label: "预约时间", type: "datetime-local", required: true } : null,
        { name: "autoCancelMinutes", label: "无人接单自动退单时间（分钟）", type: "number", value: "60", min: "1", step: "1", required: true },
        { name: "note", label: "备注", type: "textarea", placeholder: "角色信息、段位、期望目标或其他要求" }
      ].filter(Boolean);

      UI.openFormModal({
        title: type === "reservation" ? "预约服务" : "提交订单",
        submitLabel: type === "reservation" ? "提交预约" : "提交订单",
        fields,
        onSubmit: async (values) => {
          const minutes = Math.ceil(Number(values.autoCancelMinutes));
          if (!Number.isFinite(minutes) || minutes < 1) {
            return { error: "自动退单时间至少为 1 分钟。" };
          }
          const latestProfile = Data.profileByUsername(State.currentUser.username);
          if (!latestProfile || (Number(latestProfile.funds) || 0) < price) {
            window.setTimeout(() => this.openRecharge(latestProfile, price - Number(latestProfile?.funds || 0)), 0);
            return { error: "余额不足，请先充值。" };
          }
          const autoCancelMinutes = Math.min(minutes, 10080);
          const orderPayload = {
            type,
            categoryId: category.id,
            categoryTitle: localizedContent(category, "title"),
            categoryTitleI18n: contentValues(category, "title"),
            gameId: game.id,
            gameTitle: localizedContent(game, "title"),
            gameTitleI18n: contentValues(game, "title"),
            productId: product.id,
            productTitle: localizedContent(product, "title"),
            productTitleI18n: contentValues(product, "title"),
            price,
            customerUsername: State.currentUser.username,
            contact: "",
            appointmentAt: values.appointmentAt || "",
            note: values.note || "",
            autoCancelMinutes,
            autoCancelAt: new Date(Date.now() + autoCancelMinutes * 60000).toISOString()
          };
          let result = await Backend.createOrder(orderPayload);
          if (result.offline) {
            result = Data.createOrder(orderPayload);
          }
          if (!result.ok) {
            if (result.reason === "insufficient") {
              window.setTimeout(() => this.openRecharge(latestProfile, price - Number(result.balance || 0)), 0);
              return { error: result.message || "余额不足，请先充值。" };
            }
            return { error: result.message || "订单创建失败，请稍后重试。" };
          }
          UI.toast("提交成功", type === "reservation" ? "预约已进入待处理。" : "订单已进入待处理。");
          Router.go("account");
          return null;
        },
        wide: true
      });
    },
    openRecharge(profile = null, needed = 0) {
      const currentProfile = profile || (State.currentUser ? Data.profileByUsername(State.currentUser.username) : null);
      if (!currentProfile) {
        UI.toast("请先登录", "登录后才可以充值积分。");
        Auth.open("login");
        return;
      }
      const balance = Number(currentProfile.funds || 0);
      const exchangeText = contentLanguage() === "zh-CN" ? `1 美元 = ${PointsPerDollar} 积分。` : `1 USD = ${PointsPerDollar} ${PointsPerDollar === 1 ? "pt" : "pts"}.`;
      UI.openModal(
        h("div", { className: "modal-card slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: needed > 0 ? "余额不足" : "充值积分" }),
          h("p", {}, localizeStaticPhrase("当前余额："), formatPrice(balance), "。", exchangeText),
          needed > 0 ? h("p", { className: "balance-note" }, localizeStaticPhrase("本次还需"), " ", formatPrice(Math.max(0, Number(needed) || 0)), "。") : null,
          h("div", { className: "recharge-grid" },
            RechargeOptions.map((amount) => h("button", {
              className: "recharge-option",
              type: "button",
              onClick: async () => {
                const latest = Data.profileById(currentProfile.id);
                if (!latest) {
                  UI.toast("充值失败", "未找到当前账户。");
                  return;
                }
                const points = amount * PointsPerDollar;
                const payloadMeta = {
                  type: "recharge",
                  amountMoney: amount,
                  itemName: `${amount}$ 充值`
                };
                let result = await Backend.adjustFunds(latest.id, points, "用户充值", payloadMeta);
                if (result.offline) {
                  result = Data.adjustFunds(latest.id, points, "用户充值", payloadMeta);
                }
                if (!result.ok) {
                  UI.toast("充值失败", "请稍后重试。");
                  return;
                }
                UI.closeModal();
                UI.toast("充值成功", contentLanguage() === "zh-CN" ? `已增加 ${formatPrice(points)}。` : `${formatPrice(points)} added.`);
                App.render();
              }
            },
              h("strong", { text: `${amount}$` }),
              h("span", { text: formatPrice(amount * PointsPerDollar) })
            ))
          )
        )
      );
    },
    async accountPasswordOk(password) {
      const user = State.currentUser ? Data.findUser(State.currentUser.username) : null;
      if (user?.password && user.password === password) {
        return true;
      }
      const result = await Backend.request("verifyPassword", { password });
      if (result.ok) {
        return true;
      }
      return false;
    },
    openUserSettings() {
      if (!State.currentUser) {
        Auth.open("login");
        return;
      }
      const settings = [
        { label: "用户信息", icon: "fa-solid fa-id-card", action: () => this.openUserInfoSettings() },
        { label: "账户安全", icon: "fa-solid fa-shield-halved", action: () => this.openAccountSecuritySettings() },
        { label: "联系设置", icon: "fa-solid fa-envelope-open-text", action: () => this.openContactSettings() },
        { label: "成为 Vector", icon: "fa-solid fa-briefcase", action: () => this.openEmploymentSettings() },
        { label: "退出登录", icon: "fa-solid fa-right-from-bracket", destructive: true, action: () => UI.openConfirm("确认退出登录？", "退出后将回到 Gamer 模式。", () => Session.logout()) }
      ];
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "设置" }),
          h("p", { text: "管理账户资料、安全验证、通知邮箱与 Vector 申请。" }),
          h("div", { className: "settings-action-grid" },
            settings.map((item) => h("button", {
              className: `settings-action ${item.destructive ? "destructive" : ""}`,
              type: "button",
              onClick: item.action
            }, icon(item.icon), h("span", { text: item.label })))
          )
        )
      );
    },
    openUserInfoSettings() {
      const profile = Data.currentProfile();
      const user = State.currentUser ? Data.findUser(State.currentUser.username) : null;
      if (!profile || !user) {
        UI.toast("账户不可用", "未找到当前用户资料。");
        return;
      }
      const row = ({ label, value, valueNode, actionLabel = "修改", onClick, destructive = false }) => h("div", { className: "settings-row" },
        h("div", {},
          h("span", { text: `${label}：` }),
          valueNode || h("strong", {
            className: ["用户ID", "用户名", "国家或地区", "生日"].includes(label) ? `${label === "用户ID" ? "mono " : ""}notranslate` : "",
            translate: ["用户ID", "用户名", "国家或地区", "生日"].includes(label) ? "no" : null,
            text: ["用户ID", "用户名", "国家或地区", "生日"].includes(label) ? (value || "未设置") : localizeStaticPhrase(value || "未设置")
          })
        ),
        onClick
          ? h("button", { className: `button ${destructive ? "button-danger" : "button-ghost"} button-small`, type: "button", onClick }, actionLabel)
          : null
      );

      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("div", { className: "profile-summary" },
            profileAvatarNode(profile, profile.username),
            h("div", {},
              h("h2", { className: "notranslate", translate: "no", text: profile.username }),
              h("p", {}, localizeStaticPhrase("用户等级"), "：Lv", clampUserLevel(profile.level), " / ", localizeStaticPhrase("余额"), "：", formatPrice(profile.funds))
            )
          ),
          h("div", { className: "settings-list" },
            row({ label: "用户ID", value: profile.id }),
            row({ label: "用户名", value: profile.username, onClick: () => this.openEditUsername(profile) }),
            row({ label: "头像", valueNode: profileAvatarNode(profile, profile.username, "profile-avatar profile-avatar-small"), onClick: () => this.openEditAvatar(profile) }),
            row({ label: "用户等级", value: `Lv${clampUserLevel(profile.level)}` }),
            row({ label: "剩余资金", value: formatPrice(profile.funds) }),
            row({ label: "国家或地区", value: profile.countryRegion || "未设置" }),
            row({ label: "生日", value: profile.birthday || "未设置" }),
            row({ label: "性别", value: genderLabel(profile.gender), onClick: () => this.openEditGender(profile) }),
            row({ label: "注销账户", value: "注销后该账户将无法继续登录。", actionLabel: "注销", destructive: true, onClick: () => this.openDeleteAccountFlow() })
          )
        )
      );
    },
    openEditUsername(profile) {
      UI.openFormModal({
        title: "修改用户名",
        fields: [{ name: "username", label: "用户名", value: profile.username, required: true }],
        submitLabel: "保存",
        onSubmit: (values) => {
          const result = Data.renameUser(profile.username, values.username);
          if (!result.ok) {
            return { error: result.message };
          }
          UI.toast("用户名已更新", values.username.trim());
          window.setTimeout(() => {
            App.render();
            this.openUserInfoSettings();
          }, 0);
          return null;
        }
      });
    },
    openEditAvatar(profile) {
      let selectedImage = profile.avatarImage || "";
      let selectedName = profile.avatarImageName || "";
      const message = h("p", { className: "form-message" });
      const preview = h("div", { className: "avatar-upload-preview" },
        selectedImage
          ? h("img", { src: selectedImage, alt: "头像预览" })
          : h("span", { className: "notranslate", translate: "no", text: profileAvatarText(profile, profile.username) })
      );
      const fileInput = h("input", { type: "file", accept: "image/*" });
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) {
          return;
        }
        if (!file.type.startsWith("image/")) {
          message.textContent = "请选择图像文件。";
          fileInput.value = "";
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          message.textContent = "头像图片不能大于 5MB。";
          fileInput.value = "";
          return;
        }
        cropAvatarFile(file).then((result) => {
          selectedImage = result.image;
          selectedName = result.name;
          message.textContent = "";
          clear(preview);
          preview.appendChild(h("img", { src: selectedImage, alt: "头像预览" }));
        }).catch((error) => {
          message.textContent = error.message;
          fileInput.value = "";
        });
      });
      UI.openModal(
        h("div", { className: "modal-card slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "修改头像" }),
          h("p", { text: "上传一张不大于 5MB 的图像，系统会在圆框内居中截取显示。" }),
          preview,
          h("label", { className: "field" }, "上传图像", fileInput),
          message,
          h("div", { className: "modal-actions" },
            h("button", { className: "button button-ghost", type: "button", dataset: { action: "close-modal" } }, "取消"),
            profile.avatarImage ? h("button", {
              className: "button button-ghost",
              type: "button",
              onClick: () => {
                Data.saveProfile({ ...profile, avatarImage: "", avatarImageName: "" });
                UI.closeModal();
                UI.toast("头像已移除");
                App.render();
                window.setTimeout(() => this.openUserInfoSettings(), 0);
              }
            }, "移除头像") : null,
            h("button", {
              className: "button button-primary",
              type: "button",
              onClick: () => {
                if (!selectedImage) {
                  message.textContent = "请先选择一张图像。";
                  return;
                }
                try {
                  Data.saveProfile({ ...profile, avatar: "", avatarImage: selectedImage, avatarImageName: selectedName });
                } catch (error) {
                  message.textContent = "头像保存失败，请换用更小的图片。";
                  return;
                }
                UI.closeModal();
                UI.toast("头像已更新");
                App.render();
                window.setTimeout(() => this.openUserInfoSettings(), 0);
              }
            }, "保存")
          )
        )
      );
    },
    openEditGender(profile) {
      UI.openFormModal({
        title: "修改性别",
        fields: [{ name: "gender", label: "性别", type: "select", value: profile.gender || "unset", options: GenderOptions }],
        submitLabel: "保存",
        onSubmit: (values) => {
          Data.saveProfile({ ...profile, gender: values.gender || "unset" });
          UI.toast("性别已更新");
          window.setTimeout(() => this.openUserInfoSettings(), 0);
          return null;
        }
      });
    },
    async verifyCurrentUserSecret(password, code) {
      const user = State.currentUser ? Data.findUser(State.currentUser.username) : null;
      const email = userEmail(user);
      if (password && await this.accountPasswordOk(password)) {
        return { ok: true };
      }
      if (code) {
        return Verification.verify("account", email, code);
      }
      return { ok: false, message: "请输入账户密码，或使用邮箱验证码完成验证。" };
    },
    openAccountVerification({ title, body, onVerified }) {
      const user = State.currentUser ? Data.findUser(State.currentUser.username) : null;
      const email = userEmail(user);
      const message = h("p", { className: "form-message" });
      const codeHint = h("p", { className: "auth-code-hint" });
      const passwordInput = h("input", { name: "password", type: "password", autocomplete: "current-password", placeholder: "账户密码" });
      const codeInput = h("input", { name: "code", type: "text", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6", pattern: "[0-9]{6}", placeholder: "6 位验证码" });
      const sendCodeButton = h("button", {
        className: "button button-ghost button-small",
        type: "button",
        onClick: async () => {
          if (!isEmail(email)) {
            message.textContent = "当前账户没有可用邮箱。";
            return;
          }
          const code = Verification.generate("account", email);
          message.textContent = "";
          codeHint.textContent = localizeStaticPhrase("正在发送验证码...");
          sendCodeButton.disabled = true;
          const result = await Mail.sendVerificationCode(email, code);
          Data.log("English email", `To: ${email} / Subject: Your IMPULSE J verification code / Body: Your verification code is ${code}.`);
          sendCodeButton.disabled = false;
          if (result.ok) {
            codeHint.textContent = localizeStaticPhrase("验证码已发送，请查看邮箱。");
            UI.toast("验证码已发送", "验证码已发送，请查看邮箱。");
            return;
          }
          codeHint.textContent = contentLanguage() === "zh-CN"
            ? `演示验证码：${code}，发送至原绑定邮箱 ${email}，5 分钟内有效。邮件接口未配置或暂不可用。`
            : `Demo code: ${code}. Sent to ${email}. Valid for 5 minutes. Email endpoint is not configured or is temporarily unavailable.`;
          UI.toast("验证码已发送", `演示验证码：${code}`);
        }
      }, icon("fa-regular fa-envelope"), "发送验证码");
      const form = h("form", { className: "form-stack" },
        body ? h("p", { text: body }) : null,
        h("label", { className: "field" }, "账户密码", passwordInput),
        h("label", { className: "field" }, "邮箱验证码",
          h("div", { className: "verify-row" }, codeInput, sendCodeButton)
        ),
        codeHint,
        message,
        h("div", { className: "modal-actions" },
          h("button", { className: "button button-ghost", type: "button", dataset: { action: "close-modal" } }, "取消"),
          h("button", { className: "button button-primary", type: "submit" }, "确认")
        )
      );
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(form).entries());
        const submitButton = form.querySelector("button[type='submit']");
        const loader = UI.beginInteractionLoading(submitButton);
        const result = await this.verifyCurrentUserSecret(values.password, values.code).finally(() => loader?.done());
        if (!result.ok) {
          message.textContent = result.message || "验证失败。";
          return;
        }
        UI.closeModal();
        onVerified();
      });
      UI.openModal(
        h("div", { className: "modal-card slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: title }),
          form
        )
      );
    },
    openDeleteAccountFlow() {
      this.openAccountVerification({
        title: "注销账户验证",
        body: "注销账户需要账户密码或原绑定邮箱验证码。",
        onVerified: () => {
          UI.openConfirm("确认注销账户？", "注销后账户将无法登录，当前会话会立即退出。", () => {
            const profile = Data.currentProfile();
            if (!profile) {
              return;
            }
            Data.saveProfile({ ...profile, deleted: true, deletedAt: new Date().toISOString() });
            Data.log("用户自助注销", profile.username);
            UI.toast("账户已注销");
            Session.logout();
          });
        }
      });
    },
    openAccountSecuritySettings() {
      const user = State.currentUser ? Data.findUser(State.currentUser.username) : null;
      const email = userEmail(user);
      UI.openModal(
        h("div", { className: "modal-card slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "账户安全" }),
          h("div", { className: "settings-list" },
            h("div", { className: "settings-row" },
              h("div", {}, h("span", { text: "密码" }), h("strong", { text: "已设置" })),
              h("button", { className: "button button-ghost button-small", type: "button", onClick: () => this.openPasswordChangeFlow() }, "修改密码")
            ),
            h("div", { className: "settings-row" },
              h("div", {}, h("span", { text: "绑定邮箱" }), h("strong", { className: "notranslate", translate: "no", text: email || "未绑定" })),
              h("button", { className: "button button-ghost button-small", type: "button", onClick: () => this.openEmailBindingSettings() }, "查看")
            )
          )
        )
      );
    },
    openPasswordChangeFlow() {
      this.openAccountVerification({
        title: "修改密码验证",
        body: "修改密码需要账户密码，或发送到原绑定邮箱的 6 位验证码。",
        onVerified: () => {
          UI.openFormModal({
            title: "修改密码",
            fields: [
              { name: "password", label: "新密码", type: "password", required: true },
              { name: "confirmPassword", label: "确认新密码", type: "password", required: true }
            ],
            submitLabel: "保存",
            onSubmit: async (values) => {
              if (values.password !== values.confirmPassword) {
                return { error: "两次输入的密码不一致。" };
              }
              let result = await Backend.updatePassword(values.password);
              if (result.offline) {
                result = Data.updateCurrentUserPassword(values.password);
              }
              if (!result.ok) {
                return { error: result.message };
              }
              UI.toast("密码已修改");
              Data.log("修改密码", State.currentUser.username);
              return null;
            }
          });
        }
      });
    },
    openEmailBindingSettings() {
      const user = State.currentUser ? Data.findUser(State.currentUser.username) : null;
      const email = userEmail(user);
      UI.openModal(
        h("div", { className: "modal-card slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "绑定邮箱" }),
          h("p", {}, "当前绑定邮箱：", h("span", { className: "notranslate", translate: "no", text: email || "未绑定" })),
          h("button", { className: "button button-primary button-full", type: "button", onClick: () => this.openEmailChangeFlow(email) }, icon("fa-solid fa-envelope-circle-check"), "修改绑定邮箱")
        )
      );
    },
    openEmailChangeFlow(previousEmail) {
      this.openAccountVerification({
        title: "修改绑定邮箱验证",
        body: "修改绑定邮箱需要账户密码，或发送到原绑定邮箱的 6 位验证码。",
        onVerified: () => {
          UI.openFormModal({
            title: "修改绑定邮箱",
            fields: [{ name: "email", label: "新邮箱", type: "email", placeholder: "name@example.com", required: true }],
            submitLabel: "保存",
            onSubmit: async (values) => {
              let result = await Backend.updateEmail(values.email);
              if (result.offline) {
                result = Data.updateCurrentUserEmail(values.email);
              }
              if (!result.ok) {
                return { error: result.message };
              }
              UI.toast("绑定邮箱已修改", "已向原邮箱和新邮箱发送英文通知。");
              window.setTimeout(() => this.openEmailBindingSettings(), 0);
              return null;
            }
          });
        }
      });
    },
    openContactSettings() {
      const profile = Data.currentProfile();
      const user = State.currentUser ? Data.findUser(State.currentUser.username) : null;
      if (!profile || !user) {
        UI.toast("账户不可用", "未找到当前用户资料。");
        return;
      }
      const emailInput = h("input", { name: "notificationEmail", type: "email", value: profile.notificationEmail || userEmail(user), placeholder: "name@example.com", required: true });
      const message = h("p", { className: "form-message" });
      const form = h("form", { className: "form-stack" },
        h("p", { text: "通知邮箱默认为绑定邮箱，可单独修改。所有邮件通知均以英语发送。" }),
        h("label", { className: "field" }, "通知邮箱", emailInput),
        h("div", { className: "notice-list" },
          EmailNoticeTypes.map((notice) => h("label", { className: "notice-toggle" },
            h("input", { type: "checkbox", name: notice.key, checked: profile.emailNotices?.[notice.key] !== false }),
            h("span", { text: notice.label }),
            h("small", { className: "notranslate", translate: "no", text: notice.subject })
          ))
        ),
        message,
        h("div", { className: "modal-actions" },
          h("button", { className: "button button-ghost", type: "button", dataset: { action: "close-modal" } }, "取消"),
          h("button", { className: "button button-primary", type: "submit" }, "保存")
        )
      );
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const loader = UI.beginInteractionLoading(form.querySelector("button[type='submit']"));
        const formData = new FormData(form);
        const notificationEmail = normalizeEmail(formData.get("notificationEmail"));
        if (!isEmail(notificationEmail)) {
          message.textContent = "请输入有效通知邮箱。";
          loader?.done();
          return;
        }
        const emailNotices = Object.fromEntries(EmailNoticeTypes.map((notice) => [notice.key, formData.has(notice.key)]));
        Data.saveProfile({ ...profile, notificationEmail, emailNotices });
        Data.log("更新联系设置", profile.username);
        UI.closeModal();
        UI.toast("联系设置已保存", "邮件通知语言固定为英语。");
        App.render();
        loader?.doneSoon();
      });
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "联系设置" }),
          form
        )
      );
    },
    openEmploymentSettings() {
      const profile = Data.currentProfile();
      if (!profile) {
        UI.toast("账户不可用", "未找到当前用户资料。");
        return;
      }
      UI.openFormModal({
        title: "成为 Vector",
        fields: [
          { name: "targetRole", label: "申请方向", value: profile.employmentApplication?.targetRole || "陪玩/代打 Vector", required: true },
          { name: "contact", label: "联系邮箱或方式", value: profile.employmentApplication?.contact || profile.notificationEmail || "", required: true },
          { name: "experience", label: "游戏经历与可服务项目", type: "textarea", value: profile.employmentApplication?.experience || "", required: true }
        ],
        submitLabel: "提交 Vector 申请",
        onSubmit: (values) => {
          const application = {
            id: profile.employmentApplication?.id || createId("hire"),
            status: "pending",
            targetRole: values.targetRole.trim(),
            contact: values.contact.trim(),
            experience: values.experience.trim(),
            submittedAt: new Date().toISOString()
          };
          Data.saveProfile({ ...profile, employmentApplication: application });
          Data.log("提交 Vector 申请", `${profile.username} ${application.targetRole}`);
          UI.toast("Vector 申请已提交", "管理员可在日志中查看记录。");
          return null;
        },
        wide: true
      });
    },
    openOrderChat(orderId) {
      Data.processRushBreaches();
      const order = Data.orderById(orderId);
      if (!order || order.type !== "order") {
        UI.toast("订单不存在");
        return;
      }
      if (!order.handledBy || order.status === "pending") {
        UI.toast("尚未有人接单", "Vector 接单后即可打开聊天框。");
        return;
      }
      const isCustomer = State.currentUser?.username === order.customerUsername;
      const isStaff = State.currentUser?.username === order.handledBy;
      const isAdmin = State.currentUser?.role === "admin";
      if (!isCustomer && !isStaff && !isAdmin) {
        UI.toast("无权查看", "只有订单 Gamer、接单 Vector 或管理员可以打开聊天。");
        return;
      }

      const currentUsername = State.currentUser?.username || "";
      Data.markChatRead(order.id, currentUsername);
      const customerProfile = Data.profileByUsername(order.customerUsername);
      const staffProfile = Data.profileByUsername(order.handledBy);
      const counterpartUsername = isCustomer ? order.handledBy : isStaff ? order.customerUsername : "";
      const participantCard = (label, profile) => {
        const online = isProfileOnline(profile);
        return h("div", { className: "chat-participant" },
          h("span", { className: `presence-dot ${online ? "online" : "offline"}` }),
          h("div", {},
            h("strong", {}, protectedText(label, "role-term"), " ", h("span", { className: "notranslate", translate: "no", text: profile?.username || "未分配" })),
            h("small", { text: online ? "在线" : profile?.lastOnlineAt ? `离线 · 最后在线 ${formatDate(profile.lastOnlineAt)}` : "离线" })
          )
        );
      };
      Data.pruneExpiredChats();
      const messages = Data.chatMessages(order.id);
      const activeRush = ["pending", "accepted", "breached", "continue_requested", "continued"].includes(order.rush?.status);
      const makeTool = (label, iconName, enabled, disabledReason, onClick) => h("button", {
        className: `chat-tool ${enabled ? "" : "disabled"}`,
        type: "button",
        onClick: () => {
          if (!enabled) {
            UI.toast(`${label}不可用`, disabledReason);
            return;
          }
          onClick();
        }
      }, icon(iconName), h("span", { text: label }));

      const tools = [];
      if (isCustomer) {
        tools.push(
          makeTool("加急", "fa-solid fa-fire", order.status === "processing" && !activeRush, activeRush ? "该订单已有加急流程。" : "订单进行中才可以加急。", () => this.openRushForm(order.id)),
          makeTool("退单", "fa-solid fa-rotate-left", canReturnOrder(order), "退单仅在接单后 1 小时内可用，加急违约后会恢复。", () => this.openReturnForm(order.id)),
          makeTool("举报", "fa-solid fa-shield-halved", Boolean(order.handledBy), "Vector 接单后才可以举报。", () => this.openReportForm(order.id)),
          makeTool("小费", "fa-solid fa-hand-holding-dollar", !["pending", "cancelled"].includes(order.status), "订单未接单或已取消时不能支付小费。", () => this.openTipForm(order.id))
        );
        if (order.rush?.status === "continue_requested") {
          tools.push(
            makeTool("同意继续", "fa-solid fa-circle-check", true, "", () => this.answerContinue(order.id, true)),
            makeTool("拒绝继续", "fa-solid fa-circle-xmark", true, "", () => this.answerContinue(order.id, false))
          );
        }
      }
      if (isStaff || isAdmin) {
        if (order.rush?.status === "pending") {
          tools.push(
            makeTool("接受加急", "fa-solid fa-check", true, "", () => this.respondRush(order.id, true)),
            makeTool("拒绝加急", "fa-solid fa-xmark", true, "", () => this.respondRush(order.id, false))
          );
        }
        if (order.rush?.status === "breached") {
          tools.push(makeTool("申请继续", "fa-solid fa-forward", true, "", () => this.requestContinue(order.id)));
        }
      }

      const messageNodes = [];
      let previousDateKey = "";
      let previousSender = "";
      let previousTime = 0;
      messages.forEach((message) => {
        const createdAt = new Date(message.createdAt || Date.now());
        const dateKey = Number.isFinite(createdAt.getTime()) ? createdAt.toISOString().slice(0, 10) : "";
        if (dateKey && dateKey !== previousDateKey) {
          messageNodes.push(h("div", { className: "chat-day-separator" }, h("span", { text: formatFullDate(createdAt).slice(0, 10) })));
          previousDateKey = dateKey;
          previousSender = "";
          previousTime = 0;
        }
        if (message.type === "system") {
          messageNodes.push(h("div", { className: "chat-message system" }, h("span", { text: message.text }), h("small", { text: formatFullDate(message.createdAt) })));
          previousSender = "";
          previousTime = 0;
          return;
        }
        const own = normalize(message.sender) === normalize(currentUsername);
        const readBy = Array.isArray(message.readBy) ? message.readBy : [];
        const counterpartRead = counterpartUsername && readBy.some((item) => normalize(item) === normalize(counterpartUsername));
        const sentTime = timestampMs(message.createdAt);
        const compact = previousSender === normalize(message.sender) && sentTime - previousTime < 4 * 60 * 1000;
        messageNodes.push(h("div", { className: `chat-message ${own ? "own" : ""} ${compact ? "compact" : ""}` },
          compact ? null : h("div", { className: "chat-message-meta" },
            h("strong", { className: "notranslate", translate: "no", text: message.sender }),
            h("small", { text: formatDate(message.createdAt) })
          ),
          message.text ? h("p", { text: message.text }) : null,
          message.imageData ? h("button", { className: "chat-image-button", type: "button", onClick: () => UI.openModal(h("div", { className: "modal-card modal-wide slide-up" },
            h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
            h("img", { className: "chat-image-large", src: message.imageData, alt: "聊天图片" })
          )) }, h("img", { className: "chat-image", src: message.imageData, alt: "聊天图片" })) : null,
          own && counterpartUsername ? h("div", { className: `read-state ${counterpartRead ? "read" : "unread"}` }, counterpartRead ? "已读" : "未读") : null
        ));
        previousSender = normalize(message.sender);
        previousTime = sentTime;
      });
      if (!messageNodes.length) {
        messageNodes.push(h("div", { className: "chat-empty", text: "暂无消息。" }));
      }

      let selectedImageData = "";
      const attachmentPreview = h("div", { className: "chat-attachment-preview" });
      const textInput = h("textarea", { name: "message", rows: "2", placeholder: "输入消息，Enter 发送，Shift + Enter 换行" });
      const fileInput = h("input", { type: "file", name: "image", accept: "image/*" });
      const form = h("form", { className: "chat-compose" },
        textInput,
        h("label", { className: "image-picker" }, icon("fa-regular fa-image"), "图片", fileInput),
        h("button", { className: "button button-primary button-small", type: "submit" }, "发送"),
        attachmentPreview
      );
      const renderAttachmentPreview = () => {
        clear(attachmentPreview);
        attachmentPreview.classList.toggle("is-visible", Boolean(selectedImageData));
        if (!selectedImageData) {
          return;
        }
        attachmentPreview.append(
          h("img", { src: selectedImageData, alt: "待发送图片" }),
          h("button", {
            className: "icon-button square",
            type: "button",
            onClick: () => {
              selectedImageData = "";
              fileInput.value = "";
              renderAttachmentPreview();
            },
            ariaLabel: "移除图片"
          }, icon("fa-solid fa-xmark"))
        );
      };
      textInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          form.requestSubmit();
        }
      });
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) {
          selectedImageData = "";
          renderAttachmentPreview();
          return;
        }
        if (!file.type.startsWith("image/")) {
          UI.toast("图片格式不支持", "请选择图片文件。");
          fileInput.value = "";
          return;
        }
        if (file.size > 3 * 1024 * 1024) {
          UI.toast("图片过大", "聊天图片请控制在 3MB 内。");
          fileInput.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          selectedImageData = String(reader.result || "");
          renderAttachmentPreview();
        };
        reader.readAsDataURL(file);
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const loader = UI.beginInteractionLoading(form.querySelector("button[type='submit']"));
        const text = textInput.value.trim();
        if (!text && !selectedImageData) {
          UI.toast("请输入内容", "可以发送文字或图片。");
          loader?.done();
          return;
        }
        const send = async () => {
          const messagePayload = {
            type: selectedImageData ? "image" : "text",
            text,
            imageData: selectedImageData
          };
          const backendResult = await Backend.addChatMessage(order.id, messagePayload);
          if (backendResult.offline) {
            Data.addChatMessage(order.id, messagePayload);
          } else if (!backendResult.ok) {
            UI.toast("操作失败", backendResult.message || "请稍后重试。");
            return;
          }
          this.openOrderChat(order.id);
        };
        send().finally(() => loader?.done());
      });
      const messageList = h("div", { className: "chat-messages" }, messageNodes);

      UI.openModal(
        h("div", { className: "modal-card modal-wide chat-modal slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "订单联系" }),
          h("div", { className: "chat-header" },
            h("div", {},
              h("p", {}, "订单 ", h("span", { className: "mono notranslate", translate: "no", text: order.id })),
              h("small", { text: `未读消息：${Data.unreadChatCount(order.id, currentUsername)} 条` })
            ),
            h("div", { className: "chat-presence" },
              participantCard("Gamer", customerProfile),
              participantCard("Vector", staffProfile)
            )
          ),
          order.rush ? h("p", { className: "balance-note order-locked-term notranslate", translate: "no", text: `${rushStatusLabel(order.rush)}${order.rush.deadlineAt ? ` / ${contentLanguage() === "zh-CN" ? "期限" : "Deadline"}: ${formatFullDate(order.rush.deadlineAt)}` : ""}` }) : null,
          h("div", { className: "chat-shell" },
            h("aside", { className: "chat-sidebar" },
              h("h3", { text: "操作" }),
              tools.length ? tools : h("p", { text: "暂无可用操作。" })
            ),
            h("section", { className: "chat-panel" },
              messageList,
              form
            )
          )
        )
      );
      window.setTimeout(() => {
        messageList.scrollTop = messageList.scrollHeight;
        textInput.focus();
      }, 0);
    },
    openRushForm(orderId) {
      const order = Data.orderById(orderId);
      const fee = Math.ceil(Number(order?.price || 0) * RushFeeRate);
      UI.openFormModal({
        title: "申请加急",
        fields: [
          { name: "days", label: "结单期限（天）", type: "number", value: "1", min: "1", max: "30", step: "1", required: true },
          { name: "password", label: "账户密码", type: "password", required: true }
        ],
        submitLabel: contentLanguage() === "zh-CN" ? `支付 ${formatPrice(fee)}并申请` : `Pay ${formatPrice(fee)} and Request`,
        onSubmit: async (values) => {
          if (!await this.accountPasswordOk(values.password)) {
            return { error: "账户密码不正确。" };
          }
          const result = Data.requestRush(orderId, values.days);
          if (!result.ok) {
            if (result.reason === "insufficient") {
              window.setTimeout(() => this.openRecharge(null, fee), 0);
              return { error: "余额不足，请先充值。" };
            }
            return { error: "当前订单不能申请加急。" };
          }
          UI.toast("加急已提交", "等待 Vector 确认。");
          window.setTimeout(() => this.openOrderChat(orderId), 0);
          return null;
        }
      });
    },
    openReturnForm(orderId) {
      UI.openFormModal({
        title: "申请退单",
        fields: [
          { name: "password", label: "账户密码", type: "password", required: true }
        ],
        submitLabel: "确认退单",
        onSubmit: async (values) => {
          if (!await this.accountPasswordOk(values.password)) {
            return { error: "账户密码不正确。" };
          }
          const result = Data.returnOrder(orderId);
          if (!result.ok) {
            return { error: "退单窗口已关闭或订单不可退。" };
          }
          UI.toast("退单完成", contentLanguage() === "zh-CN" ? `已退回 ${formatPrice(result.refundAmount)}。` : `${formatPrice(result.refundAmount)} refunded.`);
          window.setTimeout(() => this.openOrderChat(orderId), 0);
          return null;
        }
      });
    },
    openReportForm(orderId) {
      UI.openFormModal({
        title: "举报 Vector",
        fields: [
          { name: "reason", label: "举报类型", type: "select", value: "delay", options: [
            { value: "delay", label: "拖延或失联" },
            { value: "attitude", label: "服务态度" },
            { value: "violation", label: "违规行为" },
            { value: "harassment", label: "骚扰或不当言论" },
            { value: "other", label: "其他" }
          ] },
          { name: "description", label: "举报说明", type: "textarea", placeholder: "请描述具体情况、时间和证据", required: true },
          { name: "password", label: "账户密码", type: "password", required: true }
        ],
        submitLabel: "提交举报",
        onSubmit: async (values) => {
          if (!await this.accountPasswordOk(values.password)) {
            return { error: "账户密码不正确。" };
          }
          const result = Data.reportOrder(orderId, values.reason, values.description.trim());
          if (!result.ok) {
            return { error: "当前订单不能举报。" };
          }
          UI.toast("举报已提交", "管理员日志中已记录。");
          window.setTimeout(() => this.openOrderChat(orderId), 0);
          return null;
        },
        wide: true
      });
    },
    openTipForm(orderId) {
      UI.openFormModal({
        title: "支付小费",
        fields: [
          { name: "amount", label: "小费积分", type: "number", value: "1", min: "1", step: "1", required: true },
          { name: "password", label: "账户密码", type: "password", required: true }
        ],
        submitLabel: "确认支付",
        onSubmit: async (values) => {
          const amount = Math.ceil(Number(values.amount));
          if (!Number.isFinite(amount) || amount <= 0) {
            return { error: "请输入有效的小费金额。" };
          }
          if (!await this.accountPasswordOk(values.password)) {
            return { error: "账户密码不正确。" };
          }
          const result = Data.tipOrder(orderId, amount);
          if (!result.ok) {
            if (result.reason === "insufficient") {
              window.setTimeout(() => this.openRecharge(null, amount), 0);
              return { error: "余额不足，请先充值。" };
            }
            return { error: "当前订单不能支付小费。" };
          }
          UI.toast("小费已支付", contentLanguage() === "zh-CN" ? `${formatPrice(amount)}已转给 Vector。` : `${formatPrice(amount)} sent to Vector.`);
          window.setTimeout(() => this.openOrderChat(orderId), 0);
          return null;
        }
      });
    },
    respondRush(orderId, accepted) {
      UI.openConfirm(accepted ? "接受加急？" : "拒绝加急？", accepted ? "接受后需要在 Gamer 规定期限内结单。" : "拒绝后加急费用会退回 Gamer。", () => {
        const result = Data.respondRush(orderId, accepted);
        UI.toast(result.ok ? "加急状态已更新" : "操作失败");
        this.openOrderChat(orderId);
      });
    },
    requestContinue(orderId) {
      UI.openConfirm("申请继续完成？", "Gamer 同意后，违约订单结单时 Vector 可额外获得原费用的 50%。", () => {
        const result = Data.requestContinueAfterBreach(orderId);
        UI.toast(result.ok ? "已发送继续完成申请" : "操作失败");
        this.openOrderChat(orderId);
      });
    },
    answerContinue(orderId, accepted) {
      UI.openPasswordPrompt({
        title: accepted ? "同意继续完成？" : "拒绝继续完成？",
        body: "该操作需要输入账户密码。",
        validator: (password) => this.accountPasswordOk(password),
        onSuccess: () => {
          const result = Data.answerContinueAfterBreach(orderId, accepted);
          UI.toast(result.ok ? "已更新继续完成状态" : "操作失败");
          window.setTimeout(() => this.openOrderChat(orderId), 0);
        }
      });
    },
    accountMenuSummary() {
      const profile = Data.currentProfile();
      if (!State.currentUser || !profile) {
        return {
          type: "summary",
          node: h("div", { className: "menu-summary" },
            h("div", { className: "menu-summary-icon" }, icon("fa-regular fa-user")),
            h("div", {},
              h("strong", { text: localizeStaticPhrase("访客") }),
              h("span", {}, localizeStaticPhrase("当前版本"), " ", h("span", { className: "notranslate", translate: "no", text: CurrentRelease.version }))
            )
          )
        };
      }
      const modeLabel = localizeStaticPhrase(Modes[State.mode] || "Gamer 模式");
      return {
        type: "summary",
        node: h("div", { className: "menu-summary" },
          profileAvatarNode(profile, profile.username, "profile-avatar profile-avatar-small menu-avatar"),
          h("div", {},
            h("strong", { className: "notranslate", translate: "no", text: profile.username }),
            h("span", {}, modeLabel, " · ", h("span", { className: "notranslate", translate: "no", text: CurrentRelease.version }))
          )
        )
      };
    },
    releaseMeta(label, value, noTranslate = false) {
      return h("div", { className: "release-meta" },
        h("span", { text: label }),
        h("strong", { className: noTranslate ? "notranslate" : "", translate: noTranslate ? "no" : null, text: value })
      );
    },
    releaseDetailSections(release) {
      const theme = localizedI18n(release.nameI18n);
      const summary = localizedI18n(release.summaryI18n);
      const status = localizedI18n(release.statusI18n);
      const notes = (release.itemsI18n || []).map((item) => localizedI18n(item));
      return [
        {
          title: "交付范围",
          body: `本版本围绕「${theme}」展开，目标是在不改变现有主要业务路径的前提下提升对应模块的可用性、可维护性和发布可追踪性。概要：${summary}`
        },
        {
          title: "关键变更",
          items: notes
        },
        {
          title: "平台影响",
          body: "本版本保持既有数据结构和用户存量数据兼容，避免破坏已注册账户、订单记录、资金记录和管理配置。界面调整优先控制在展示层，降低对业务逻辑的影响。"
        },
        {
          title: "部署备注",
          body: `版本日期：${release.releasedAt}。当前状态：${status}。如处于本地草案阶段，需要在最终确认后统一合并、提交并上传；如为生产版本，则表示该记录对应已经上线的可用版本。`
        }
      ];
    },
    openCurrentVersion() {
      const release = CurrentRelease;
      const isAdmin = State.currentUser?.role === "admin";
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("div", { className: "release-hero" },
            h("span", { className: "release-badge" }, icon("fa-solid fa-code-branch"), localizeStaticPhrase("当前发布")),
            h("h2", {},
              h("span", { className: "notranslate", translate: "no", text: release.version }),
              isAdmin ? " · " : null,
              isAdmin ? localizedI18n(release.nameI18n) : null
            ),
            h("p", { text: localizedI18n(release.summaryI18n) })
          ),
          h("div", { className: "release-meta-grid" },
            this.releaseMeta(localizeStaticPhrase("版本号"), release.version, true),
            ...(isAdmin ? [this.releaseMeta(localizeStaticPhrase("版本名称"), localizedI18n(release.nameI18n))] : []),
            this.releaseMeta(localizeStaticPhrase("发布时间"), release.releasedAt, true),
            ...(isAdmin ? [this.releaseMeta(localizeStaticPhrase("上传状态"), localizedI18n(release.statusI18n))] : [])
          ),
          isAdmin ? h("div", { className: "modal-actions" },
            h("button", { className: "button button-primary", type: "button", onClick: () => this.openDevelopmentLog() }, icon("fa-solid fa-clock-rotate-left"), "查看开发日志")
          ) : null
        )
      );
    },
    openReleaseDetails(release) {
      const sections = this.releaseDetailSections(release);
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("div", { className: "release-hero" },
            h("span", { className: "release-badge" }, icon("fa-solid fa-code-branch"), "版本细节"),
            h("h2", {}, h("span", { className: "notranslate", translate: "no", text: release.version }), " · ", localizedI18n(release.nameI18n)),
            h("p", { text: localizedI18n(release.summaryI18n) })
          ),
          h("div", { className: "release-meta-grid" },
            this.releaseMeta(localizeStaticPhrase("版本号"), release.version, true),
            this.releaseMeta(localizeStaticPhrase("版本名称"), localizedI18n(release.nameI18n)),
            this.releaseMeta(localizeStaticPhrase("发布时间"), release.releasedAt, true),
            this.releaseMeta(localizeStaticPhrase("上传状态"), localizedI18n(release.statusI18n))
          ),
          h("div", { className: "release-detail-stack" },
            sections.map((section) => h("section", { className: "release-section" },
              h("h3", { text: section.title }),
              section.items
                ? h("ul", { className: "release-bullets" }, section.items.map((item) => h("li", { text: item })))
                : h("p", { text: section.body })
            ))
          ),
          h("div", { className: "modal-actions" },
            h("button", { className: "button button-ghost", type: "button", onClick: () => this.openDevelopmentLog() }, icon("fa-solid fa-arrow-left"), "返回开发日志")
          )
        )
      );
    },
    openDevelopmentLog() {
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "开发日志" }),
          h("div", { className: "release-list" },
            DevelopmentRecords.map((release, index) => h("button", {
              className: `release-card release-card-button ${index === 0 ? "current" : ""}`,
              type: "button",
              ariaLabel: `${release.version} ${localizedI18n(release.nameI18n)} 版本细节`,
              onClick: () => this.openReleaseDetails(release)
            },
              h("div", { className: "release-card-head" },
                h("strong", { className: "notranslate", translate: "no", text: release.version })
              ),
              h("h3", { text: localizedI18n(release.nameI18n) }),
              h("p", { text: localizedI18n(release.summaryI18n) }),
              h("div", { className: "release-date" }, "日期：", h("span", { className: "notranslate", translate: "no", text: release.releasedAt }))
            ))
          )
        )
      );
    },
    userMenu(anchor) {
      const items = [
        this.accountMenuSummary(),
        { type: "separator" },
        { label: "我的订单", icon: "fa-solid fa-receipt", action: () => Router.go("account") },
        State.currentUser?.role !== "admin" ? { label: "充值积分", icon: "fa-solid fa-coins", action: () => this.openRecharge() } : null,
        { label: "语言选择", icon: "fa-solid fa-language", action: () => this.openLanguageSelector() },
        { label: "当前版本", icon: "fa-solid fa-code-branch", action: () => this.openCurrentVersion() },
        State.currentUser?.role === "admin" ? { label: "开发日志", icon: "fa-solid fa-clock-rotate-left", action: () => this.openDevelopmentLog() } : null,
        { type: "separator" },
        { label: "设置", icon: "fa-solid fa-gear", action: () => this.openUserSettings() }
      ].filter(Boolean);
      UI.showMenuFromElement(anchor, items);
    },
    openMailbox() {
      if (!State.currentUser) {
        Auth.open("login");
        return;
      }
      const username = State.currentUser.username;
      let activeCategory = "all";
      let selectedId = "";
      const card = h("div", { className: "modal-card modal-wide mailbox-modal slide-up" });
      const renderMailbox = () => {
        const allMessages = Data.mailbox(username);
        const filteredMessages = activeCategory === "all"
          ? allMessages
          : allMessages.filter((message) => message.category === activeCategory);
        if (!selectedId || !filteredMessages.some((message) => message.id === selectedId)) {
          selectedId = filteredMessages[0]?.id || "";
        }
        if (selectedId) {
          Data.markMailboxRead(username, selectedId);
          Components.renderTopbar();
        }
        const refreshedMessages = Data.mailbox(username);
        const visibleMessages = activeCategory === "all"
          ? refreshedMessages
          : refreshedMessages.filter((message) => message.category === activeCategory);
        const selectedMessage = refreshedMessages.find((message) => message.id === selectedId) || null;
        const categoryCount = (categoryId) => categoryId === "all"
          ? refreshedMessages.length
          : refreshedMessages.filter((message) => message.category === categoryId).length;
        const unreadCount = (categoryId) => refreshedMessages.filter((message) => (
          !message.readAt && (categoryId === "all" || message.category === categoryId)
        )).length;

        clear(card);
        append(card, [
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("div", { className: "mailbox-heading" },
            h("div", {},
              h("span", { className: "release-badge" }, icon("fa-regular fa-envelope"), "邮件中心")
            ),
            h("div", { className: "mailbox-counter" },
              h("strong", { className: "notranslate", translate: "no", text: `${refreshedMessages.filter((message) => !message.readAt).length}` }),
              h("span", { text: "未读" })
            )
          ),
          h("div", { className: "mailbox-shell" },
            h("aside", { className: "mailbox-nav" },
              MailboxCategories.map((category) => {
                const count = categoryCount(category.id);
                const unread = unreadCount(category.id);
                return h("button", {
                  className: `mailbox-category ${activeCategory === category.id ? "active" : ""}`,
                  type: "button",
                  onClick: () => {
                    activeCategory = category.id;
                    selectedId = "";
                    renderMailbox();
                  }
                },
                  icon(category.icon),
                  h("span", { text: category.label }),
                  h("small", { className: "notranslate", translate: "no", text: unread ? `${unread}/${count}` : String(count) })
                );
              })
            ),
            h("section", { className: "mailbox-list", "aria-label": "邮件列表" },
              h("div", { className: "mailbox-list-scroll" },
                visibleMessages.length
                  ? visibleMessages.map((message) => {
                      const category = mailboxCategory(message.category);
                      return h("button", {
                        className: `mail-row ${message.id === selectedId ? "active" : ""} ${message.readAt ? "read" : "unread"}`,
                        type: "button",
                        onClick: () => {
                          selectedId = message.id;
                          renderMailbox();
                        }
                      },
                        h("span", { className: "mail-row-icon" }, icon(category.icon)),
                        h("span", { className: "mail-row-main" },
                          h("strong", { text: localizeStaticPhrase(message.subject || "系统通知") }),
                          h("small", { className: "notranslate", translate: "no", text: message.preview || message.body || "系统通知" })
                        ),
                        h("time", { className: "notranslate", translate: "no", datetime: message.createdAt, text: formatDate(message.createdAt) }),
                        message.readAt ? null : h("span", { className: "mail-unread-dot", ariaLabel: "未读" })
                      );
                    })
                  : h("div", { className: "mailbox-empty" }, icon("fa-regular fa-envelope-open"), h("strong", { text: "暂无邮件" }))
              ),
              h("div", { className: "mailbox-list-actions" },
                h("button", {
                  className: "button button-primary mailbox-action",
                  type: "button",
                  disabled: !visibleMessages.length,
                  onClick: () => {
                    Data.markMailboxCategoryRead(username, activeCategory);
                    Components.renderTopbar();
                    renderMailbox();
                    UI.toast("已全部处理");
                  }
                }, icon("fa-solid fa-check-double"), h("span", { text: "全部已读/领取" })),
                h("button", {
                  className: "button button-ghost mailbox-action",
                  type: "button",
                  disabled: !visibleMessages.some((message) => message.readAt),
                  onClick: () => {
                    const deleted = Data.deleteReadMailboxMessages(username, activeCategory);
                    if (selectedId && !Data.mailbox(username).some((message) => message.id === selectedId)) {
                      selectedId = "";
                    }
                    Components.renderTopbar();
                    renderMailbox();
                    UI.toast(deleted ? "已读邮件已删除" : "没有可删除的已读邮件");
                  }
                }, icon("fa-regular fa-trash-can"), h("span", { text: "删除已读" }))
              )
            ),
            h("article", { className: "mailbox-detail" },
              selectedMessage
                ? [
                    h("div", { className: "mail-detail-header" },
                      h("span", { className: "release-badge" }, icon(mailboxCategory(selectedMessage.category).icon), mailboxCategory(selectedMessage.category).label),
                      h("h3", { text: localizeStaticPhrase(selectedMessage.subject || "系统通知") }),
                      h("p", { text: "该邮件由系统自动同步，不能取消发送。" })
                    ),
                    h("dl", { className: "mail-detail-meta" },
                      h("div", {}, h("dt", { text: "发件人" }), h("dd", { className: "notranslate", translate: "no", text: selectedMessage.sender || "IMPULSE J System" })),
                      h("div", {}, h("dt", { text: "发送时间" }), h("dd", { className: "notranslate", translate: "no", text: formatFullDate(selectedMessage.createdAt) })),
                      selectedMessage.orderId ? h("div", {}, h("dt", { text: "关联订单" }), h("dd", { className: "notranslate", translate: "no", text: selectedMessage.orderId })) : null,
                      h("div", {}, h("dt", { text: "状态" }), h("dd", { text: selectedMessage.readAt ? "已读" : "未读" }))
                    ),
                    h("div", { className: "mail-detail-body notranslate", translate: "no", text: selectedMessage.body || selectedMessage.preview || "No message body." })
                  ]
                : h("div", { className: "mailbox-empty" }, icon("fa-regular fa-envelope-open"), h("strong", { text: "选择一封邮件查看详情。" }))
            )
          )
        ]);
        Translation.localizeStaticUi(card);
        Translation.refresh();
      };

      renderMailbox();
      UI.openModal(card);
    },
    guestMenu(anchor) {
      UI.showMenuFromElement(anchor, [
        this.accountMenuSummary(),
        { type: "separator" },
        { label: "语言选择", icon: "fa-solid fa-language", action: () => this.openLanguageSelector() },
        { label: "当前版本", icon: "fa-solid fa-code-branch", action: () => this.openCurrentVersion() },
        { type: "separator" },
        { label: "登录", icon: "fa-regular fa-user", action: () => Auth.open("login") }
      ]);
    },
    openLanguageSelector() {
      const current = Translation.selected();
      UI.openModal(
        h("div", { className: "modal-card slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "语言选择" }),
          h("p", { className: "language-control-note notranslate", translate: "no", text: ControllingLanguageNotice }),
          h("p", { className: "language-helper-note", text: "普通界面会继续支持多语言；法律、资金规则、争议结论、提现说明和官方邮件始终以英文为准。" }),
          h("div", { className: "language-grid" },
            Languages.map((language) => h("button", {
              className: `language-option ${language.code === current ? "active" : ""}`,
              type: "button",
              onClick: () => {
                UI.closeModal();
                Translation.choose(language.code);
              }
            },
              h("span", { className: "notranslate", translate: "no", text: language.nativeName }),
              h("small", { className: "notranslate", translate: "no", text: languageName(language.code, current) }),
              language.code === current ? icon("fa-solid fa-check") : null
            ))
          )
        )
      );
    },
    async setOrderStatus(orderId, status) {
      let order = Data.orderById(orderId);
      if (!order) {
        UI.toast("订单不存在");
        App.render();
        return;
      }
      if (status === "processing" && isAutoCancelDue(order)) {
        Data.refundOrder(order, "超时无人接单自动退单");
        UI.toast("订单已退单", "该订单因超时无人接单已自动退款。");
        App.render();
        return;
      }
      Data.processAutoRefunds();
      Data.processRushBreaches();
      order = Data.orderById(orderId);
      if (!order) {
        UI.toast("订单不存在");
        App.render();
        return;
      }
      if (status === "processing") {
        if (order.status !== "pending") {
          UI.toast("无法接单", "该订单已不在待处理状态。");
          App.render();
          return;
        }
      }
      if (status === "completed" && (order.status !== "processing" || !order.handledBy)) {
        UI.toast("无法结单", "订单需要先由 Vector 接单。");
        App.render();
        return;
      }
      const backendResult = await Backend.updateOrderStatus(orderId, status);
      if (backendResult.ok) {
        UI.toast("订单已更新", StatusLabels[status]);
        App.render();
        return;
      }
      if (!backendResult.offline) {
        UI.toast("操作失败", backendResult.message || "请稍后重试。");
        App.render();
        return;
      }
      if (status === "cancelled" && ["pending", "processing"].includes(order.status) && !order.refundedAt && Number(order.price || 0) > 0) {
        const result = Data.refundOrder(order, "订单取消退款");
        UI.toast(result.ok ? "订单已取消并退款" : "订单已取消", result.ok ? "积分已返还至 Gamer 账户。" : "未找到可退款账户。");
        if (!result.ok) {
          Data.updateOrder(orderId, { status, updatedAt: new Date().toISOString() });
        }
        App.render();
        return;
      }
      Data.updateOrder(orderId, { status, updatedAt: new Date().toISOString() });
      if (status === "processing") {
        const accepted = Data.orderById(orderId);
        Data.addChatMessage(orderId, {
          sender: "SYSTEM",
          role: "system",
          type: "system",
          text: `${accepted?.handledBy || "Vector"} 已接单，聊天功能已开启。`
        });
        Data.notifyUser(Data.profileByUsername(accepted?.customerUsername), "orderAccepted", {
          orderId: accepted?.id,
          itemName: accepted?.productTitle,
          amount: accepted?.handledBy ? `Accepted by ${accepted.handledBy}` : "Accepted"
        });
      }
      if (status === "completed") {
        Data.settleOrder(orderId);
      }
      UI.toast("订单已更新", StatusLabels[status]);
      App.render();
    },
    cancelOrder(orderId) {
      UI.openConfirm("取消订单？", "取消后订单状态会变为已取消，并返还已扣除积分。", () => {
        const order = Data.orderById(orderId);
        if (order && !order.refundedAt && Number(order.price || 0) > 0) {
          Data.refundOrder(order, "用户取消订单退款");
        } else {
          Data.updateOrder(orderId, { status: "cancelled", updatedAt: new Date().toISOString() });
        }
        UI.toast("订单已取消", "积分已返还至账户。");
        App.render();
      });
    },
    exportData() {
      const blob = new Blob([JSON.stringify(Data.exportSnapshot(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = h("a", { href: url, download: `impulse-data-${Date.now()}.json` });
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      UI.toast("数据已导出");
    },
    resetContent() {
      UI.openConfirm("恢复默认商品数据？", "分类、分区和商品会恢复为初始数据，订单和用户会保留。", () => {
        Data.resetContent();
        UI.toast("商品数据已恢复");
        Router.go("home");
      });
    },
    clearOrders() {
      UI.openConfirm("清空订单？", "所有本地订单和预约记录都会被删除。", () => {
        Data.saveOrders([]);
        Data.log("清空订单", "管理员清空全部订单记录");
        UI.toast("订单已清空");
        App.render();
      });
    },
    clearAdminLogs() {
      this.requireAdminPassword("一键清空日志", () => {
        Data.saveAdminLogs([]);
        Data.log("清空日志", "管理员清空全部日志记录");
        UI.toast("日志已清空");
        App.render();
      });
    },
    openBackupEmailSettings() {
      const current = Data.systemSettings().backupEmail;
      this.requireAdminPassword("设置归档备份邮箱", () => {
        UI.openFormModal({
          title: "指定备份邮箱",
          fields: [
            { name: "email", label: "备份邮箱", type: "email", value: current, placeholder: "archive@example.com", required: true }
          ],
          submitLabel: "保存",
          onSubmit: async (values) => {
            const email = normalizeEmail(values.email);
            if (!isEmail(email)) {
              return { error: "请输入有效邮箱。" };
            }
            let result = await Backend.setBackupEmail(email);
            if (result.offline) {
              Data.saveSystemSettings({ backupEmail: email });
              Data.log("设置备份邮箱", email);
              result = { ok: true };
            }
            if (!result.ok) {
              return { error: result.message || "备份邮箱保存失败。" };
            }
            UI.toast("备份邮箱已保存", email);
            App.render();
            return null;
          }
        });
      });
    },
    async runRetentionCleanup() {
      const email = Data.systemSettings().backupEmail;
      if (!email) {
        UI.toast("请先设置备份邮箱", "超过 30 天的日志和已关闭单号需要先发送备份。");
        this.openBackupEmailSettings();
        return;
      }
      const result = await Backend.runRetentionCleanup();
      if (result.offline) {
        UI.toast("后端暂不可用", "归档清理需要连接后端和邮件服务。");
        return;
      }
      if (!result.ok) {
        UI.toast("归档失败", result.message || "请稍后重试。");
        return;
      }
      const retention = result.retention || {};
      UI.toast("归档检查完成", `日志 ${retention.expiredLogs || 0} 条，单号 ${retention.expiredOrders || 0} 条。`);
      App.render();
    },
    adminPasswordOk(password) {
      const admin = BuiltInUsers.find((user) => user.username === "ADMIN");
      return Boolean(admin && password === admin.password);
    },
    requestAdminSection(section) {
      const meta = AdminSections.find((item) => item.id === section);
      if (!meta) {
        return;
      }
      UI.openPasswordPrompt({
        title: `打开${meta.title}分区`,
        body: "请输入该分区的二级密码。",
        validator: (password) => password === meta.password,
        onSuccess: () => {
          State.adminUnlocked[section] = true;
          Data.log("打开管理分区", meta.title);
          Router.go("admin", { section });
        }
      });
    },
    requireAdminPassword(title, onSuccess) {
      UI.openPasswordPrompt({
        title,
        body: "该操作需要输入管理员密码。",
        validator: (password) => this.adminPasswordOk(password),
        onSuccess
      });
    },
    auditUserFunds(userId) {
      const profile = Data.profileById(userId);
      if (!profile) {
        return;
      }
      const entries = Data.ledger().filter((entry) => entry.userId === profile.id);
      const sum = entries.reduce((total, entry) => total + Number(entry.amountPoints || 0), 0);
      const current = Number(profile.funds || 0);
      const diff = current - sum;
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "资金核对结果" }),
          h("p", { text: `用户：${profile.username}` }),
          h("p", { text: `计算过程：所有流水积分变动合计 ${sum}，当前账户资金 ${current}，差额 ${diff}。` }),
          h("p", { text: diff === 0 ? "核对通过：资金出入等于当前资金。" : "核对异常：资金出入与当前资金不一致。" })
        )
      );
      Data.log("资金核对", `${profile.username} 差额 ${diff}`);
    },
    saveManualFunds(target) {
      const profile = Data.profileById(target.dataset.userId);
      const panel = target.closest(".panel");
      const input = panel ? panel.querySelector("[data-action='manual-funds-input']") : null;
      if (!profile || !input) {
        return;
      }
      const nextFunds = Number(input.value);
      if (!Number.isFinite(nextFunds)) {
        UI.toast("参数错误", "请输入有效资金数值。");
        return;
      }
      if (nextFunds < 0) {
        UI.toast("参数错误", "账户积分不能为负。");
        return;
      }
      this.requireAdminPassword("保存资金修改", () => {
        const diff = nextFunds - Number(profile.funds || 0);
        const result = Data.adjustFunds(profile.id, diff, "管理员手动修正", { type: "manual", itemName: "资金手动修改" });
        if (!result.ok) {
          UI.toast("资金修改失败", "账户积分不能为负。");
          return;
        }
        UI.toast("资金已修改", `${profile.username} 当前资金 ${nextFunds} 积分`);
        App.render();
      });
    },
    banUser(userId) {
      const profile = Data.profileById(userId);
      if (!profile) {
        return;
      }
      UI.openFormModal({
        title: "封禁账户",
        fields: [
          { name: "months", label: "封禁时长", type: "select", value: "3", options: [
            { value: "3", label: "3 个月" },
            { value: "6", label: "6 个月" },
            { value: "12", label: "1 年" },
            { value: "36", label: "3 年" },
            { value: "60", label: "5 年" },
            { value: "120", label: "10 年" }
          ] },
          { name: "password", label: "管理员密码", type: "password", required: true }
        ],
        submitLabel: "封禁",
        onSubmit: (values) => {
          if (!this.adminPasswordOk(values.password)) {
            return { error: "管理员密码不正确。" };
          }
          const months = Math.min(120, Math.max(3, Number(values.months || 3)));
          Data.saveProfile({ ...profile, bannedUntil: addMonths(new Date(), months).toISOString() });
          Data.log("封禁账户", `${profile.username} 封禁 ${months} 个月`);
          UI.toast("账户已封禁", `${profile.username} 已封禁 ${months} 个月`);
          App.render();
          return null;
        }
      });
    },
    unbanUser(userId) {
      const profile = Data.profileById(userId);
      if (!profile) {
        return;
      }
      this.requireAdminPassword("解封账户", () => {
        Data.saveProfile({ ...profile, bannedUntil: "" });
        Data.log("解封账户", profile.username);
        UI.toast("账户已解封", profile.username);
        App.render();
      });
    },
    deleteUser(userId) {
      const profile = Data.profileById(userId);
      if (!profile) {
        return;
      }
      this.requireAdminPassword("注销账户", () => {
        Data.saveProfile({ ...profile, deleted: true, deletedAt: new Date().toISOString() });
        Data.log("注销账户", profile.username);
        UI.toast("账户已注销", profile.username);
        App.render();
      });
    },
    toggleAdminBatch(type) {
      const context = adminEditContext();
      if (!context || context.type !== type) {
        return;
      }
      const batch = ensureAdminBatch(context);
      State.adminBatch = {
        ...batch,
        active: !batch.active,
        selected: []
      };
      UI.toast(State.adminBatch.active ? "已进入批量管理" : "已退出批量管理", context.title);
      App.render();
    },
    toggleAdminBatchItem(type, id) {
      const context = adminEditContext();
      if (!context || context.type !== type) {
        return;
      }
      const batch = ensureAdminBatch(context);
      if (!batch.active) {
        return;
      }
      const selected = new Set(batch.selected);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      State.adminBatch = { ...batch, selected: Array.from(selected) };
      App.render();
    },
    selectAllAdminBatch() {
      const context = adminEditContext();
      if (!context) {
        return;
      }
      const batch = ensureAdminBatch(context);
      State.adminBatch = {
        ...batch,
        active: true,
        selected: context.items.map((item) => item.id)
      };
      App.render();
    },
    clearAdminBatchSelection() {
      const context = adminEditContext();
      if (!context) {
        return;
      }
      const batch = ensureAdminBatch(context);
      State.adminBatch = { ...batch, selected: [] };
      App.render();
    },
    deleteAdminBatchSelected() {
      const context = adminEditContext();
      const batch = ensureAdminBatch(context);
      if (!context || !batch.selected.length) {
        UI.toast("请选择要删除的内容。");
        return;
      }
      UI.openConfirm("批量删除？", "将删除已选内容，并同步删除其下级关联内容。", () => {
        const selected = new Set(batch.selected);
        if (context.type === "category") {
          selected.forEach((id) => Data.deleteCategory(id));
          Router.go("home");
        }
        if (context.type === "game") {
          selected.forEach((id) => Data.deleteGame(context.categoryId, id));
          Router.go("category", { categoryId: context.categoryId });
        }
        if (context.type === "product") {
          selected.forEach((id) => Data.deleteProduct(context.gameId, id));
        }
        State.adminBatch = { active: false, type: context.type, routeKey: context.routeKey, selected: [] };
        Data.log("批量删除内容", `${context.title} ${selected.size} 项`);
        UI.toast("已删除选中内容", `${selected.size} ${localizeStaticPhrase("项")}`);
        App.render();
      });
    },
    adminMenuForTarget(target) {
      const type = target.dataset.manageType;
      const id = target.dataset.manageId;
      const gameId = target.dataset.gameId;
      const labels = {
        category: { edit: "编辑分类", delete: "删除分类" },
        game: { edit: "编辑游戏分区", delete: "删除游戏分区" },
        product: { edit: "编辑商品", delete: "删除商品" }
      };
      const current = labels[type] || { edit: "编辑内容", delete: "删除内容" };
      return [
        { label: current.edit, icon: "fa-solid fa-pen", action: () => this.editItem(type, id, gameId) },
        { label: current.delete, icon: "fa-solid fa-trash", destructive: true, action: () => this.deleteItem(type, id, gameId) }
      ];
    },
    adminMenuForBlank() {
      if (State.route.name === "category") {
        return [{ label: "新增游戏分区", icon: "fa-solid fa-plus", action: () => this.editItem("game") }];
      }
      if (State.route.name === "products") {
        return [{ label: "新增商品", icon: "fa-solid fa-plus", action: () => this.editItem("product") }];
      }
      if (State.route.name === "home") {
        return [{ label: "新增分类", icon: "fa-solid fa-plus", action: () => this.editItem("category") }];
      }
      return [];
    },
    editItem(type, id, explicitGameId) {
      if (type === "category") {
        const item = id ? clone(Data.category(id)) : { id: createId("category"), title: "", description: "", icon: "fa-solid fa-star" };
        const title = contentValues(item, "title");
        const description = contentValues(item, "description");
        UI.openFormModal({
          title: id ? "编辑分类" : "新增分类",
          fields: [
            { name: "titleEn", label: "英文名称", value: title.en, required: true },
            { name: "titleZh", label: "中文名称", value: title["zh-CN"], required: true },
            { name: "descriptionEn", label: "英文描述", type: "textarea", value: description.en },
            { name: "descriptionZh", label: "中文描述", type: "textarea", value: description["zh-CN"] },
            { name: "icon", label: "图标 class", value: item.icon || "fa-solid fa-star", required: true }
          ],
          onSubmit: (values) => {
            Data.upsertCategory({
              ...item,
              title: values.titleZh.trim(),
              description: values.descriptionZh.trim(),
              titleI18n: localizedPair(values.titleEn, values.titleZh),
              descriptionI18n: localizedPair(values.descriptionEn, values.descriptionZh),
              icon: values.icon.trim()
            });
            UI.toast("分类已保存");
            App.render();
          }
        });
      }

      if (type === "game") {
        const categoryId = State.route.params.categoryId;
        const item = id ? clone(Data.game(categoryId, id)) : { id: createId("game"), title: "", description: "", imageData: "", icon: "fa-solid fa-star", platform: "" };
        const title = contentValues(item, "title");
        const description = contentValues(item, "description");
        const platform = contentValues(item, "platform");
        UI.openFormModal({
          title: id ? "编辑游戏分区" : "新增游戏分区",
          fields: [
            { name: "titleEn", label: "英文名称", value: title.en, required: true },
            { name: "titleZh", label: "中文名称", value: title["zh-CN"], required: true },
            { name: "descriptionEn", label: "英文描述", type: "textarea", value: description.en },
            { name: "descriptionZh", label: "中文描述", type: "textarea", value: description["zh-CN"] },
            { name: "imageData", label: "展示图片", type: "image", value: item.imageData || "", maxSize: DisplayImageMaxBytes, assetScope: "game-sections" },
            { name: "platformEn", label: "英文平台", value: platform.en || "" },
            { name: "platformZh", label: "中文平台", value: platform["zh-CN"] || "" },
            { name: "icon", label: "图标 class", value: item.icon || "fa-solid fa-star", required: true }
          ],
          onSubmit: (values) => {
            Data.upsertGame(categoryId, {
              ...item,
              title: values.titleZh.trim(),
              description: values.descriptionZh.trim(),
              platform: values.platformZh.trim(),
              titleI18n: localizedPair(values.titleEn, values.titleZh),
              descriptionI18n: localizedPair(values.descriptionEn, values.descriptionZh),
              platformI18n: localizedPair(values.platformEn, values.platformZh),
              imageData: values.imageData || "",
              icon: values.icon.trim()
            });
            UI.toast("分区已保存");
            App.render();
          }
        });
      }

      if (type === "product") {
        const gameId = explicitGameId || State.route.params.gameId;
        const item = id ? clone(Data.product(gameId, id)) : { id: createId("product"), title: "", description: "", imageData: "", price: 0, duration: "", badge: "", icon: "fa-solid fa-gamepad" };
        const title = contentValues(item, "title");
        const description = contentValues(item, "description");
        const duration = contentValues(item, "duration");
        const badge = contentValues(item, "badge");
        UI.openFormModal({
          title: id ? "编辑商品" : "新增商品",
          fields: [
            { name: "titleEn", label: "英文名称", value: title.en, required: true },
            { name: "titleZh", label: "中文名称", value: title["zh-CN"], required: true },
            { name: "descriptionEn", label: "英文描述", type: "textarea", value: description.en },
            { name: "descriptionZh", label: "中文描述", type: "textarea", value: description["zh-CN"] },
            { name: "imageData", label: "展示图片", type: "image", value: item.imageData || "", maxSize: DisplayImageMaxBytes, assetScope: "products" },
            { name: "price", label: "价格", type: "number", min: "0", step: "1", value: item.price, required: true },
            { name: "durationEn", label: "英文服务时长", value: duration.en || "" },
            { name: "durationZh", label: "中文服务时长", value: duration["zh-CN"] || "" },
            { name: "badgeEn", label: "英文标签", value: badge.en || "" },
            { name: "badgeZh", label: "中文标签", value: badge["zh-CN"] || "" },
            { name: "icon", label: "图标 class", value: item.icon || "fa-solid fa-gamepad" }
          ],
          onSubmit: (values) => {
            Data.upsertProduct(gameId, {
              ...item,
              title: values.titleZh.trim(),
              description: values.descriptionZh.trim(),
              titleI18n: localizedPair(values.titleEn, values.titleZh),
              descriptionI18n: localizedPair(values.descriptionEn, values.descriptionZh),
              imageData: values.imageData || "",
              price: Number(values.price) || 0,
              duration: values.durationZh.trim(),
              durationI18n: localizedPair(values.durationEn, values.durationZh),
              badge: values.badgeZh.trim(),
              badgeI18n: localizedPair(values.badgeEn, values.badgeZh),
              icon: values.icon.trim()
            });
            UI.toast("商品已保存");
            App.render();
          },
          wide: true
        });
      }
    },
    deleteItem(type, id, explicitGameId) {
      const labels = { category: "删除分类？", game: "删除游戏分区？", product: "删除商品？" };
      UI.openConfirm(labels[type] || "删除内容？", "删除后会立即更新本地数据。", () => {
        if (type === "category") {
          Data.deleteCategory(id);
          Router.go("home");
          return;
        }
        if (type === "game") {
          Data.deleteGame(State.route.params.categoryId, id);
          Router.go("category", { categoryId: State.route.params.categoryId });
          return;
        }
        if (type === "product") {
          Data.deleteProduct(explicitGameId || State.route.params.gameId, id);
          App.render();
        }
      });
    }
  };

  const App = {
    async init() {
      Dom.topActions = $("#topActions");
      Dom.searchForm = $("#searchForm");
      Dom.searchInput = $("#searchInput");
      Dom.heroPanel = $("#heroPanel");
      Dom.breadcrumb = $("#breadcrumb");
      Dom.contentZone = $("#contentZone");
      Dom.modalRoot = $("#modalRoot");
      Dom.contextMenu = $("#contextMenu");
      Dom.toastRoot = $("#toastRoot");
      Dom.appLoader = $("#appLoader");

      Data.initialize();
      await Backend.bootstrap();
      Data.processAutoRefunds();
      Data.processRushBreaches();
      Session.load();
      this.bindEvents();
      Translation.init();
      window.setInterval(() => {
        Data.touchCurrentUser();
        if (Data.pruneExpiredChats() || Data.processAutoRefunds() || Data.processRushBreaches()) {
          this.render();
        }
      }, 30000);
      this.render();
      window.requestAnimationFrame(() => UI.hideAppLoader());
    },
    bindEvents() {
      window.addEventListener("hashchange", () => this.render());
      window.addEventListener("focus", () => {
        if (Data.pruneExpiredChats() || Data.processAutoRefunds() || Data.processRushBreaches()) {
          this.render();
        }
      });
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && (Data.pruneExpiredChats() || Data.processAutoRefunds() || Data.processRushBreaches())) {
          this.render();
        }
      });

      Dom.searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const loader = UI.beginInteractionLoading(event.submitter || Dom.searchForm.querySelector("button[type='submit']"));
        Router.go("search", { q: Dom.searchInput.value.trim() });
        loader?.doneSoon();
      });

      document.addEventListener("click", (event) => {
        const target = event.target.closest?.("[data-mailbox-trigger='true']");
        if (!target) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const loader = UI.beginInteractionLoading(target);
        try {
          Actions.openMailbox();
          loader?.doneSoon();
        } catch (error) {
          loader?.done();
          throw error;
        }
      }, true);

      document.addEventListener("click", (event) => {
        if (!event.target.closest(".context-menu")) {
          UI.hideMenu();
        }
        const target = event.target.closest("[data-action]");
        if (!target) {
          return;
        }
        const loader = UI.beginInteractionLoading(target);
        try {
          const result = this.handleAction(target);
          if (result && typeof result.then === "function") {
            result.finally(() => loader?.done());
          } else {
            loader?.doneSoon();
          }
        } catch (error) {
          loader?.done();
          throw error;
        }
      });

      document.addEventListener("input", (event) => {
        const target = event.target.closest("[data-action]");
        if (!target) {
          return;
        }
        if (target.dataset.action === "admin-user-search") {
          State.adminUserSearch = target.value;
        }
        if (target.dataset.action === "admin-order-search") {
          State.adminOrderSearch = target.value;
        }
      });

      document.addEventListener("change", (event) => {
        const target = event.target.closest("[data-action]");
        if (!target) {
          return;
        }
        if (target.dataset.action === "admin-order-type") {
          State.adminOrderType = target.value;
          App.render();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          UI.closeModal();
          UI.hideMenu();
          return;
        }
        const inputTarget = event.target.closest?.("[data-action='admin-user-search'], [data-action='admin-order-search']");
        if (event.key === "Enter" && inputTarget) {
          event.preventDefault();
          App.render();
          return;
        }
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        const target = event.target.closest('[role="button"][data-action]');
        if (target) {
          event.preventDefault();
          target.click();
        }
      });

      Dom.contentZone.addEventListener("contextmenu", (event) => {
        if (State.mode !== "admin") {
          return;
        }
        event.preventDefault();
        const target = event.target.closest("[data-manage-type]");
        const items = target ? Actions.adminMenuForTarget(target) : Actions.adminMenuForBlank();
        if (items.length) {
          UI.showMenuAt(event.clientX, event.clientY, items);
        }
      });
    },
    handleAction(target) {
      const { action } = target.dataset;
      if (action === "go-home") {
        Router.go("home");
      }
      if (action === "open-login") {
        Auth.open("login");
      }
      if (action === "open-guest-menu") {
        Actions.guestMenu(target);
      }
      if (action === "open-recharge") {
        Actions.openRecharge();
      }
      if (action === "open-category") {
        Router.go("category", { categoryId: target.dataset.categoryId });
      }
      if (action === "open-products") {
        Router.go("products", { categoryId: target.dataset.categoryId, gameId: target.dataset.gameId });
      }
      if (action === "view-product") {
        Actions.openProductDetail(target.dataset.productId);
      }
      if (action === "close-modal") {
        UI.closeModal();
      }
      if (action === "cycle-mode") {
        Session.cycleMode();
      }
      if (action === "open-user-menu") {
        Actions.userMenu(target);
      }
      if (action === "open-mailbox") {
        Actions.openMailbox();
      }
      if (action === "open-admin") {
        Router.go("admin");
      }
      if (action === "request-admin-section" || action === "unlock-admin-section") {
        Actions.requestAdminSection(target.dataset.section);
      }
      if (action === "open-admin-users") {
        Router.go("admin", { section: "users" });
      }
      if (action === "open-admin-user-role") {
        State.adminUserSearch = "";
        Router.go("admin", { section: "users", role: target.dataset.role });
      }
      if (action === "open-admin-user-detail") {
        Router.go("admin", { section: "users", role: target.dataset.role, userId: target.dataset.userId });
      }
      if (action === "open-admin-user-tab") {
        Router.go("admin", { section: "users", role: target.dataset.role, userId: target.dataset.userId, tab: target.dataset.tab });
      }
      if (action === "audit-user-funds") {
        Actions.auditUserFunds(target.dataset.userId);
      }
      if (action === "manual-funds-save") {
        Actions.saveManualFunds(target);
      }
      if (action === "ban-user") {
        Actions.banUser(target.dataset.userId);
      }
      if (action === "unban-user") {
        Actions.unbanUser(target.dataset.userId);
      }
      if (action === "delete-user") {
        Actions.deleteUser(target.dataset.userId);
      }
      if (action === "admin-search-refresh") {
        App.render();
      }
      if (action === "clear-admin-logs") {
        Actions.clearAdminLogs();
      }
      if (action === "set-backup-email") {
        Actions.openBackupEmailSettings();
      }
      if (action === "run-retention-cleanup") {
        Actions.runRetentionCleanup();
      }
      if (action === "admin-add-content") {
        Actions.editItem(target.dataset.manageType);
      }
      if (action === "toggle-admin-batch") {
        Actions.toggleAdminBatch(target.dataset.manageType);
      }
      if (action === "toggle-admin-batch-item") {
        Actions.toggleAdminBatchItem(target.dataset.manageType, target.dataset.manageId);
      }
      if (action === "select-all-admin-batch") {
        Actions.selectAllAdminBatch();
      }
      if (action === "clear-admin-batch-selection") {
        Actions.clearAdminBatchSelection();
      }
      if (action === "delete-admin-batch-selected") {
        Actions.deleteAdminBatchSelected();
      }
      if (action === "open-staff-section") {
        Router.go("staff", { section: target.dataset.section });
      }
      if (action === "order-status") {
        Actions.setOrderStatus(target.dataset.orderId, target.dataset.status);
      }
      if (action === "cancel-order") {
        Actions.cancelOrder(target.dataset.orderId);
      }
      if (action === "open-order-chat") {
        Actions.openOrderChat(target.dataset.orderId);
      }
      if (action === "export-data") {
        Actions.exportData();
      }
      if (action === "reset-content") {
        Actions.resetContent();
      }
      if (action === "clear-orders") {
        Actions.clearOrders();
      }
    },
    render() {
      Data.touchCurrentUser();
      const parsed = Router.parse();
      State.route = Router.resolve(parsed);
      if (State.route.name !== parsed.name || JSON.stringify(State.route.params) !== JSON.stringify(parsed.params)) {
        Router.go(State.route.name, State.route.params);
        return;
      }
      document.body.classList.remove("customer-mode", "staff-mode", "admin-mode");
      document.body.classList.add(`${State.mode}-mode`);
      document.documentElement.lang = Translation.selected();
      document.title = `${BrandName} - ${BrandTagline}`;
      Dom.searchInput.value = State.route.name === "search" ? State.route.params.q : "";
      UI.renderTopbar();
      UI.renderHero();
      UI.renderBreadcrumb();
      Views.render();
      Translation.localizeStaticUi(document.body);
      Translation.refresh();
      UI.hideMenu();
    }
  };

  App.init();
})();
