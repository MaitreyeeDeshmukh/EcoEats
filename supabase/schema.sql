-- ============================================================
-- EcoEats Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  photo_url text,
  eco_score integer default 0,
  total_orders_count integer default 0,
  total_carbon_saved numeric default 0,
  saved_addresses text[] default '{}',
  favourite_restaurants uuid[] default '{}',
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ============================================================
-- RESTAURANTS
-- ============================================================
create table public.restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category text,
  cuisine_type text,
  tags text[] default '{}',
  address text,
  lat numeric,
  lng numeric,
  rating numeric default 0,
  review_count integer default 0,
  delivery_time_min integer default 30,
  delivery_fee numeric default 0,
  minimum_order numeric default 0,
  is_open boolean default true,
  is_eco_certified boolean default false,
  eco_rating numeric default 0,
  carbon_footprint_per_order numeric default 0,
  packaging_type text,
  image_url text,
  menu_categories text[] default '{}',
  created_at timestamptz default now()
);

alter table public.restaurants enable row level security;

create policy "Anyone can read restaurants"
  on public.restaurants for select
  using (true);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null,
  category text,
  image_url text,
  is_vegetarian boolean default false,
  is_vegan boolean default false,
  allergens text[] default '{}',
  carbon_footprint numeric default 0,
  eco_score integer default 0,
  is_available boolean default true,
  is_best_seller boolean default false,
  created_at timestamptz default now()
);

alter table public.menu_items enable row level security;

create policy "Anyone can read menu items"
  on public.menu_items for select
  using (true);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id),
  restaurant_name text,
  items jsonb not null default '[]',
  subtotal numeric not null,
  delivery_fee numeric default 0,
  taxes numeric default 0,
  total numeric not null,
  status text default 'pending' check (status in ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  delivery_address text,
  estimated_delivery_time integer,
  total_carbon_footprint numeric default 0,
  carbon_saved_vs_average numeric default 0,
  payment_method text default 'cod',
  payment_status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  user_photo_url text,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  order_id uuid references public.orders(id),
  rating numeric not null check (rating >= 1 and rating <= 5),
  comment text,
  eco_rating numeric,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

create policy "Users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ============================================================
-- ECO TIPS
-- ============================================================
create table public.eco_tips (
  id uuid default uuid_generate_v4() primary key,
  tip text not null,
  category text,
  impact text
);

alter table public.eco_tips enable row level security;

create policy "Anyone can read eco tips"
  on public.eco_tips for select
  using (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.orders (user_id, created_at desc);
create index on public.menu_items (restaurant_id, category);
create index on public.restaurants (category, eco_rating desc);
create index on public.reviews (restaurant_id, created_at desc);

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'EcoEats User'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
