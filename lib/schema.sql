/**
 * Supabase Schema — Run this SQL in the Supabase SQL Editor
 * ──────────────────────────────────────────────────────────
 * Creates the campaigns and saved_campaigns tables with RLS policies.
 */

-- ─── Extensions ───────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Protocols table ──────────────────────────────────────────────────────────

create table if not exists protocols (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  trust_score integer not null default 50,
  vc_backers  text default '',
  red_flags   text default '',
  created_at  timestamptz default now()
);

-- ─── Campaigns table ──────────────────────────────────────────────────────────

create table if not exists campaigns (
  id                    uuid primary key default uuid_generate_v4(),
  title                 text not null,
  protocol_name_raw     text not null,
  protocol_id           uuid references protocols(id),
  type                  text not null check (type in ('bounty', 'infofi', 'onchain')),
  reward_usd            numeric not null default 0,
  entry_count           integer not null default 0,
  deadline              timestamptz not null,
  source_url            text not null unique,
  description           text default '',
  chain                 text default 'unknown',
  raw_ev                numeric,
  -- Dimension scores
  reward_score          integer not null default 0,
  effort_score          integer not null default 0,
  timing_score          integer not null default 0,
  founder_score         integer,
  effort_label          text check (effort_label in ('low', 'medium', 'high')),
  effort_reasoning      text default '',
  -- Final
  score                 integer not null default 0,
  status                text not null default 'held' check (status in ('published', 'held', 'unpublished')),
  score_overridden      boolean default false,
  needs_founder_review  boolean default false,
  -- Admin overrides
  effort_score_override integer,
  founder_score_override integer,
  admin_notes           text default '',
  -- Timestamps
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Index for feed queries
create index if not exists idx_campaigns_status_score on campaigns (status, score desc);
create index if not exists idx_campaigns_source_url  on campaigns (source_url);

-- ─── Saved campaigns table ───────────────────────────────────────────────────

create table if not exists saved_campaigns (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (user_id, campaign_id)
);

create index if not exists idx_saved_campaigns_user on saved_campaigns (user_id);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

-- Campaigns: anyone can read published campaigns
alter table campaigns enable row level security;

create policy "Public can read published campaigns"
  on campaigns for select
  using (status = 'published');

create policy "Service role can manage all campaigns"
  on campaigns for all
  using (true)
  with check (true);

-- Saved campaigns: users can manage their own saves
alter table saved_campaigns enable row level security;

create policy "Users can read their own saves"
  on saved_campaigns for select
  using (true);

create policy "Users can insert their own saves"
  on saved_campaigns for insert
  with check (true);

create policy "Users can delete their own saves"
  on saved_campaigns for delete
  using (true);

-- Protocols: anyone can read
alter table protocols enable row level security;

create policy "Public can read protocols"
  on protocols for select
  using (true);

-- ─── Realtime ─────────────────────────────────────────────────────────────────

-- Enable realtime for the campaigns table
alter publication supabase_realtime add table campaigns;
