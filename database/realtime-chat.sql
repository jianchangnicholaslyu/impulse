create table if not exists public.messages (
  id text primary key,
  order_id text not null,
  sender_username text not null,
  sender_role text not null default 'system',
  message_type text not null default 'user_message' check (message_type in ('user_message', 'system', 'action_card')),
  content_type text not null default 'text' check (content_type in ('text', 'image', 'system', 'action_card')),
  body text not null default '',
  image_url text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  read_by jsonb not null default '[]'::jsonb,
  read_at jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_order_created_idx on public.messages(order_id, created_at);
create index if not exists messages_sender_idx on public.messages(sender_username);

create table if not exists public.message_presence (
  order_id text not null,
  username text not null,
  role text not null default 'customer',
  is_typing boolean not null default false,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (order_id, username)
);

create index if not exists message_presence_seen_idx on public.message_presence(order_id, updated_at desc);

alter table public.messages enable row level security;
alter table public.message_presence enable row level security;

revoke all on table public.messages from anon, authenticated;
revoke all on table public.message_presence from anon, authenticated;

grant select, insert, update, delete on table public.messages to service_role;
grant select, insert, update, delete on table public.message_presence to service_role;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.message_presence;
exception
  when duplicate_object then null;
end $$;
