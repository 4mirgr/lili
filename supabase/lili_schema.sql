-- Lili Deutsch: isolated Supabase schema. Safe to run repeatedly.
-- This does not alter IntMed tables, policies, triggers, or user state.

create table if not exists public.lili_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lili_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.lili_profiles enable row level security;
alter table public.lili_user_state enable row level security;
revoke all on public.lili_profiles, public.lili_user_state from anon;
grant select, insert, update on public.lili_profiles, public.lili_user_state to authenticated;

drop policy if exists "lili profile own read" on public.lili_profiles;
drop policy if exists "lili profile own insert" on public.lili_profiles;
drop policy if exists "lili profile own update" on public.lili_profiles;
create policy "lili profile own read" on public.lili_profiles for select to authenticated using (user_id = auth.uid());
create policy "lili profile own insert" on public.lili_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "lili profile own update" on public.lili_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "lili state own read" on public.lili_user_state;
drop policy if exists "lili state own insert" on public.lili_user_state;
drop policy if exists "lili state own update" on public.lili_user_state;
create policy "lili state own read" on public.lili_user_state for select to authenticated using (user_id = auth.uid());
create policy "lili state own insert" on public.lili_user_state for insert to authenticated with check (user_id = auth.uid());
create policy "lili state own update" on public.lili_user_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_lili_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'app' = 'lili' then
    perform pg_advisory_xact_lock(74066351);
    if (select count(*) from public.lili_profiles) >= 5 then
      raise exception 'lili_account_limit_reached';
    end if;
    insert into public.lili_profiles(user_id, display_name)
    values(new.id, left(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), 80))
    on conflict(user_id) do nothing;
    insert into public.lili_user_state(user_id) values(new.id) on conflict(user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists on_lili_user_created on auth.users;
create trigger on_lili_user_created after insert on auth.users for each row execute procedure public.handle_lili_user();

create or replace function public.lili_save_state(expected_revision bigint, new_state jsonb)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security invoker set search_path = public
as $$
begin
  if jsonb_typeof(new_state) <> 'object' then raise exception 'state must be an object'; end if;
  return query update public.lili_user_state
    set state = new_state, revision = lili_user_state.revision + 1, updated_at = now()
    where user_id = auth.uid() and lili_user_state.revision = expected_revision
    returning lili_user_state.revision, lili_user_state.updated_at;
end;
$$;
revoke all on function public.lili_save_state(bigint, jsonb) from public;
grant execute on function public.lili_save_state(bigint, jsonb) to authenticated;

create or replace function public.lili_initialize_account(display_name_input text default '')
returns void language plpgsql security invoker set search_path = public
as $$
begin
  insert into public.lili_profiles(user_id, display_name)
  values(auth.uid(), left(trim(coalesce(display_name_input, '')), 80)) on conflict(user_id) do nothing;
  insert into public.lili_user_state(user_id) values(auth.uid()) on conflict(user_id) do nothing;
end;
$$;
revoke all on function public.lili_initialize_account(text) from public;
grant execute on function public.lili_initialize_account(text) to authenticated;
