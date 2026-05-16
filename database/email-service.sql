-- IMPULSE email service audit tables
-- Run this in Supabase Dashboard > SQL Editor when moving from JSON state to normalized tables.
-- AI: current prod stores these arrays in impulse_state JSON; migrate additively, never drop JSON data first.

create table if not exists public.email_verifications (
  id text primary key,
  email text not null,
  code_hash text not null,
  purpose text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index if not exists email_verifications_email_purpose_created_idx
  on public.email_verifications (email, purpose, created_at desc);

create index if not exists email_verifications_ip_created_idx
  on public.email_verifications (ip_hash, created_at desc);

create table if not exists public.email_logs (
  id text primary key,
  provider text not null,
  email_type text not null,
  recipient_hash text,
  subject text,
  status text not null,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_type_created_idx
  on public.email_logs (email_type, created_at desc);

create index if not exists email_logs_status_created_idx
  on public.email_logs (status, created_at desc);

alter table public.email_verifications enable row level security;
alter table public.email_logs enable row level security;

revoke all on table public.email_verifications from anon;
revoke all on table public.email_verifications from authenticated;
revoke all on table public.email_logs from anon;
revoke all on table public.email_logs from authenticated;

grant select, insert, update, delete on table public.email_verifications to service_role;
grant select, insert, update, delete on table public.email_logs to service_role;
