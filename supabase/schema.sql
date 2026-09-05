-- Coach Vision database + private video storage
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  opponent text,
  game_date date not null default current_date,
  video_path text,
  video_name text,
  video_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  time_seconds numeric(12,3) not null default 0,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.events enable row level security;

create policy "profiles own row" on public.profiles for all to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "games own rows" on public.games for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "events own rows" on public.events for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Private bucket for game videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos','videos',false,5368709120,ARRAY['video/mp4','video/quicktime','video/webm','video/x-matroska'])
on conflict (id) do nothing;

-- Files are stored as user_id/game_id/filename.
create policy "video insert own folder" on storage.objects for insert to authenticated
with check (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "video select own folder" on storage.objects for select to authenticated
using (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "video update own folder" on storage.objects for update to authenticated
using (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "video delete own folder" on storage.objects for delete to authenticated
using (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);
