# BeautyFlow · Starter 0.2.0

Spa & Beauty Management System.

**Stack:** React · JavaScript ES6+ · JSDoc · Tailwind CSS · Vite · Supabase (Auth, PostgreSQL, Storage) · Vercel.
Sin TypeScript: los tipos se documentan con JSDoc (`jsconfig.json` activa `checkJs` en el editor).

## Ejecutar

Requiere Node.js 18+.

```bash
npm install
npm run dev
```

Para conectar Supabase, copiá `.env.example` como `.env.local` y completá la URL y la clave `anon`.
Luego ejecutá en orden `supabase/migrations/001` a `004` en el SQL Editor (o `beautyflow_schema_completo.sql`). `supabase/seed.sql` es opcional, solo para desarrollo.

## Qué incluye

- Dashboard administrativo y menú lateral responsive.
- Agenda de turnos con formulario de reservas (detecta superposición por profesional).
- Configuración administrativa: perfil profesional, datos fiscales (CUIT validado), contacto,
  centro, identidad visual, horarios, reservas, pagos, notificaciones, usuarios y seguridad.
  Por ahora se guarda en `localStorage`.
- Paleta con verde inglés `#1F4638` como color principal.
- Esquema SQL con RLS y roles (admin, recepcionista, profesional).

## Paleta

| Nombre       | Hex       |
| ------------ | --------- |
| Marfil       | `#F7F3EE` |
| Arena        | `#E8DDD1` |
| Nude         | `#C7AD97` |
| Taupe        | `#9B8170` |
| Verde inglés | `#1F4638` |

## Hoja de ruta

1. ~~Login, autenticación y permisos~~ ✔ (v0.2.0)
2. ~~Perfil profesional y configuración conectados a Supabase~~ ✔ (v0.2.0)
3. CRUD de clientes
4. CRUD de servicios y profesionales
5. Agenda con disponibilidad real
6. Reservas online
7. Registro de pagos
8. Mercado Pago y WhatsApp API

## Acceso y roles (v0.2.0)

- Inicio de sesión con Supabase Auth (email y contraseña). Sin credenciales en `.env.local` la app corre en modo demostración.
- El primer usuario registrado queda como **administrador**. Desactivá "Allow new users to sign up" en
  Authentication y creá los demás usuarios desde el panel de Supabase.
- Menú y rutas según rol (las políticas RLS son la protección real):
  - todos: dashboard, turnos, clientes, servicios
  - administrador y recepción: profesionales, pagos, reservas online
  - solo administrador: reportes y configuración
- La configuración se guarda en la tabla `business_settings` (solo administrador).
  Las secciones Usuarios y Seguridad quedan para una próxima versión.
- Los turnos, clientes y servicios siguen siendo datos de demostración hasta las tareas 3 a 5.

## Seguridad

- El CUIT, los datos personales y los registros de clientes quedan protegidos con políticas RLS.
- Las credenciales privadas de Mercado Pago y WhatsApp **nunca** van en el frontend:
  se usan desde `supabase/functions` (Edge Functions).
