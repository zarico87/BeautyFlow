-- BeautyFlow · 003 · Supabase Storage (logo e imágenes del centro)
-- Bucket público de lectura: las imágenes se muestran en la reserva online.
-- Solo un administrador puede subir, cambiar o borrar archivos.

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding_admin_insert" on storage.objects
  for insert with check (bucket_id = 'branding' and public.is_admin());

create policy "branding_admin_update" on storage.objects
  for update using (bucket_id = 'branding' and public.is_admin())
  with check (bucket_id = 'branding' and public.is_admin());

create policy "branding_admin_delete" on storage.objects
  for delete using (bucket_id = 'branding' and public.is_admin());
