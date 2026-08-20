-- Bereskan semua warning Supabase Security Advisor
-- Jalankan: npx prisma db execute --file ../supabase/keamanan.sql --schema prisma/schema.prisma (dari folder server)

-- ===== 1. RLS: ganti policy "always true" dengan syarat login =====
drop policy if exists belajar_select on public.belajar;
drop policy if exists belajar_insert on public.belajar;
drop policy if exists belajar_update on public.belajar;
create policy belajar_select on public.belajar for select using (auth.uid() is not null);
create policy belajar_insert on public.belajar for insert with check (auth.uid() is not null);
create policy belajar_update on public.belajar for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists profil_guru_select on public.profil_guru;
drop policy if exists profil_guru_insert on public.profil_guru;
drop policy if exists profil_guru_update on public.profil_guru;
create policy profil_guru_select on public.profil_guru for select using (auth.uid() is not null);
create policy profil_guru_insert on public.profil_guru for insert with check (auth.uid() is not null);
create policy profil_guru_update on public.profil_guru for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists orders_select on public.orders;
drop policy if exists orders_insert on public.orders;
create policy orders_select on public.orders for select using (auth.uid() is not null);
create policy orders_insert on public.orders for insert with check (auth.uid() is not null);

drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select using (auth.uid() is not null);

-- ===== 2. Fungsi: search_path tetap =====
create or replace function public.auto_confirm_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end $$;

-- ===== 3. SECURITY DEFINER: cabut akses publik =====
revoke execute on function public.auto_confirm_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_admin & peran_sendiri dipakai policy → hanya anon + authenticated, bukan public
revoke execute on function public.is_admin() from public;
revoke execute on function public.peran_sendiri() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.peran_sendiri() to anon, authenticated;

do $$ begin
  revoke execute on function public.buat_akun(text, text, text, text) from public, anon, authenticated;
exception when undefined_function then null;
end $$;

do $$ begin
  revoke execute on function public.foto_guru() from public;
  grant execute on function public.foto_guru() to anon, authenticated;
exception when undefined_function then null;
end $$;
