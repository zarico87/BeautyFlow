/**
 * Definición declarativa del módulo de configuración administrativa.
 * Cada sección genera su formulario automáticamente.
 *
 * @typedef {Object} SettingsField
 * @property {string} name
 * @property {string} label
 * @property {'text'|'email'|'tel'|'textarea'|'select'|'checkbox'|'number'|'color'|'time'} [type]
 * @property {string[]} [options]   Para `select`
 * @property {string} [hint]
 * @property {'cuit'} [validate]
 *
 * @typedef {Object} SettingsSection
 * @property {string} id
 * @property {string} title
 * @property {string} [note]
 * @property {boolean} [soon]   Sección todavía sin guardado (se mostrará como "próximamente")
 * @property {SettingsField[]} fields
 */

/** @type {SettingsSection[]} */
export const settingsSections = [
  {
    id: 'perfil',
    title: 'Perfil profesional',
    note: 'Datos personales de la persona responsable del centro.',
    fields: [
      { name: 'nombre', label: 'Nombre y apellido' },
      { name: 'profesion', label: 'Profesión' },
      { name: 'matricula', label: 'Matrícula', hint: 'Solo si corresponde.' },
    ],
  },
  {
    id: 'fiscal',
    title: 'Datos fiscales',
    note: 'Pueden diferir del perfil profesional: la titular del centro no siempre coincide con la razón social.',
    fields: [
      { name: 'razonSocial', label: 'Razón social' },
      { name: 'cuit', label: 'CUIT', validate: 'cuit', hint: 'Formato XX-XXXXXXXX-X' },
      {
        name: 'condicionFiscal',
        label: 'Condición fiscal',
        type: 'select',
        options: ['Monotributista', 'Responsable inscripto', 'Exento', 'Consumidor final'],
      },
    ],
  },
  {
    id: 'contacto',
    title: 'Contacto',
    fields: [
      { name: 'telefono', label: 'Teléfono', type: 'tel' },
      { name: 'whatsapp', label: 'WhatsApp', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
    ],
  },
  {
    id: 'centro',
    title: 'Centro de estética',
    fields: [
      { name: 'nombreComercial', label: 'Nombre comercial' },
      { name: 'direccion', label: 'Dirección' },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    ],
  },
  {
    id: 'identidad',
    title: 'Identidad visual',
    note: 'El logo y las imágenes se guardarán en Supabase Storage.',
    fields: [
      { name: 'colorPrincipal', label: 'Color principal', type: 'color' },
      { name: 'colorSecundario', label: 'Color secundario', type: 'color' },
    ],
  },
  {
    id: 'horarios',
    title: 'Horarios',
    fields: [
      { name: 'apertura', label: 'Apertura', type: 'time' },
      { name: 'cierre', label: 'Cierre', type: 'time' },
      { name: 'descansoInicio', label: 'Inicio de descanso', type: 'time' },
      { name: 'descansoFin', label: 'Fin de descanso', type: 'time' },
      { name: 'diasAtencion', label: 'Días de atención', hint: 'Ej.: Lunes a sábado' },
    ],
  },
  {
    id: 'reservas',
    title: 'Reservas',
    fields: [
      { name: 'requiereSena', label: 'Requerir seña para reservar', type: 'checkbox' },
      { name: 'porcentajeSena', label: 'Porcentaje de seña (%)', type: 'number' },
      { name: 'horasCancelacion', label: 'Horas mínimas para cancelar', type: 'number' },
      { name: 'permiteReprogramar', label: 'Permitir reprogramaciones', type: 'checkbox' },
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos',
    note: 'Las credenciales privadas de Mercado Pago se configuran en el servidor (Supabase Functions), nunca aquí.',
    fields: [
      { name: 'mercadoPago', label: 'Aceptar Mercado Pago', type: 'checkbox' },
      { name: 'transferencia', label: 'Aceptar transferencias', type: 'checkbox' },
      { name: 'cbuAlias', label: 'CBU / Alias para transferencias' },
      { name: 'efectivo', label: 'Aceptar efectivo', type: 'checkbox' },
    ],
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones',
    fields: [
      { name: 'notifWhatsapp', label: 'Avisos por WhatsApp', type: 'checkbox' },
      { name: 'notifEmail', label: 'Avisos por email', type: 'checkbox' },
      { name: 'horasRecordatorio', label: 'Recordatorio (horas antes del turno)', type: 'number' },
    ],
  },
  {
    id: 'usuarios',
    title: 'Usuarios',
    soon: true,
    note: 'Roles previstos: administrador, recepcionista y profesional. La gestión real se conecta con Supabase Auth.',
    fields: [
      { name: 'emailInvitacion', label: 'Email del nuevo usuario', type: 'email' },
      {
        name: 'rolInvitacion',
        label: 'Rol',
        type: 'select',
        options: ['Administrador', 'Recepcionista', 'Profesional'],
      },
    ],
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    soon: true,
    note: 'El cambio de contraseña, las sesiones activas y los permisos se implementan con Supabase Auth y políticas RLS.',
    fields: [
      { name: 'cierreSesionMin', label: 'Cierre de sesión por inactividad (min)', type: 'number' },
    ],
  },
]
