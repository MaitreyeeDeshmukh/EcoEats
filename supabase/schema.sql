-- ============================================================
-- EcoEats Campus Food Rescue — Supabase Schema
-- Run in Supabase Dashboard → SQL Editor → New query
-- NOTE: Run drop_old_tables.sql first if migrating from delivery app
-- ============================================================

-- Drop old delivery app tables if they exist
drop table if exists public.reviews cascade;
drop table if exists public.orders cascade;
drop table if exists public.menu_items cascade;
drop table if exists public.restaurants cascade;
drop table if exists public.eco_tips cascade;
drop table if exists public.claims cascade;
drop table if exists public.listings cascade;
drop table if exists public.users cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  avatar_url text,
  role text default 'student' check (role in ('organizer', 'student')),
  dietary_prefs text[] default '{}',
  impact_stats jsonb default '{"mealsRescued": 0, "co2Saved": 0, "pointsEarned": 0}',
  reputation_score integer default 100,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.users enable row level security;
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- ============================================================
-- LISTINGS
-- ============================================================
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references auth.users(id) on delete cascade not null,
  host_name text not null,
  host_building text,
  title text not null,
  description text,
  food_items text[] default '{}',
  quantity integer not null default 1,
  quantity_remaining integer not null default 1,
  dietary_tags text[] default '{}',
  image_url text,
  building_name text,
  room_number text,
  lat numeric,
  lng numeric,
  expiry_minutes integer default 90,
  expires_at timestamptz not null,
  posted_at timestamptz default now(),
  status text default 'active' check (status in ('active', 'claimed', 'expired', 'cancelled')),
  claimed_by uuid[] default '{}'
);

alter table public.listings enable row level security;
create policy "Anyone can read active listings" on public.listings for select using (true);
create policy "Organizers can insert listings" on public.listings for insert with check (auth.uid() = host_id);
create policy "Organizers can update own listings" on public.listings for update using (auth.uid() = host_id);

-- ============================================================
-- CLAIMS
-- ============================================================
create table public.claims (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  student_id uuid references auth.users(id) on delete cascade not null,
  student_name text not null,
  quantity integer not null default 1,
  claimed_at timestamptz default now(),
  picked_up_at timestamptz,
  status text default 'pending' check (status in ('pending', 'picked_up', 'no_show')),
  reservation_expires_at timestamptz not null,
  rating numeric check (rating >= 1 and rating <= 5)
);

alter table public.claims enable row level security;
create policy "Students can create own claims" on public.claims for insert with check (auth.uid() = student_id);
create policy "Students can read own claims" on public.claims for select using (auth.uid() = student_id);
create policy "Students can update own claims" on public.claims for update using (auth.uid() = student_id);
create policy "Listing hosts can read claims" on public.claims for select using (
  exists (select 1 from public.listings where id = listing_id and host_id = auth.uid())
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.listings (status, posted_at desc);
create index on public.listings (host_id, posted_at desc);
create index on public.claims (student_id, claimed_at desc);
create index on public.claims (listing_id, claimed_at desc);

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'EcoEats User'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Enable Realtime for listings and claims
-- ============================================================
alter publication supabase_realtime add table public.listings;
alter publication supabase_realtime add table public.claims;
