-- =========================================================
-- COACH VISION / VIDEOBALL
-- DATABASE SCHEMA
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- PROFILES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text;


-- =========================================================
-- TEAMS
-- =========================================================

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);


-- =========================================================
-- TEAM MEMBERS
-- =========================================================

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),

  team_id uuid not null
    references public.teams(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role text not null default 'analyst',

  created_at timestamptz not null default now(),

  unique(team_id, user_id),

  constraint team_member_role_check
    check (role in ('owner', 'coach', 'analyst', 'viewer'))
);


-- =========================================================
-- TEAM INVITES
-- =========================================================

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),

  team_id uuid not null
    references public.teams(id)
    on delete cascade,

  email text not null,

  invited_by uuid not null
    references auth.users(id)
    on delete cascade,

  accepted boolean not null default false,

  created_at timestamptz not null default now(),

  accepted_at timestamptz
);


-- =========================================================
-- GAMES
-- =========================================================

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  team_id uuid
    references public.teams(id)
    on delete set null,

  name text not null,

  opponent text,

  game_date date not null default current_date,

  video_path text,

  video_name text,

  video_size bigint,

  created_at timestamptz not null default now()
);

alter table public.games
  add column if not exists team_id uuid
  references public.teams(id)
  on delete set null;


-- =========================================================
-- EVENTS
-- =========================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),

  game_id uuid not null
    references public.games(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  time_seconds numeric(12,3) not null default 0,

  event_type text not null,

  note text,

  created_at timestamptz not null default now()
);


-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists teams_owner_id_idx
  on public.teams(owner_id);

create index if not exists team_members_team_id_idx
  on public.team_members(team_id);

create index if not exists team_members_user_id_idx
  on public.team_members(user_id);

create index if not exists team_invites_email_idx
  on public.team_invites(email);

create index if not exists games_team_id_idx
  on public.games(team_id);

create index if not exists games_user_id_idx
  on public.games(user_id);

create index if not exists events_game_id_idx
  on public.events(game_id);


-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;
alter table public.games enable row level security;
alter table public.events enable row level security;


-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

create or replace function public.is_team_member(
  requested_team_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = requested_team_id
      and user_id = auth.uid()
  );
$$;


create or replace function public.is_team_owner(
  requested_team_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.teams
    where id = requested_team_id
      and owner_id = auth.uid()
  );
$$;


-- =========================================================
-- PROFILES POLICIES
-- =========================================================

drop policy if exists "profiles own row"
on public.profiles;

create policy "profiles own row"
on public.profiles
for all
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);


-- =========================================================
-- TEAMS POLICIES
-- =========================================================

drop policy if exists "team members can view teams"
on public.teams;

create policy "team members can view teams"
on public.teams
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_team_member(id)
);


drop policy if exists "users can create teams"
on public.teams;

create policy "users can create teams"
on public.teams
for insert
to authenticated
with check (
  owner_id = auth.uid()
);


drop policy if exists "owners can update teams"
on public.teams;

create policy "owners can update teams"
on public.teams
for update
to authenticated
using (
  owner_id = auth.uid()
)
with check (
  owner_id = auth.uid()
);


drop policy if exists "owners can delete teams"
on public.teams;

create policy "owners can delete teams"
on public.teams
for delete
to authenticated
using (
  owner_id = auth.uid()
);


-- =========================================================
-- TEAM MEMBERS POLICIES
-- =========================================================

drop policy if exists "members can view team members"
on public.team_members;

create policy "members can view team members"
on public.team_members
for select
to authenticated
using (
  public.is_team_member(team_id)
  or public.is_team_owner(team_id)
);


drop policy if exists "owners can add team members"
on public.team_members;

create policy "owners can add team members"
on public.team_members
for insert
to authenticated
with check (
  public.is_team_owner(team_id)
  or user_id = auth.uid()
);


drop policy if exists "members can leave teams"
on public.team_members;

create policy "members can leave teams"
on public.team_members
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_team_owner(team_id)
);


-- =========================================================
-- TEAM INVITES POLICIES
-- =========================================================

drop policy if exists "owners can create invites"
on public.team_invites;

create policy "owners can create invites"
on public.team_invites
for insert
to authenticated
with check (
  public.is_team_owner(team_id)
  and invited_by = auth.uid()
);


drop policy if exists "users can view own invites"
on public.team_invites;

create policy "users can view own invites"
on public.team_invites
for select
to authenticated
using (
  lower(email) = lower(
    coalesce(
      (select email from auth.users where id = auth.uid()),
      ''
    )
  )
  or public.is_team_owner(team_id)
);


drop policy if exists "users can accept own invites"
on public.team_invites;

create policy "users can accept own invites"
on public.team_invites
for update
to authenticated
using (
  lower(email) = lower(
    coalesce(
      (select email from auth.users where id = auth.uid()),
      ''
    )
  )
)
with check (
  lower(email) = lower(
    coalesce(
      (select email from auth.users where id = auth.uid()),
      ''
    )
  )
);


-- =========================================================
-- GAMES POLICIES
-- =========================================================

drop policy if exists "games own rows"
on public.games;

create policy "games own rows"
on public.games
for all
to authenticated
using (
  user_id = auth.uid()
  or (
    team_id is not null
    and public.is_team_member(team_id)
  )
)
with check (
  user_id = auth.uid()
  or (
    team_id is not null
    and public.is_team_member(team_id)
  )
);


-- =========================================================
-- EVENTS POLICIES
-- =========================================================

drop policy if exists "events own rows"
on public.events;

create policy "events own rows"
on public.events
for all
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.games g
    where g.id = events.game_id
      and g.team_id is not null
      and public.is_team_member(g.team_id)
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.games g
    where g.id = events.game_id
      and g.team_id is not null
      and public.is_team_member(g.team_id)
  )
);


-- =========================================================
-- NEW USER PROFILE
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles(
    id,
    full_name,
    email
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      ''
    ),
    lower(new.email)
  )
  on conflict (id)
  do update set
    email = excluded.email;

  return new;

end;
$$;


drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();


-- =========================================================
-- VIDEO STORAGE
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'videos',
  'videos',
  false,
  5368709120,
  ARRAY[
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska'
  ]
)
on conflict (id)
do update set
  public = false,
  file_size_limit = 5368709120;


-- =========================================================
-- STORAGE POLICIES
-- =========================================================

drop policy if exists "video insert own folder"
on storage.objects;

drop policy if exists "video select own folder"
on storage.objects;

drop policy if exists "video update own folder"
on storage.objects;

drop policy if exists "video delete own folder"
on storage.objects;


create policy "video insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or
    (
      (storage.foldername(name))[1] = 'teams'
      and public.is_team_member(
        ((storage.foldername(name))[2])::uuid
      )
    )
  )
);


create policy "video select own folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or
    (
      (storage.foldername(name))[1] = 'teams'
      and public.is_team_member(
        ((storage.foldername(name))[2])::uuid
      )
    )
  )
);


create policy "video update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or
    (
      (storage.foldername(name))[1] = 'teams'
      and public.is_team_member(
        ((storage.foldername(name))[2])::uuid
      )
    )
  )
);


create policy "video delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'videos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or
    (
      (storage.foldername(name))[1] = 'teams'
      and public.is_team_member(
        ((storage.foldername(name))[2])::uuid
      )
    )
  )
);
