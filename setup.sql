-- AromaIQ - setup minimal pentru sincronizarea stării aplicației
-- Rulează acest fișier în Supabase > SQL Editor.
--
-- IMPORTANT:
-- Politicile de mai jos sunt potrivite DOAR pentru un pilot controlat.
-- Pentru producție, folosește Supabase Auth și politici RLS pe organizație / locație.

create table if not exists public.aromaiq_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.aromaiq_state enable row level security;

drop policy if exists "pilot_read_aromaiq_state" on public.aromaiq_state;
drop policy if exists "pilot_write_aromaiq_state" on public.aromaiq_state;

create policy "pilot_read_aromaiq_state"
on public.aromaiq_state
for select
to anon, authenticated
using (true);

create policy "pilot_write_aromaiq_state"
on public.aromaiq_state
for all
to anon, authenticated
using (true)
with check (true);

insert into public.aromaiq_state (id, payload)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;
