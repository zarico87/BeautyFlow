-- BeautyFlow · 004 · datos públicos para la reserva online
-- El visitante (rol anon) NO accede a las tablas. Solo ve:
--   * servicios y profesionales activos (vistas con columnas limitadas)
--   * los horarios ocupados de un profesional, sin datos de clientes
-- Crear la reserva se hará desde una Edge Function con credenciales de servidor.

create view public.public_services as
  select id, name, duration_minutes, price
  from public.services
  where active;

create view public.public_professionals as
  select id, name, specialty
  from public.professionals
  where active;

create or replace function public.busy_slots(
  p_professional_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.starts_at, a.ends_at
  from public.appointments a
  where a.professional_id = p_professional_id
    and a.status <> 'cancelado'
    and a.starts_at < p_to
    and a.ends_at > p_from
    and p_to - p_from <= interval '62 days'
  order by a.starts_at
$$;

revoke all on function public.busy_slots(uuid, timestamptz, timestamptz) from public;
grant execute on function public.busy_slots(uuid, timestamptz, timestamptz) to anon, authenticated;

grant select on public.public_services, public.public_professionals to anon, authenticated;
