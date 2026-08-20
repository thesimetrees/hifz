-- Tabel sinkronisasi belajar (absensi + penilaian guru + progres murid) — realtime
-- Jalankan sekali via Supabase SQL Editor

create table if not exists public.belajar (
  email text not null,
  program_id text not null,
  absen jsonb not null default '[]'::jsonb,
  nilai jsonb not null default '{}'::jsonb,
  selesai jsonb not null default '[]'::jsonb,
  terakhir timestamptz default now(),
  primary key (email, program_id)
);

alter table public.belajar enable row level security;

-- policy berbasis login (hindari warning "always true")
drop policy if exists belajar_select on public.belajar;
drop policy if exists belajar_insert on public.belajar;
drop policy if exists belajar_update on public.belajar;
create policy belajar_select on public.belajar for select using (auth.uid() is not null);
create policy belajar_insert on public.belajar for insert with check (auth.uid() is not null);
create policy belajar_update on public.belajar for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- aktifkan realtime
do $$ begin
  alter publication supabase_realtime add table public.belajar;
exception when duplicate_object then null;
end $$;

-- pilihan jadwal & pengingat ikut terekam
alter table public.belajar add column if not exists jadwal text;
alter table public.belajar add column if not exists ingatkan boolean default false;

-- profil guru (ditulis guru dari dashboard)
create table if not exists public.profil_guru (
  email text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.profil_guru enable row level security;
drop policy if exists profil_guru_select on public.profil_guru;
drop policy if exists profil_guru_insert on public.profil_guru;
drop policy if exists profil_guru_update on public.profil_guru;
create policy profil_guru_select on public.profil_guru for select using (auth.uid() is not null);
create policy profil_guru_insert on public.profil_guru for insert with check (auth.uid() is not null);
create policy profil_guru_update on public.profil_guru for update using (auth.uid() is not null) with check (auth.uid() is not null);
