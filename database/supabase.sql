-- IMPULSE Supabase state store
-- Run this in Supabase Dashboard > SQL Editor before setting Vercel env vars.

create table if not exists public.impulse_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.impulse_state is 'Persistent JSON state for the IMPULSE marketplace backend.';
comment on column public.impulse_state.id is 'State namespace, defaults to impulse:db.';
comment on column public.impulse_state.data is 'Sanitized application state: users, profiles, orders, products, chats, ledger, and logs.';

alter table public.impulse_state enable row level security;

revoke all on table public.impulse_state from anon;
revoke all on table public.impulse_state from authenticated;

grant select, insert, update, delete on table public.impulse_state to service_role;
