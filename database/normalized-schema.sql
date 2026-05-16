create table if not exists public.impulse_users (
  id text primary key,
  username text not null unique,
  email text not null unique,
  role text not null default 'customer',
  password_hash text,
  banned_until timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.impulse_profiles (
  user_id text primary key references public.impulse_users(id) on delete cascade,
  public_user_id text unique,
  display_name text,
  avatar_url text,
  level integer not null default 0,
  funds numeric(12,2) not null default 0,
  country_region text,
  birthday date,
  gender text,
  notification_email text,
  email_notice_settings jsonb not null default '{}'::jsonb,
  last_online_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.impulse_categories (
  id text primary key,
  title_i18n jsonb not null default '{}'::jsonb,
  description_i18n jsonb not null default '{}'::jsonb,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.impulse_game_sections (
  id text primary key,
  category_id text not null references public.impulse_categories(id) on delete cascade,
  title_i18n jsonb not null default '{}'::jsonb,
  description_i18n jsonb not null default '{}'::jsonb,
  platform_i18n jsonb not null default '{}'::jsonb,
  icon text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.impulse_products (
  id text primary key,
  game_section_id text not null references public.impulse_game_sections(id) on delete cascade,
  title_i18n jsonb not null default '{}'::jsonb,
  description_i18n jsonb not null default '{}'::jsonb,
  duration_i18n jsonb not null default '{}'::jsonb,
  badge_i18n jsonb not null default '{}'::jsonb,
  icon text,
  image_url text,
  price numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.impulse_orders (
  id text primary key,
  type text not null default 'order',
  status text not null default 'pending',
  customer_user_id text references public.impulse_users(id),
  staff_user_id text references public.impulse_users(id),
  product_id text references public.impulse_products(id),
  title text not null,
  price numeric(12,2) not null default 0,
  contact text,
  note text,
  auto_cancel_after_minutes integer,
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  settlement jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.impulse_order_messages (
  id text primary key,
  order_id text not null references public.impulse_orders(id) on delete cascade,
  sender_user_id text references public.impulse_users(id),
  sender_role text,
  body text,
  image_url text,
  read_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.impulse_ledger_entries (
  id text primary key,
  user_id text references public.impulse_users(id),
  order_id text references public.impulse_orders(id),
  type text not null,
  amount_points numeric(12,2) not null default 0,
  amount_money numeric(12,2) not null default 0,
  balance_before numeric(12,2),
  balance_after numeric(12,2),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.impulse_admin_logs (
  id text primary key,
  actor_user_id text references public.impulse_users(id),
  action text not null,
  detail text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.impulse_assets (
  id text primary key,
  owner_user_id text references public.impulse_users(id),
  scope text not null,
  bucket text not null,
  object_path text not null,
  public_url text,
  mime_type text,
  size_bytes integer,
  created_at timestamptz not null default now()
);

alter table public.impulse_users enable row level security;
alter table public.impulse_profiles enable row level security;
alter table public.impulse_categories enable row level security;
alter table public.impulse_game_sections enable row level security;
alter table public.impulse_products enable row level security;
alter table public.impulse_orders enable row level security;
alter table public.impulse_order_messages enable row level security;
alter table public.impulse_ledger_entries enable row level security;
alter table public.impulse_admin_logs enable row level security;
alter table public.impulse_assets enable row level security;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
