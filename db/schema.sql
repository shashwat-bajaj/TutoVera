create extension if not exists pgcrypto;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text unique not null,
  plan text not null default 'free',
  billing_cycle text,
  status text not null default 'inactive',
  billing_provider text not null default 'paypal',
  billing_mode text not null default 'manual',
  paypal_subscription_id text unique,
  paypal_plan_id text,
  paypal_status text,
  paypal_payer_id text,
  paypal_payment_token_id text,
  paypal_order_id text,
  paypal_capture_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_renewal_at timestamptz,
  last_renewal_at timestamptz,
  renewal_attempt_count integer not null default 0,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
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
add column if not exists billing_mode text not null default 'manual';

alter table subscriptions
alter column billing_mode set default 'manual';

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

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  username text,
  role text not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles
add column if not exists user_id uuid;

alter table profiles
add column if not exists email text;

alter table profiles
add column if not exists full_name text;

alter table profiles
add column if not exists username text;

alter table profiles
add column if not exists role text not null default 'student';

alter table profiles
add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_user_id_unique
on profiles(user_id);

create unique index if not exists profiles_email_unique
on profiles(email);

create index if not exists profiles_username_idx
on profiles(username);

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
  turn_index integer,
  has_image boolean not null default false,
  image_mime_type text,
  image_size_bytes integer,
  image_original_name text,
  image_plan text
);

alter table learner_sessions
add column if not exists user_id uuid;

alter table learner_sessions
add column if not exists conversation_id uuid;

alter table learner_sessions
add column if not exists subject text not null default 'math';

alter table learner_sessions
add column if not exists turn_index integer;

alter table learner_sessions
add column if not exists has_image boolean not null default false;

alter table learner_sessions
add column if not exists image_mime_type text;

alter table learner_sessions
add column if not exists image_size_bytes integer;

alter table learner_sessions
add column if not exists image_original_name text;

alter table learner_sessions
add column if not exists image_plan text;

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

create table if not exists learning_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  subject text not null default 'math',
  audience text not null default 'student',
  grade_level text,
  profile_summary text,
  common_mistakes text,
  weak_areas text,
  strengths text,
  preferred_style text,
  parent_guidance_notes text,
  last_observation text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subject, audience)
);

alter table learning_profiles
add column if not exists user_id uuid;

alter table learning_profiles
add column if not exists email text;

alter table learning_profiles
add column if not exists subject text not null default 'math';

alter table learning_profiles
add column if not exists audience text not null default 'student';

alter table learning_profiles
add column if not exists grade_level text;

alter table learning_profiles
add column if not exists profile_summary text;

alter table learning_profiles
add column if not exists common_mistakes text;

alter table learning_profiles
add column if not exists weak_areas text;

alter table learning_profiles
add column if not exists strengths text;

alter table learning_profiles
add column if not exists preferred_style text;

alter table learning_profiles
add column if not exists parent_guidance_notes text;

alter table learning_profiles
add column if not exists last_observation text;

alter table learning_profiles
add column if not exists is_enabled boolean not null default true;

alter table learning_profiles
add column if not exists updated_at timestamptz not null default now();

create unique index if not exists learning_profiles_user_subject_audience_unique
on learning_profiles(user_id, subject, audience);

create index if not exists learning_profiles_user_updated_idx
on learning_profiles(user_id, updated_at desc);

create index if not exists learning_profiles_email_updated_idx
on learning_profiles(email, updated_at desc);

create index if not exists learning_profiles_subject_audience_idx
on learning_profiles(subject, audience);

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

alter table paypal_expanded_orders
add column if not exists user_id uuid;

alter table paypal_expanded_orders
add column if not exists paypal_capture_id text;

alter table paypal_expanded_orders
add column if not exists paypal_payment_token_id text;

alter table paypal_expanded_orders
add column if not exists paypal_status text;

alter table paypal_expanded_orders
add column if not exists raw_create_payload jsonb;

alter table paypal_expanded_orders
add column if not exists raw_capture_payload jsonb;

alter table paypal_expanded_orders
add column if not exists captured_at timestamptz;

alter table paypal_expanded_orders
add column if not exists updated_at timestamptz not null default now();

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

alter table paypal_payment_methods
add column if not exists user_id uuid;

alter table paypal_payment_methods
add column if not exists payment_source text not null default 'card';

alter table paypal_payment_methods
add column if not exists payer_id text;

alter table paypal_payment_methods
add column if not exists brand text;

alter table paypal_payment_methods
add column if not exists last_digits text;

alter table paypal_payment_methods
add column if not exists expiry_month text;

alter table paypal_payment_methods
add column if not exists expiry_year text;

alter table paypal_payment_methods
add column if not exists status text not null default 'active';

alter table paypal_payment_methods
add column if not exists raw_payload jsonb;

alter table paypal_payment_methods
add column if not exists updated_at timestamptz not null default now();

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
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table billing_events
add column if not exists user_id uuid;

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
add column if not exists currency text not null default 'USD';

alter table billing_events
add column if not exists status text not null default 'recorded';

alter table billing_events
add column if not exists paypal_order_id text;

alter table billing_events
add column if not exists paypal_capture_id text;

alter table billing_events
add column if not exists paypal_payment_token_id text;

alter table billing_events
add column if not exists error_message text;

alter table billing_events
add column if not exists metadata jsonb;

create index if not exists learner_conversations_subject_idx
on learner_conversations(subject);

create index if not exists learner_sessions_subject_idx
on learner_sessions(subject);

create index if not exists learner_conversations_user_subject_updated_idx
on learner_conversations(user_id, subject, updated_at desc);

create index if not exists learner_sessions_conversation_subject_idx
on learner_sessions(conversation_id, subject);

create index if not exists learner_sessions_user_image_created_idx
on learner_sessions(user_id, has_image, created_at desc);

create index if not exists learner_sessions_email_image_created_idx
on learner_sessions(email, has_image, created_at desc);

create index if not exists learner_sessions_user_created_idx
on learner_sessions(user_id, created_at desc);

create index if not exists learner_sessions_email_created_idx
on learner_sessions(email, created_at desc);

create index if not exists learner_sessions_ip_created_idx
on learner_sessions(ip_address, created_at desc);

create index if not exists learner_sessions_conversation_turn_idx
on learner_sessions(conversation_id, turn_index);

create index if not exists beta_signups_created_idx
on beta_signups(created_at desc);

create index if not exists contact_messages_created_idx
on contact_messages(created_at desc);

create index if not exists paypal_webhook_events_event_type_idx
on paypal_webhook_events(event_type);

create index if not exists paypal_webhook_events_resource_idx
on paypal_webhook_events(paypal_resource_id);

create index if not exists paypal_webhook_events_created_idx
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

create index if not exists billing_events_email_created_idx
on billing_events(email, created_at desc);

create index if not exists billing_events_user_created_idx
on billing_events(user_id, created_at desc);

create index if not exists billing_events_subscription_created_idx
on billing_events(subscription_id, created_at desc);

create index if not exists billing_events_event_type_idx
on billing_events(event_type);

create index if not exists billing_events_paypal_order_idx
on billing_events(paypal_order_id);

create index if not exists billing_events_paypal_payment_token_idx
on billing_events(paypal_payment_token_id);