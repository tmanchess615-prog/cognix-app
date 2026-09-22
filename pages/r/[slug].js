-- ============================================================
--  COGNIX ROUTER DATABASE
--  Run in Supabase: SQL Editor > New query > paste all > Run
--  Safe to run more than once.
-- ============================================================

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,             -- the part after /r/, e.g. 'mamas-bakery'
  business_name text not null,
  google_review_url text not null,
  manager_phone text not null,           -- digits only: country code + number, e.g. 27821234567
  logo_url text,                         -- optional; referenced in the brief but not in the
                                          -- original table list, added here so nothing breaks
  created_at timestamptz not null default now()
);

create table if not exists public.private_reviews (
  id uuid primary key default gen_random_uuid(),
  client_slug text not null references public.clients(slug) on delete cascade,
  stars int not null check (stars between 1 and 5),
  feedback text,
  created_at timestamptz not null default now()
);

create index if not exists private_reviews_slug_idx
  on public.private_reviews (client_slug, created_at desc);

-- Row Level Security: the public anon key can do nothing except what is
-- explicitly allowed below. No login is used anywhere on this router page.
alter table public.clients enable row level security;
alter table public.private_reviews enable row level security;

-- Anyone may READ client routing data (business name, Google link, phone).
-- This is what lets the router page work with no login at all.
drop policy if exists "public can read clients" on public.clients;
create policy "public can read clients" on public.clients
  for select to anon
  using (true);

-- Anyone may SUBMIT a private review, but nobody using the public key can
-- ever read them back. You read them yourself in the Supabase Table Editor,
-- logged in as the project owner, which bypasses this policy entirely.
drop policy if exists "public can insert private reviews" on public.private_reviews;
create policy "public can insert private reviews" on public.private_reviews
  for insert to anon
  with check (true);

grant select on public.clients to anon;
grant insert on public.private_reviews to anon;

-- Add your first test client. Edit the values, then run just this line
-- again for each new client (or use Table Editor > clients > Insert row).
insert into public.clients (slug, business_name, google_review_url, manager_phone)
values ('demo', 'Cognix Demo Cafe', 'https://www.google.com/', '27821234567')
on conflict (slug) do nothing;
