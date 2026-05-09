create extension if not exists pgcrypto;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text unique not null,
  plan text not null default 'free',
  billing_cycle text,
  status text not null default 'inactive',
  paypal_subscription_id text unique,
  paypal_plan_id text,
  paypal_status text,
  paypal_payer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions
add column if not exists user_id uuid;

alter table subscriptions
add column if not exists billing_cycle text;

alter table subscriptions
add column if not exists paypal_subscription_id text;

alter table subscriptions
add column if not exists paypal_plan_id text;

alter table subscriptions
add column if not exists paypal_status text;

alter table subscriptions
add column if not exists paypal_payer_id text;

alter table subscriptions
add column if not exists current_period_start timestamptz;

alter table subscriptions
add column if not exists current_period_end timestamptz;

alter table subscriptions
add column if not exists cancel_at_period_end boolean not null default false;

alter table subscriptions
add column if not exists updated_at timestamptz not null default now();

alter table subscriptions
add column if not exists billing_provider text not null default 'paypal';

alter table subscriptions
add column if not exists billing_mode text not null default 'paypal_subscriptions';

alter table subscriptions
add column if not exists paypal_payment_token_id text;

alter table subscriptions
add column if not exists paypal_order_id text;

alter table subscriptions
add column if not exists paypal_capture_id text;

alter table subscriptions
add column if not exists next_renewal_at timestamptz;

alter table subscriptions
add column if not exists last_renewal_at timestamptz;

alter table subscriptions
add column if not exists renewal_attempt_count integer not null default 0;

alter table subscriptions
add column if not exists cancelled_at timestamptz;

create unique index if not exists subscriptions_user_id_unique
on subscriptions(user_id);

create unique index if not exists subscriptions_paypal_subscription_id_unique
on subscriptions(paypal_subscription_id);

create index if not exists subscriptions_plan_status_idx
on subscriptions(plan, status);

create index if not exists subscriptions_billing_mode_idx
on subscriptions(billing_mode);

create index if not exists subscriptions_next_renewal_idx
on subscriptions(next_renewal_at);

create index if not exists subscriptions_paypal_payment_token_idx
on subscriptions(paypal_payment_token_id);

create table if not exists learner_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  subject text not null default 'math',
  audience text not null default 'student',
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists learner_sessions (
  id uuid primary key default gen_random_uuid(),
  email text,
  mode text,
  level text,
  prompt text not null,
  response text,
  created_at timestamptz not null default now(),
  ip_address text,
  user_id uuid,
  conversation_id uuid,
  subject text not null default 'math',
  turn_index integer
);

create table if not exists learner_mistakes (
  id uuid primary key default gen_random_uuid(),
  email text,
  topic text,
  mistake_type text,
  example text,
  created_at timestamptz not null default now()
);

create table if not exists mastery_scores (
  id uuid primary key default gen_random_uuid(),
  email text,
  topic text not null,
  score numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (email, topic)
);

create table if not exists beta_signups (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique not null,
  goal text,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists paypal_webhook_events (
  id uuid primary key default gen_random_uuid(),
  paypal_event_id text unique not null,
  event_type text not null,
  paypal_resource_id text,
  payload jsonb not null,
  processing_status text not null default 'received',
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists paypal_expanded_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  paypal_order_id text unique not null,
  paypal_capture_id text,
  paypal_payment_token_id text,
  plan text not null,
  billing_cycle text not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  status text not null default 'created',
  paypal_status text,
  raw_create_payload jsonb,
  raw_capture_payload jsonb,
  created_at timestamptz not null default now(),
  captured_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists paypal_payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  paypal_payment_token_id text unique not null,
  payment_source text not null default 'card',
  payer_id text,
  brand text,
  last_digits text,
  expiry_month text,
  expiry_year text,
  status text not null default 'active',
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  subscription_id uuid references subscriptions(id) on delete set null,
  provider text,
  event_type text not null,
  plan text,
  billing_cycle text,
  amount_cents integer,
  currency text not null default 'USD',
  status text not null default 'recorded',
  paypal_order_id text,
  paypal_capture_id text,
  paypal_payment_token_id text,
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table billing_events
add column if not exists user_id uuid;

alter table billing_events
add column if not exists email text;

alter table billing_events
add column if not exists subscription_id uuid references subscriptions(id) on delete set null;

alter table billing_events
add column if not exists provider text;

alter table billing_events
add column if not exists plan text;

alter table billing_events
add column if not exists billing_cycle text;

alter table billing_events
add column if not exists amount_cents integer;

alter table billing_events
add column if not exists currency text default 'USD';

alter table billing_events
add column if not exists paypal_order_id text;

alter table billing_events
add column if not exists paypal_capture_id text;

alter table billing_events
add column if not exists paypal_payment_token_id text;

alter table billing_events
add column if not exists error_message text;

alter table billing_events
add column if not exists metadata jsonb default '{}'::jsonb;

alter table beta_signups enable row level security;

alter table contact_messages enable row level security;

alter table paypal_webhook_events enable row level security;

alter table paypal_expanded_orders enable row level security;

alter table paypal_payment_methods enable row level security;

alter table billing_events enable row level security;

create index if not exists learner_conversations_subject_idx
on learner_conversations(subject);

create index if not exists learner_sessions_subject_idx
on learner_sessions(subject);

create index if not exists learner_conversations_user_subject_updated_idx
on learner_conversations(user_id, subject, updated_at desc);

create index if not exists learner_sessions_conversation_subject_idx
on learner_sessions(conversation_id, subject);

create index if not exists beta_signups_created_at_idx
on beta_signups(created_at desc);

create index if not exists beta_signups_email_idx
on beta_signups(email);

create index if not exists contact_messages_created_at_idx
on contact_messages(created_at desc);

create index if not exists contact_messages_email_idx
on contact_messages(email);

create index if not exists paypal_webhook_events_event_type_idx
on paypal_webhook_events(event_type);

create index if not exists paypal_webhook_events_resource_id_idx
on paypal_webhook_events(paypal_resource_id);

create index if not exists paypal_webhook_events_created_at_idx
on paypal_webhook_events(created_at desc);

create index if not exists paypal_expanded_orders_email_idx
on paypal_expanded_orders(email);

create index if not exists paypal_expanded_orders_user_id_idx
on paypal_expanded_orders(user_id);

create index if not exists paypal_expanded_orders_status_idx
on paypal_expanded_orders(status);

create index if not exists paypal_expanded_orders_payment_token_idx
on paypal_expanded_orders(paypal_payment_token_id);

create index if not exists paypal_payment_methods_email_idx
on paypal_payment_methods(email);

create index if not exists paypal_payment_methods_user_id_idx
on paypal_payment_methods(user_id);

create index if not exists paypal_payment_methods_status_idx
on paypal_payment_methods(status);

create index if not exists billing_events_email_idx
on billing_events(email);

create index if not exists billing_events_user_id_idx
on billing_events(user_id);

create index if not exists billing_events_subscription_id_idx
on billing_events(subscription_id);

create index if not exists billing_events_provider_idx
on billing_events(provider);

create index if not exists billing_events_event_type_idx
on billing_events(event_type);

create index if not exists billing_events_created_at_idx
on billing_events(created_at desc);