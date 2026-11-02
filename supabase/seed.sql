-- BeautyFlow · datos de demostración (opcional, solo para desarrollo)
-- No ejecutar en producción.

insert into public.business_settings (
  owner_name, owner_profession, legal_name, tax_condition,
  phone, whatsapp, email, business_name, address, description,
  opening_hours, booking_rules, payment_options, notification_rules
) values (
  'Titular de Ejemplo', 'Esteticista', 'Razón Social de Ejemplo', 'Monotributista',
  '+54 11 0000-0000', '+54 9 11 0000-0000', 'contacto@ejemplo.com',
  'BeautyFlow Spa', 'Calle Ejemplo 123', 'Centro de estética y spa.',
  '{"lun-vie": {"desde": "09:00", "hasta": "19:00", "descanso": "13:00-14:00"}, "sab": {"desde": "09:00", "hasta": "14:00"}}',
  '{"sena_porcentaje": 30, "cancelacion_horas": 24, "reprogramacion_horas": 12}',
  '{"mercado_pago": true, "transferencia": true, "efectivo": true}',
  '{"whatsapp": true, "email": true, "recordatorio_horas": 24}'
)
on conflict do nothing;

insert into public.services (name, duration_minutes, price) values
  ('Limpieza facial profunda', 60, 25000),
  ('Masaje descontracturante', 50, 30000),
  ('Depilación láser · piernas', 40, 35000),
  ('Manicura semipermanente', 60, 18000);

insert into public.professionals (name, specialty) values
  ('Profesional Uno', 'Cosmetología'),
  ('Profesional Dos', 'Masajes');

insert into public.clients (full_name, phone, email) values
  ('Cliente Demo Uno', '+54 9 11 1111-1111', 'cliente1@ejemplo.com'),
  ('Cliente Demo Dos', '+54 9 11 2222-2222', 'cliente2@ejemplo.com');
