-- Foto asli guru untuk publik — hanya nama & foto, tanpa data pribadi lain
-- Jalankan via SQL Editor Supabase (sekali saja)
create or replace function public.foto_guru()
returns table (nama text, foto text)
language sql stable security definer set search_path = public as
$$ select nama, foto from users where peran = 'tutor' and aktif $$;

grant execute on function public.foto_guru() to anon, authenticated;
