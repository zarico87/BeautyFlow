-- BeautyFlow · 002 · endurecimiento del esquema
-- Requiere 001_initial_schema.sql.

-- ---------------------------------------------------------------
-- 1) El primer usuario registrado pasa a ser administrador.
--    Los siguientes entran como recepcionista hasta que un admin cambie su rol.
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when exists (select 1 from public.profiles) then 'receptionist'::public.user_role
         else 'admin'::public.user_role end
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- 2) Cada usuario puede editar su nombre, pero nunca su propio rol.
-- ---------------------------------------------------------------
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------
-- 3) Configuración del centro: una sola fila y updated_at automático.
-- ---------------------------------------------------------------
create unique index business_settings_singleton on public.business_settings ((true));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger business_settings_set_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 4) Un profesional no puede tener dos turnos superpuestos
--    (los cancelados no cuentan). Evita dobles reservas aunque dos
--    personas reserven a la vez.
-- ---------------------------------------------------------------
create extension if not exists btree_gist;

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelado');

-- ---------------------------------------------------------------
-- 5) Índices de consulta frecuente.
-- ---------------------------------------------------------------
create index appointments_client_idx    on public.appointments (client_id);
create index appointments_starts_at_idx on public.appointments (starts_at);
create index payments_appointment_idx   on public.payments (appointment_id);
create index clients_name_idx           on public.clients (lower(full_name));
