(() => {
  "use strict";

  const Keys = {
    users: "users",
    categories: "categories",
    games: "gameCategories",
    products: "products",
    orders: "orders",
    orderChats: "orderChats",
    profiles: "userProfiles",
    ledger: "ledger",
    adminLogs: "adminLogs",
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
    { id: "users", title: "用户", password: "yonghu", icon: "fa-solid fa-users", description: "顾客、员工账户、资金、封禁与注销管理。" },
    { id: "orders", title: "订单", password: "dingdan", icon: "fa-solid fa-receipt", description: "统一检索充值单、消费单与兑现单。" },
    { id: "ledger", title: "账本", password: "zhangben", icon: "fa-solid fa-chart-line", description: "实时资金流水与统计参考。" },
    { id: "logs", title: "日志", password: "rizhi", icon: "fa-solid fa-clipboard-list", description: "记录后台与关键业务操作。" }
  ];

  const Modes = {
    customer: "客户模式",
    staff: "员工模式",
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
  const UserIdPattern = /^\d{18}$/;
  const DefaultLanguage = "en";
  const LocalLanguageCodes = ["en", "zh-CN"];
  const LocalContentLanguageCodes = ["en", "zh-CN"];
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

  const VersionNamingPolicy = localizedPair(
    "IMPULSE versions use Semantic Versioning plus a short release name: vMAJOR.MINOR.PATCH · Release Name.",
    "IMPULSE 版本采用语义化版本号加短发布名：v主版本.次版本.修订版本 · 发布名称。"
  );

  const DevelopmentRecords = [
    {
      version: "v0.11.1",
      releasedAt: "2026-05-15",
      nameI18n: localizedPair("Checkout State Sync Hotfix", "下单状态同步热修复"),
      statusI18n: localizedPair("Current production build", "当前生产版本"),
      summaryI18n: localizedPair(
        "Fixes checkout failures when Vercel temporary storage does not yet have the customer's local profile and balance.",
        "修复 Vercel 临时存储未同步顾客本地资料和余额时导致的下单失败。"
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
        localizedPair("Added user info, account security, contact settings, staff application, and sign-out settings.", "新增用户信息、账户安全、联系设置、我要入职和退出登录设置。"),
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
        "Added point-based checkout, recharge options, auto-return, order chat, read state, and customer order actions.",
        "新增积分下单、充值档位、自动退单、订单聊天、已读状态与顾客订单操作。"
      ),
      itemsI18n: [
        localizedPair("Added 1:1 USD-to-points recharge options.", "新增美元与积分 1:1 的充值档位。"),
        localizedPair("Added customer-to-staff chat with text and image messages.", "新增顾客与员工之间可发送文字和图片的订单聊天。"),
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
        localizedPair("Added customer and staff user management views.", "新增顾客与员工用户管理视图。"),
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
        localizedPair("Added customer, staff, and admin visual modes.", "新增客户、员工和管理员三种视觉模式。"),
        localizedPair("Added categories, game sections, product rows, and detail modals.", "新增一级分类、游戏分区、商品行和详情弹窗。"),
        localizedPair("Added localStorage-backed seed data and management editing flows.", "新增 localStorage 种子数据和管理编辑流程。")
      ]
    }
  ];

  const CurrentRelease = DevelopmentRecords[0];

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
    "游戏服务商城": { "zh-TW": "遊戲服務商城", en: "Game Service Marketplace", fr: "Marché de services de jeu", ja: "ゲームサービスマーケット", ko: "게임 서비스 마켓", es: "Mercado de servicios de juego" },
    "IMPULSE 游戏服务商城的基础信息页。": { "zh-TW": "IMPULSE 遊戲服務商城的基礎資訊頁。", en: "Basic information for the IMPULSE game service marketplace.", fr: "Informations de base de la plateforme IMPULSE.", ja: "IMPULSE ゲームサービスマーケットの基本情報です。", ko: "IMPULSE 게임 서비스 마켓의 기본 정보입니다.", es: "Información básica del mercado de servicios de juego IMPULSE." },
    "关于 IMPULSE": { "zh-TW": "關於 IMPULSE", en: "About IMPULSE", fr: "À propos d'IMPULSE", ja: "IMPULSE について", ko: "IMPULSE 소개", es: "Acerca de IMPULSE" },
    "客户模式": { "zh-TW": "客戶模式", en: "Customer Mode", fr: "Mode client", ja: "顧客モード", ko: "고객 모드", es: "Modo cliente" },
    "员工模式": { "zh-TW": "員工模式", en: "Staff Mode", fr: "Mode employé", ja: "スタッフモード", ko: "직원 모드", es: "Modo empleado" },
    "管理模式": { "zh-TW": "管理模式", en: "Admin Mode", fr: "Mode admin", ja: "管理モード", ko: "관리자 모드", es: "Modo administrador" },
    "客户": { "zh-TW": "客戶", en: "Customer", fr: "Client", ja: "顧客", ko: "고객", es: "Cliente" },
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
    "当前版本": { "zh-TW": "目前版本", en: "Current Version", fr: "Version actuelle", ja: "現在のバージョン", ko: "현재 버전", es: "Versión actual" },
    "开发日志": { "zh-TW": "開發日誌", en: "Development Log", fr: "Journal de développement", ja: "開発ログ", ko: "개발 로그", es: "Registro de desarrollo" },
    "版本记录": { "zh-TW": "版本記錄", en: "Release History", fr: "Historique des versions", ja: "リリース履歴", ko: "릴리스 기록", es: "Historial de versiones" },
    "查看开发日志": { "zh-TW": "查看開發日誌", en: "View Development Log", fr: "Voir le journal", ja: "開発ログを見る", ko: "개발 로그 보기", es: "Ver registro" },
    "版本命名规范": { "zh-TW": "版本命名規範", en: "Version Naming", fr: "Nom des versions", ja: "バージョン命名", ko: "버전 명명", es: "Nomenclatura" },
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
    "我要入职": { "zh-TW": "我要入職", en: "Join as Staff", fr: "Rejoindre l'équipe", ja: "スタッフ応募", ko: "입사 신청", es: "Unirme al equipo" },
    "退出登录": { "zh-TW": "登出", en: "Sign Out", fr: "Déconnexion", ja: "ログアウト", ko: "로그아웃", es: "Cerrar sesión" },
    "确认退出登录？": { "zh-TW": "確認登出？", en: "Sign out?", fr: "Se déconnecter ?", ja: "ログアウトしますか？", ko: "로그아웃할까요?", es: "¿Cerrar sesión?" },
    "退出后将回到客户模式。": { "zh-TW": "登出後將回到客戶模式。", en: "After signing out, you will return to customer mode.", fr: "Après déconnexion, vous reviendrez au mode client.", ja: "ログアウト後は顧客モードに戻ります。", ko: "로그아웃하면 고객 모드로 돌아갑니다.", es: "Al cerrar sesión volverás al modo cliente." },
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
    "登录 IMPULSE": { "zh-TW": "登入 IMPULSE", en: "Sign In to IMPULSE", fr: "Connexion à IMPULSE", ja: "IMPULSE にログイン", ko: "IMPULSE 로그인", es: "Iniciar sesión en IMPULSE" },
    "注册 IMPULSE": { "zh-TW": "註冊 IMPULSE", en: "Register for IMPULSE", fr: "Inscription à IMPULSE", ja: "IMPULSE に登録", ko: "IMPULSE 가입", es: "Registrarse en IMPULSE" },
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
    "员工接单后即可打开聊天框。": { en: "The chat opens after a staff member accepts the order." },
    "无权查看": { en: "No Permission" },
    "只有订单顾客、接单员工或管理员可以打开聊天。": { en: "Only the customer, assigned staff, or admin can open this chat." },
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
    "举报员工": { en: "Report Staff" },
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
    "一键核对": { en: "One-Click Audit" },
    "一键清空日志": { en: "Clear Logs" },
    "今日概览": { en: "Today Overview" },
    "现有单目": { en: "Active Orders" },
    "已结单目": { en: "Completed Orders" },
    "预约单目": { en: "Reservations" },
    "个人日志": { en: "Personal Log" },
    "员工工作台": { en: "Staff Workspace" },
    "查看当前进行中的订单，跟进交付进度和沟通状态。": { en: "View active orders and follow delivery progress and communication status." },
    "复查历史完成订单，确认结算、评价与售后记录。": { en: "Review completed orders, settlement, ratings, and after-sales records." },
    "管理未来预约，确认服务时间、人员与客户备注。": { en: "Manage upcoming reservations, service time, staffing, and customer notes." },
    "记录本日工作进展、异常事项与交付备注。": { en: "Record today’s work progress, exceptions, and delivery notes." },
    "订单处理、预约跟进、结单记录与个人日志集中在一个工作视图里。": { en: "Order handling, reservation follow-up, completion records, and logs in one workspace." },
    "顾客": { en: "Customers" },
    "用户": { en: "Users" },
    "账本": { en: "Ledger" },
    "日志": { en: "Logs" },
    "顾客、员工账户、资金、封禁与注销管理。": { en: "Manage customer and staff accounts, funds, bans, and deletion." },
    "查看顾客账户、积分、订单与限制状态。": { en: "View customer accounts, points, orders, and restrictions." },
    "查看员工账户、积分、订单与兑现记录。": { en: "View staff accounts, points, orders, and payout records." },
    "查看顾客": { en: "View Customers" },
    "查看员工": { en: "View Staff" },
    "统一检索充值单、消费单与兑现单。": { en: "Search recharge, consumption, and payout orders in one place." },
    "实时资金流水与统计参考。": { en: "Real-time fund flows and statistical reference." },
    "记录后台与关键业务操作。": { en: "Record admin and key business actions." },
    "充值单": { en: "Recharge Orders" },
    "消费单": { en: "Consumption Orders" },
    "兑现单": { en: "Payout Orders" },
    "全部": { en: "All" },
    "用户ID": { en: "User ID" },
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
    "当前已回到客户模式。": { en: "You are back in customer mode." },
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
    "图像读取失败，请换一张图片。": { en: "Image reading failed. Please choose another image." },
    "头像图片不能大于 5MB。": { en: "Avatar image cannot exceed 5MB." },
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
    "提交入职申请": { en: "Submit Employment Application" },
    "申请方向": { en: "Application Direction" },
    "游戏经历与可服务项目": { en: "Game Experience and Services" },
    "联系邮箱或方式": { en: "Contact Email or Method" },
    "提交申请": { en: "Submit Application" },
    "入职申请已提交": { en: "Employment Application Submitted" },
    "管理员可在日志中查看记录。": { en: "Admins can view the record in logs." },
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
      description: "管理未来预约，确认服务时间、人员与客户备注。",
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
    adminOrderType: "all"
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
        node.addEventListener(key.slice(2).toLowerCase(), value);
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

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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
      pending: "加急待员工确认",
      accepted: "加急已接受",
      declined: "加急已拒绝",
      breached: "加急已违约",
      continue_requested: "员工申请继续完成",
      continued: "顾客已同意继续",
      continue_declined: "顾客拒绝继续"
    };
    return labels[rush.status] ? localizeStaticPhrase(labels[rush.status]) : "";
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
        expiresAt: Date.now() + 10 * 60 * 1000
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
    async send(to, subject, text, html = "") {
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
            html: html || this.htmlFromText(text)
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
      const subject = "Your IMPULSE verification code";
      const text = [
        `Your IMPULSE verification code is ${code}.`,
        "It expires in 10 minutes.",
        "If you did not request this code, you can ignore this email."
      ].join("\n");
      return this.send(to, subject, text);
    },
    sendEnglishEmail(to, subject, body) {
      return this.send(to, subject, body);
    }
  };

  const Backend = {
    endpoint: "/api/backend",
    bootstrapped: false,
    online: false,
    hydrating: false,
    syncTimer: null,
    managedKeys: new Set([Keys.users, Keys.profiles, Keys.categories, Keys.games, Keys.products, Keys.orders, Keys.orderChats, Keys.ledger, Keys.adminLogs]),
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
        ledger: Storage.get(Keys.ledger, []),
        adminLogs: Storage.get(Keys.adminLogs, [])
      };
    },
    hydrate(snapshot) {
      if (!snapshot || typeof snapshot !== "object") {
        return;
      }
      this.hydrating = true;
      try {
        if (Array.isArray(snapshot.users)) Storage.set(Keys.users, snapshot.users);
        if (Array.isArray(snapshot.profiles)) Storage.set(Keys.profiles, snapshot.profiles);
        if (Array.isArray(snapshot.categories)) Storage.set(Keys.categories, snapshot.categories);
        if (snapshot.games && typeof snapshot.games === "object") Storage.set(Keys.games, snapshot.games);
        if (snapshot.products && typeof snapshot.products === "object") Storage.set(Keys.products, snapshot.products);
        if (Array.isArray(snapshot.orders)) Storage.set(Keys.orders, snapshot.orders);
        if (snapshot.orderChats && typeof snapshot.orderChats === "object") Storage.set(Keys.orderChats, snapshot.orderChats);
        if (Array.isArray(snapshot.ledger)) Storage.set(Keys.ledger, snapshot.ledger);
        if (Array.isArray(snapshot.adminLogs)) Storage.set(Keys.adminLogs, snapshot.adminLogs);
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
        this.hydrate(result.snapshot);
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
        this.hydrate(result.snapshot);
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
        this.hydrate(result.snapshot);
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
      if (!Array.isArray(Storage.get(Keys.ledger, null))) {
        Storage.set(Keys.ledger, []);
      }
      if (!Array.isArray(Storage.get(Keys.adminLogs, null))) {
        Storage.set(Keys.adminLogs, []);
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
    },
    resetContent() {
      const seed = Seed.all();
      Storage.set(Keys.categories, seed.categories);
      Storage.set(Keys.games, seed.games);
      Storage.set(Keys.products, seed.products);
      Storage.set(Keys.dataVersion, 3);
      this.ensureProfiles();
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
      this.log("用户注册", `${user.username} 注册为${user.role === "staff" ? "员工" : "顾客"}`);
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
    chatMessages(orderId) {
      return this.chats()[orderId] || [];
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
      chats[orderId] = [...(chats[orderId] || []), entry].slice(-300);
      this.saveChats(chats);
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
    log(action, detail = "") {
      const actor = State.currentUser ? State.currentUser.username : "SYSTEM";
      const log = {
        id: createId("log"),
        action,
        detail,
        actor,
        createdAt: new Date().toISOString()
      };
      Storage.set(Keys.adminLogs, [log, ...this.adminLogs()].slice(0, 800));
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
      this.recordEnglishEmail(previousEmail, "IMPULSE email binding changed", "Your IMPULSE account email address has been changed. If this was not you, please contact support immediately.");
      this.recordEnglishEmail(normalizedEmail, "IMPULSE email binding confirmed", "Your IMPULSE account is now bound to this email address.");
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
      if (!profile || profile.deleted || profile.emailNotices?.[noticeKey] === false) {
        return null;
      }
      const user = this.findUser(profile.username);
      const to = normalizeEmail(profile.notificationEmail || userEmail(user));
      if (!isEmail(to)) {
        return null;
      }
      const notice = EmailNoticeTypes.find((item) => item.key === noticeKey);
      if (!notice) {
        return null;
      }
      const body = [
        `Hello ${profile.username},`,
        context.orderId ? `Order ID: ${context.orderId}.` : "",
        context.itemName ? `Item: ${context.itemName}.` : "",
        context.amount ? `Amount: ${context.amount}.` : "",
        "This is an IMPULSE account notification."
      ].filter(Boolean).join(" ");
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
          text: "加急期限已违约，顾客退单权限已恢复。"
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
        text: `顾客已支付 ${fee} 积分申请加急，要求 ${formatFullDate(deadlineAt)} 前结单。`
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
        text: accepted ? `员工已接受加急，结单期限为 ${formatFullDate(order.rush.deadlineAt)}。` : "员工已拒绝加急申请，加急费用已退回。"
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
        text: "员工申请继续完成违约加急订单，等待顾客确认。"
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
        text: accepted ? "顾客已同意员工继续完成订单。" : "顾客已拒绝员工继续完成申请。"
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
        refundReason: "顾客接单后退单",
        updatedAt: refundedAt
      }));
      this.addChatMessage(order.id, {
        sender: "SYSTEM",
        role: "system",
        type: "system",
        text: `顾客已退单，系统返还 ${refundAmount} 积分。`
      });
      this.log("顾客退单", `${order.id} 返还 ${refundAmount} 积分`);
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
        text: `顾客已向员工支付 ${tip} 积分小费。`
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
        text: "顾客已提交举报，管理员可在日志和订单记录中追踪。"
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
        text: `${settlementNote}：员工获得 ${staffPayout} 积分${customerRefund ? `，顾客退回 ${customerRefund} 积分` : ""}。`
      });
      this.log("订单结算", `${order.id} ${settlementNote}，员工 ${staffPayout}，顾客退款 ${customerRefund}`);
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
        users: this.users(),
        profiles: this.profiles(),
        categories: this.categories(),
        gameCategories: this.games(),
        products: this.products(),
        orders: this.orders(),
        orderChats: this.chats(),
        ledger: this.ledger(),
        adminLogs: this.adminLogs()
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
      UI.toast("已退出登录", "当前已回到客户模式。");
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
          if (parent.closest && parent.closest(".translate-engine, .notranslate, [translate='no']")) {
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
      if (["about", "terms", "privacy", "help"].includes(parts[0])) {
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
        form.appendChild(h("label", { className: "field" }, field.label, input));
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
        if (submitButton) {
          submitButton.disabled = true;
        }
        const result = await onSubmit(values);
        if (submitButton) {
          submitButton.disabled = false;
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
      return h("span", { className: `status-pill status-${status}` }, StatusLabels[status] || status);
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
          title: "员工工作台",
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
        const titles = { about: "关于我们", terms: "服务条款", privacy: "隐私政策", help: "帮助中心" };
        return {
          kicker: "IMPULSE",
          title: titles[route.params.page] || "站点信息",
          description: "IMPULSE 游戏服务商城的基础信息页。",
          stats: [
            ["分类", metrics.categories],
            ["分区", metrics.games],
            ["商品", metrics.products]
          ]
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
      clear(Dom.heroPanel);
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

  const Components = {
    card({ item, action, dataset = {}, buttonText }) {
      return h("article", {
        className: `card ${dataset.manageType === "game" ? "game-card" : ""}`,
        role: "button",
        tabIndex: "0",
        dataset: { action, ...dataset }
      },
        h("div", { className: "card-icon" }, icon(item.icon || "fa-solid fa-star")),
        h("div", {},
          h("h2", { text: localizedContent(item, "title") }),
          h("p", { text: localizedContent(item, "description", "暂无描述。") || "暂无描述。" }),
          localizedContent(item, "platform") ? h("div", { className: "tag-row" }, h("span", { className: "tag", text: localizedContent(item, "platform") })) : null
        ),
        h("div", { className: "card-footer" },
          h("span", { className: "tag", text: buttonText })
        )
      );
    },
    productRow({ product, game, category }) {
      return h("article", {
        className: "product-row",
        dataset: { manageType: "product", manageId: product.id, gameId: game.id }
      },
        h("div", {},
          h("h3", { className: "row-title", text: localizedContent(product, "title") }),
          h("div", { className: "row-meta" },
            h("span", { text: localizedContent(category, "title") }),
            h("span", { text: localizedContent(game, "title") }),
            localizedContent(product, "duration") ? h("span", { text: localizedContent(product, "duration") }) : null,
            localizedContent(product, "badge") ? h("span", { className: "tag", text: localizedContent(product, "badge") }) : null
          )
        ),
        h("div", { className: "price", text: formatPrice(product.price) }),
        h("button", { className: "button button-ghost button-small", type: "button", dataset: { action: "view-product", productId: product.id } },
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
            h("span", { text: formatPrice(order.price) }),
            h("span", { text: formatFullDate(order.createdAt) }),
            order.appointmentAt ? h("span", {}, localizeStaticPhrase("预约"), " ", formatFullDate(order.appointmentAt)) : null,
            order.autoCancelAt && order.status === "pending" ? h("span", {}, localizeStaticPhrase("超时无人接单自动退单"), " ", formatFullDate(order.autoCancelAt)) : null,
            order.acceptedAt ? h("span", {}, localizeStaticPhrase("接单时间"), " ", formatFullDate(order.acceptedAt)) : null,
            rushStatusLabel(order.rush) ? h("span", { className: "tag", text: rushStatusLabel(order.rush) }) : null,
            order.handledBy ? h("span", {}, localizeStaticPhrase("接单"), " ", h("span", { className: "notranslate", translate: "no", text: order.handledBy })) : null,
            order.refundedAt ? h("span", {}, localizeStaticPhrase("已退款"), " ", formatFullDate(order.refundedAt)) : null,
            order.returnRefundedAt ? h("span", {}, localizeStaticPhrase("退单退款"), " ", formatPrice(order.returnRefundAmount)) : null,
            order.settledAt ? h("span", {}, localizeStaticPhrase("已结算"), " ", formatFullDate(order.settledAt)) : null,
            canManage ? h("span", {}, localizeStaticPhrase("客户"), " ", h("span", { className: "notranslate", translate: "no", text: order.customerUsername })) : null,
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
      if (!categories.length) {
        return Components.empty("暂无分类。");
      }
      return h("div", { className: "grid" },
        categories.map((category) => Components.card({
          item: category,
          action: "open-category",
          buttonText: "查看分区",
          dataset: { categoryId: category.id, manageType: "category", manageId: category.id }
        }))
      );
    },
    category(categoryId) {
      const category = Data.category(categoryId);
      if (!category) {
        return Components.empty("分类不存在。");
      }
      const games = Data.games()[categoryId] || [];
      if (!games.length) {
        return Components.empty("暂无游戏分区。");
      }
      return h("div", { className: "grid grid-two" },
        games.map((game) => Components.card({
          item: game,
          action: "open-products",
          buttonText: "查看商品",
          dataset: { categoryId, gameId: game.id, manageType: "game", manageId: game.id }
        }))
      );
    },
    products(categoryId, gameId) {
      const category = Data.category(categoryId);
      const game = Data.game(categoryId, gameId);
      if (!category || !game) {
        return Components.empty("游戏分区不存在。");
      }
      const products = Data.products()[gameId] || [];
      if (!products.length) {
        return Components.empty("暂无商品。");
      }
      return h("div", { className: "product-list" },
        products.map((product) => Components.productRow({ product, game, category }))
      );
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
                placeholder: "记录服务进展、客户备注或异常事项",
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
              title: "顾客",
              description: "查看顾客账户、积分、订单与限制状态。",
              titleI18n: localizedPair(staticPhraseIn("顾客", "en"), "顾客"),
              descriptionI18n: localizedPair(staticPhraseIn("查看顾客账户、积分、订单与限制状态。", "en"), "查看顾客账户、积分、订单与限制状态。"),
              icon: "fa-solid fa-user"
            },
            action: "open-admin-user-role",
            buttonText: "查看顾客",
            dataset: { role: "customer" }
          }),
          Components.card({
            item: {
              title: "员工",
              description: "查看员工账户、积分、订单与兑现记录。",
              titleI18n: localizedPair(staticPhraseIn("员工", "en"), "员工"),
              descriptionI18n: localizedPair(staticPhraseIn("查看员工账户、积分、订单与兑现记录。", "en"), "查看员工账户、积分、订单与兑现记录。"),
              icon: "fa-solid fa-user-tie"
            },
            action: "open-admin-user-role",
            buttonText: "查看员工",
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
            h("span", { text: formatPrice(item.funds) }),
            h("span", { text: userStatus(item) })
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
        h("div", { className: "tabs" },
          tabs.map(([key, label]) => h("button", { className: `tab ${tab === key ? "active" : ""}`, type: "button", dataset: { action: "open-admin-user-tab", role: profile.role, userId: profile.id, tab: key } }, label))
        ),
        this.adminUserTab(profile, tab)
      );
    },
    adminUserTab(profile, tab) {
      if (tab === "recharge") {
        const rows = Data.ledger().filter((entry) => entry.userId === profile.id && entry.type === "recharge");
        return this.simpleTable(["单号", "充值项目", "充值积分", "充值金额", "充值时间"], rows.map((entry) => [
          entry.id,
          entry.itemName || entry.title,
          formatPrice(entry.amountPoints),
          `$${entry.amountMoney || 0}`,
          formatFullDate(entry.createdAt)
        ]));
      }
      if (tab === "cashout") {
        const rows = Data.ledger().filter((entry) => entry.userId === profile.id && entry.type === "cashout");
        return this.simpleTable(["单号", "兑现金额", "兑现时间"], rows.map((entry) => [
          entry.id,
          `¥${entry.amountMoney || Math.abs(entry.amountPoints || 0)}`,
          formatFullDate(entry.createdAt)
        ]));
      }
      if (tab === "orders") {
        const rows = Data.orders().filter((order) => profile.role === "staff" ? order.handledBy === profile.username : order.customerUsername === profile.username);
        return this.simpleTable(["单号", "订单名称", "订单金额", "下单时间", "结单时间"], rows.map((order) => [
          order.id,
          localizedOrderContent(order, "productTitle"),
          formatPrice(order.price),
          formatFullDate(order.createdAt),
          order.completedAt ? formatFullDate(order.completedAt) : "未结单"
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
      return h("div", { className: "admin-table simple-table" },
        h("div", { className: "admin-table-head", style: `grid-template-columns: repeat(${headers.length}, minmax(140px, 1fr));` }, headers.map((item) => h("span", { text: item }))),
        rows.length ? rows.map((row) => h("div", { className: "admin-table-row", style: `grid-template-columns: repeat(${headers.length}, minmax(140px, 1fr));` }, row.map((item) => h("span", { text: item })))) : h("div", { className: "admin-empty-row", text: "暂无记录。" })
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
          formatPrice(record.amount),
          record.status,
          formatFullDate(record.createdAt),
          record.completedAt ? formatFullDate(record.completedAt) : "未结单",
          record.detail
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
          entry.amountPoints,
          entry.before,
          entry.after,
          entry.orderId || "-",
          entry.operator,
          formatFullDate(entry.createdAt)
        ]))
      );
    },
    adminLogs() {
      return h("section", { className: "panel" },
        h("div", { className: "row-actions" },
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
      const map = {
        about: ["关于 IMPULSE", "IMPULSE 专注游戏服务交易体验，当前版本使用本地数据模拟完整购物流程。"],
        terms: ["服务条款", "订单、预约、账号交易等信息在本地浏览器保存，正式上线前需接入后端与真实支付、担保和客服流程。"],
        privacy: ["隐私政策", "当前演示版不会上传数据，用户、订单和商品数据仅存储在本机 localStorage。"],
        help: ["帮助中心", "普通用户可浏览、注册、下单和预约；员工账号可处理订单；管理员账号可维护内容与数据。"]
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
                ? `演示验证码：${backendResult.devCode}，10 分钟内有效。后端邮件服务未配置。`
                : `Demo code: ${backendResult.devCode}. Valid for 10 minutes. Backend email is not configured.`;
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
          Data.log("English email", `To: ${email} / Subject: Your IMPULSE verification code / Body: Your verification code is ${code}.`);
          if (result.ok) {
            codeHint.textContent = localizeStaticPhrase("验证码已发送，请查看邮箱。");
            UI.toast("验证码已发送", "验证码已发送，请查看邮箱。");
            return;
          }
          codeHint.textContent = contentLanguage() === "zh-CN"
            ? `演示验证码：${code}，10 分钟内有效。邮件接口未配置或暂不可用。`
            : `Demo code: ${code}. Valid for 10 minutes. Email endpoint is not configured or is temporarily unavailable.`;
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
          if (submitButton) {
            submitButton.disabled = true;
          }
          const result = await (isLogin
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
          if (submitButton) {
            submitButton.disabled = false;
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
          h("h2", { text: isLogin ? "登录 IMPULSE" : "注册 IMPULSE" }),
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
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("div", { className: "product-art" }, icon(product.icon || category.icon || "fa-solid fa-gamepad")),
          h("h2", { text: localizedContent(product, "title") }),
          h("p", { text: localizedContent(product, "description", "暂无详细描述。") || "暂无详细描述。" }),
          h("div", { className: "tag-row" },
            h("span", { className: "tag", text: localizedContent(category, "title") }),
            h("span", { className: "tag", text: localizedContent(game, "title") }),
            localizedContent(product, "duration") ? h("span", { className: "tag", text: localizedContent(product, "duration") }) : null
          ),
          h("strong", { className: "detail-price", text: formatPrice(product.price) }),
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
        { name: "contact", label: "联系方式", type: "text", placeholder: "微信 / QQ / 手机号", required: true },
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
            contact: values.contact,
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
        { label: "我要入职", icon: "fa-solid fa-briefcase", action: () => this.openEmploymentSettings() },
        { label: "退出登录", icon: "fa-solid fa-right-from-bracket", destructive: true, action: () => UI.openConfirm("确认退出登录？", "退出后将回到客户模式。", () => Session.logout()) }
      ];
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "设置" }),
          h("p", { text: "管理账户资料、安全验证、通知邮箱与入职申请。" }),
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
          Data.log("English email", `To: ${email} / Subject: Your IMPULSE verification code / Body: Your verification code is ${code}.`);
          sendCodeButton.disabled = false;
          if (result.ok) {
            codeHint.textContent = localizeStaticPhrase("验证码已发送，请查看邮箱。");
            UI.toast("验证码已发送", "验证码已发送，请查看邮箱。");
            return;
          }
          codeHint.textContent = contentLanguage() === "zh-CN"
            ? `演示验证码：${code}，发送至原绑定邮箱 ${email}，10 分钟内有效。邮件接口未配置或暂不可用。`
            : `Demo code: ${code}. Sent to ${email}. Valid for 10 minutes. Email endpoint is not configured or is temporarily unavailable.`;
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
        const result = await this.verifyCurrentUserSecret(values.password, values.code);
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
        const formData = new FormData(form);
        const notificationEmail = normalizeEmail(formData.get("notificationEmail"));
        if (!isEmail(notificationEmail)) {
          message.textContent = "请输入有效通知邮箱。";
          return;
        }
        const emailNotices = Object.fromEntries(EmailNoticeTypes.map((notice) => [notice.key, formData.has(notice.key)]));
        Data.saveProfile({ ...profile, notificationEmail, emailNotices });
        Data.log("更新联系设置", profile.username);
        UI.closeModal();
        UI.toast("联系设置已保存", "邮件通知语言固定为英语。");
        App.render();
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
        title: "我要入职",
        fields: [
          { name: "targetRole", label: "申请方向", value: profile.employmentApplication?.targetRole || "陪玩/代打员工", required: true },
          { name: "contact", label: "联系邮箱或方式", value: profile.employmentApplication?.contact || profile.notificationEmail || "", required: true },
          { name: "experience", label: "游戏经历与可服务项目", type: "textarea", value: profile.employmentApplication?.experience || "", required: true }
        ],
        submitLabel: "提交申请",
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
          Data.log("提交入职申请", `${profile.username} ${application.targetRole}`);
          UI.toast("入职申请已提交", "管理员可在日志中查看记录。");
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
        UI.toast("尚未有人接单", "员工接单后即可打开聊天框。");
        return;
      }
      const isCustomer = State.currentUser?.username === order.customerUsername;
      const isStaff = State.currentUser?.username === order.handledBy;
      const isAdmin = State.currentUser?.role === "admin";
      if (!isCustomer && !isStaff && !isAdmin) {
        UI.toast("无权查看", "只有订单顾客、接单员工或管理员可以打开聊天。");
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
            h("strong", {}, label, " ", h("span", { className: "notranslate", translate: "no", text: profile?.username || "未分配" })),
            h("small", { text: online ? "在线" : profile?.lastOnlineAt ? `离线 · 最后在线 ${formatDate(profile.lastOnlineAt)}` : "离线" })
          )
        );
      };
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
          makeTool("举报", "fa-solid fa-shield-halved", Boolean(order.handledBy), "员工接单后才可以举报。", () => this.openReportForm(order.id)),
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

      const messageNodes = messages.length ? messages.map((message) => {
        if (message.type === "system") {
          return h("div", { className: "chat-message system" }, h("span", { text: message.text }), h("small", { text: formatFullDate(message.createdAt) }));
        }
        const own = normalize(message.sender) === normalize(currentUsername);
        const readBy = Array.isArray(message.readBy) ? message.readBy : [];
        const counterpartRead = counterpartUsername && readBy.some((item) => normalize(item) === normalize(counterpartUsername));
        return h("div", { className: `chat-message ${own ? "own" : ""}` },
          h("div", { className: "chat-message-meta" },
            h("strong", { className: "notranslate", translate: "no", text: message.sender }),
            h("small", { text: formatFullDate(message.createdAt) })
          ),
          message.text ? h("p", { text: message.text }) : null,
          message.imageData ? h("img", { className: "chat-image", src: message.imageData, alt: "聊天图片" }) : null,
          own && counterpartUsername ? h("div", { className: `read-state ${counterpartRead ? "read" : "unread"}` }, counterpartRead ? "已读" : "未读") : null
        );
      }) : [h("div", { className: "chat-empty", text: "暂无消息。" })];

      const textInput = h("input", { type: "text", name: "message", placeholder: "输入消息" });
      const fileInput = h("input", { type: "file", name: "image", accept: "image/*" });
      const form = h("form", { className: "chat-compose" },
        textInput,
        h("label", { className: "image-picker" }, icon("fa-regular fa-image"), "图片", fileInput),
        h("button", { className: "button button-primary button-small", type: "submit" }, "发送")
      );
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = textInput.value.trim();
        const file = fileInput.files?.[0];
        if (!text && !file) {
          UI.toast("请输入内容", "可以发送文字或图片。");
          return;
        }
        const send = async (imageData = "") => {
          const messagePayload = {
            type: imageData ? "image" : "text",
            text,
            imageData
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
        if (!file) {
          send();
          return;
        }
        if (!file.type.startsWith("image/")) {
          UI.toast("图片格式不支持", "请选择图片文件。");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => send(String(reader.result || ""));
        reader.readAsDataURL(file);
      });

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
              participantCard("顾客", customerProfile),
              participantCard("员工", staffProfile)
            )
          ),
          order.rush ? h("p", { className: "balance-note", text: `${rushStatusLabel(order.rush)}${order.rush.deadlineAt ? ` / 期限：${formatFullDate(order.rush.deadlineAt)}` : ""}` }) : null,
          h("div", { className: "chat-shell" },
            h("aside", { className: "chat-sidebar" },
              h("h3", { text: "操作" }),
              tools.length ? tools : h("p", { text: "暂无可用操作。" })
            ),
            h("section", { className: "chat-panel" },
              h("div", { className: "chat-messages" }, messageNodes),
              form
            )
          )
        )
      );
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
          UI.toast("加急已提交", "等待员工确认。");
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
        title: "举报员工",
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
          UI.toast("小费已支付", contentLanguage() === "zh-CN" ? `${formatPrice(amount)}已转给员工。` : `${formatPrice(amount)} sent to staff.`);
          window.setTimeout(() => this.openOrderChat(orderId), 0);
          return null;
        }
      });
    },
    respondRush(orderId, accepted) {
      UI.openConfirm(accepted ? "接受加急？" : "拒绝加急？", accepted ? "接受后需要在顾客规定期限内结单。" : "拒绝后加急费用会退回顾客。", () => {
        const result = Data.respondRush(orderId, accepted);
        UI.toast(result.ok ? "加急状态已更新" : "操作失败");
        this.openOrderChat(orderId);
      });
    },
    requestContinue(orderId) {
      UI.openConfirm("申请继续完成？", "顾客同意后，违约订单结单时员工可额外获得原费用的 50%。", () => {
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
      const modeLabel = localizeStaticPhrase(Modes[State.mode] || "客户模式");
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
    openCurrentVersion() {
      const release = CurrentRelease;
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("div", { className: "release-hero" },
            h("span", { className: "release-badge" }, icon("fa-solid fa-code-branch"), localizeStaticPhrase("当前发布")),
            h("h2", {}, h("span", { className: "notranslate", translate: "no", text: release.version }), " · ", localizedI18n(release.nameI18n)),
            h("p", { text: localizedI18n(release.summaryI18n) })
          ),
          h("div", { className: "release-meta-grid" },
            this.releaseMeta(localizeStaticPhrase("版本号"), release.version, true),
            this.releaseMeta(localizeStaticPhrase("版本名称"), localizedI18n(release.nameI18n)),
            this.releaseMeta(localizeStaticPhrase("发布时间"), release.releasedAt, true),
            this.releaseMeta(localizeStaticPhrase("上传状态"), localizedI18n(release.statusI18n))
          ),
          h("section", { className: "release-section" },
            h("h3", { text: localizeStaticPhrase("版本命名规范") }),
            h("p", { text: localizedI18n(VersionNamingPolicy) })
          ),
          h("section", { className: "release-section" },
            h("h3", { text: localizeStaticPhrase("本次更新") }),
            h("ul", { className: "release-bullets" },
              release.itemsI18n.map((item) => h("li", { text: localizedI18n(item) }))
            )
          ),
          State.currentUser?.role === "admin" ? h("div", { className: "modal-actions" },
            h("button", { className: "button button-primary", type: "button", onClick: () => this.openDevelopmentLog() }, icon("fa-solid fa-clock-rotate-left"), "查看开发日志")
          ) : null
        )
      );
    },
    openDevelopmentLog() {
      UI.openModal(
        h("div", { className: "modal-card modal-wide slide-up" },
          h("button", { className: "icon-button square modal-close", type: "button", dataset: { action: "close-modal" }, ariaLabel: "关闭" }, icon("fa-solid fa-xmark")),
          h("h2", { text: "开发日志" }),
          h("p", { text: localizedI18n(VersionNamingPolicy) }),
          h("div", { className: "release-list" },
            DevelopmentRecords.map((release, index) => h("article", { className: `release-card ${index === 0 ? "current" : ""}` },
              h("div", { className: "release-card-head" },
                h("strong", { className: "notranslate", translate: "no", text: release.version }),
                h("span", { className: "tag", text: localizedI18n(release.statusI18n) })
              ),
              h("h3", { text: localizedI18n(release.nameI18n) }),
              h("p", { text: localizedI18n(release.summaryI18n) }),
              h("div", { className: "release-date" }, localizeStaticPhrase("发布时间"), "：", h("span", { className: "notranslate", translate: "no", text: release.releasedAt })),
              h("ul", { className: "release-bullets" },
                release.itemsI18n.map((item) => h("li", { text: localizedI18n(item) }))
              )
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
          h("p", { text: "选择语言后，英文和简体中文使用本地翻译；其他语言会尝试使用内嵌 Google Translate。" }),
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
        UI.toast("无法结单", "订单需要先由员工接单。");
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
        UI.toast(result.ok ? "订单已取消并退款" : "订单已取消", result.ok ? "积分已返还至顾客账户。" : "未找到可退款账户。");
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
          text: `${accepted?.handledBy || "员工"} 已接单，聊天功能已开启。`
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
        const item = id ? clone(Data.game(categoryId, id)) : { id: createId("game"), title: "", description: "", icon: "fa-solid fa-star", platform: "" };
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
              icon: values.icon.trim()
            });
            UI.toast("分区已保存");
            App.render();
          }
        });
      }

      if (type === "product") {
        const gameId = explicitGameId || State.route.params.gameId;
        const item = id ? clone(Data.product(gameId, id)) : { id: createId("product"), title: "", description: "", price: 0, duration: "", badge: "", icon: "fa-solid fa-gamepad" };
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

      Data.initialize();
      await Backend.bootstrap();
      Data.processAutoRefunds();
      Data.processRushBreaches();
      Session.load();
      this.bindEvents();
      Translation.init();
      window.setInterval(() => {
        Data.touchCurrentUser();
        if (Data.processAutoRefunds() || Data.processRushBreaches()) {
          this.render();
        }
      }, 30000);
      this.render();
    },
    bindEvents() {
      window.addEventListener("hashchange", () => this.render());
      window.addEventListener("focus", () => {
        if (Data.processAutoRefunds() || Data.processRushBreaches()) {
          this.render();
        }
      });
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && (Data.processAutoRefunds() || Data.processRushBreaches())) {
          this.render();
        }
      });

      Dom.searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        Router.go("search", { q: Dom.searchInput.value.trim() });
      });

      document.addEventListener("click", (event) => {
        if (!event.target.closest(".context-menu")) {
          UI.hideMenu();
        }
        const target = event.target.closest("[data-action]");
        if (!target) {
          return;
        }
        this.handleAction(target);
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
      document.title = `IMPULSE ${localizeStaticPhrase("游戏服务商城")}`;
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
