-- BeautyFlow · esquema inicial
-- Ejecutar en el SQL Editor de Supabase o con la CLI (supabase db push).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------
create type public.user_role as enum ('admin', 'receptionist', 'professional');
create type public.appointment_status as enum ('pendiente', 'confirmado', 'completado', 'cancelado');
create type public.payment_method as enum ('mercado_pago', 'transferencia', 'efectivo');
create type public.payment_status as enum ('pendiente', 'aprobado', 'rechazado', 'reintegrado');

-- ---------------------------------------------------------------
-- Perfiles de usuario (vinculados a Supabase Auth)
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'receptionist',
  created_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Funciones auxiliares de permisos
create or replace function public.current_role_name()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (select 1 from public.profiles where id = auth.uid())
$$;

-- ---------------------------------------------------------------
-- Configuración del centro (una fila)
-- Perfil profesional y datos fiscales separados: la titular puede
-- no coincidir con la razón social.
-- ---------------------------------------------------------------
create table public.business_settings (
  id uuid primary key default gen_random_uuid(),

  -- Perfil profesional
  owner_name text,
  owner_profession text,
  owner_license text,

  -- Datos fiscales
  legal_name text,
  cuit text check (cuit is null or cuit ~ '^\d{2}-\d{8}-\d$'),
  tax_condition text,

  -- Contacto
  phone text,
  whatsapp text,
  email text,

  -- Centro de estética
  business_name text,
  address text,
  description text,

  -- Identidad visual
  logo_url text,
  primary_color text default '#1F4638',
  secondary_color text default '#C7AD97',

  -- Horarios, reservas, pagos y notificaciones
  opening_hours jsonb not null default '{}'::jsonb,
  booking_rules jsonb not null default '{}'::jsonb,
  payment_options jsonb not null default '{}'::jsonb,
  notification_rules jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Catálogo y personas
-- ---------------------------------------------------------------
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  specialty text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(12, 2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Turnos y pagos
-- ---------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  professional_id uuid not null references public.professionals (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pendiente',
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index appointments_professional_time_idx
  on public.appointments (professional_id, starts_at);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  method public.payment_method not null,
  status public.payment_status not null default 'pendiente',
  is_deposit boolean not null default false,
  external_reference text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.business_settings enable row level security;
alter table public.professionals     enable row level security;
alter table public.services          enable row level security;
alter table public.clients           enable row level security;
alter table public.appointments      enable row level security;
alter table public.payments          enable row level security;

-- Perfiles: cada usuario ve el suyo; el admin ve y edita todos.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Configuración (incluye CUIT y datos personales): solo admin.
create policy "settings_admin_all" on public.business_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Catálogo: lectura para el personal, escritura para admin.
create policy "professionals_staff_read" on public.professionals
  for select using (public.is_staff());
create policy "professionals_admin_write" on public.professionals
  for all using (public.is_admin()) with check (public.is_admin());

create policy "services_staff_read" on public.services
  for select using (public.is_staff());
create policy "services_admin_write" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- Clientes y turnos: admin y recepción gestionan; profesionales solo leen.
create policy "clients_staff_read" on public.clients
  for select using (public.is_staff());
create policy "clients_front_write" on public.clients
  for all using (public.current_role_name() in ('admin', 'receptionist'))
  with check (public.current_role_name() in ('admin', 'receptionist'));

create policy "appointments_staff_read" on public.appointments
  for select using (public.is_staff());
create policy "appointments_front_write" on public.appointments
  for all using (public.current_role_name() in ('admin', 'receptionist'))
  with check (public.current_role_name() in ('admin', 'receptionist'));

-- Pagos: solo admin y recepción.
create policy "payments_front_all" on public.payments
  for all using (public.current_role_name() in ('admin', 'receptionist'))
  with check (public.current_role_name() in ('admin', 'receptionist'));
