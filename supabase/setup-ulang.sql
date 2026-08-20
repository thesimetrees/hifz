-- SETUP ULANG TOTAL — hapus semua akun, pasang policy + trigger, buat akun baru
-- Jalankan via SQL Editor atau: npx prisma db execute --file ../supabase/setup-ulang.sql --schema prisma/schema.prisma

-- ===== 1. KOSONGKAN SEMUA DATA =====
delete from public.enrollments;
delete from public.orders;
delete from public.posts;
delete from public.products;
delete from public.programs;
delete from public.users;
delete from auth.users; -- cascade ke identities, sessions, refresh_tokens

-- tabel sinkron belajar & profil guru (bila sudah ada) ikut dikosongkan
do $$ begin
  delete from public.belajar;
  delete from public.profil_guru;
exception when undefined_table then null;
end $$;

-- ===== 2. FUNGSI BANTU =====
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from users where id = auth.uid()::text and peran = 'admin') $$;

create or replace function public.peran_sendiri() returns text
language sql stable security definer set search_path = public as
$$ select peran from users where id = auth.uid()::text $$;

-- ===== 3. TRIGGER: auto-konfirmasi email semua user baru =====
create or replace function public.auto_confirm_user() returns trigger
language plpgsql security definer as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end $$;

drop trigger if exists before_auth_user_created on auth.users;
create trigger before_auth_user_created
  before insert on auth.users
  for each row execute function public.auto_confirm_user();

-- ===== 4. TRIGGER: buat profil otomatis di public.users =====
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, nama, password, peran, "updatedAt")
  values (
    new.id::text, new.email,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    'supabase-auth', 'customer', now()
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== 5. RLS =====
alter table users enable row level security;
drop policy if exists users_select on users;
drop policy if exists users_insert on users;
drop policy if exists users_update on users;
create policy users_select on users for select
  using (id = auth.uid()::text or is_admin());
create policy users_insert on users for insert
  with check (is_admin() or (id = auth.uid()::text and peran in ('customer', 'pelamar')));
create policy users_update on users for update
  using (id = auth.uid()::text or is_admin())
  with check (
    is_admin()
    or (id = auth.uid()::text and (peran = peran_sendiri() or peran in ('customer', 'pelamar')))
  );

alter table programs enable row level security;
drop policy if exists programs_select on programs;
drop policy if exists programs_write on programs;
create policy programs_select on programs for select using (status = 'terbit' or is_admin());
create policy programs_write on programs for all using (is_admin()) with check (is_admin());

alter table products enable row level security;
drop policy if exists products_select on products;
drop policy if exists products_write on products;
create policy products_select on products for select using (aktif or is_admin());
create policy products_write on products for all using (is_admin()) with check (is_admin());

alter table posts enable row level security;
drop policy if exists posts_select on posts;
drop policy if exists posts_write on posts;
create policy posts_select on posts for select using (status = 'terbit' or is_admin());
create policy posts_write on posts for all using (is_admin()) with check (is_admin());

alter table orders enable row level security;
drop policy if exists orders_select on orders;
drop policy if exists orders_insert on orders;
drop policy if exists orders_update on orders;
create policy orders_select on orders for select using (true);
create policy orders_insert on orders for insert with check (true);
create policy orders_update on orders for update using (is_admin()) with check (is_admin());

alter table enrollments enable row level security;
drop policy if exists enrollments_select on enrollments;
drop policy if exists enrollments_write on enrollments;
create policy enrollments_select on enrollments for select using (true);
create policy enrollments_write on enrollments for all using (is_admin()) with check (is_admin());

-- ===== 6. BUAT AKUN ADMIN SAJA =====
create or replace function public.buat_akun(p_email text, p_password text, p_nama text, p_peran text)
returns void language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = p_email) then return; end if;
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nama', p_nama), now(), now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );
  update public.users set nama = p_nama, peran = p_peran where id = uid::text;
end $$;

select public.buat_akun('admin@hifz.id', 'Admin#2045', 'Admin Hifz', 'admin');

drop function public.buat_akun(text, text, text, text);
