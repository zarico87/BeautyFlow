/**
 * Roles del sistema. Coinciden con el enum `user_role` de la base de datos.
 * @typedef {'admin' | 'receptionist' | 'professional'} Role
 */

/** @type {Role[]} */
export const ALL_ROLES = ['admin', 'receptionist', 'professional']

/** Administración y recepción: gestionan clientes, turnos y pagos. @type {Role[]} */
export const FRONT_DESK = ['admin', 'receptionist']

/** Solo administración. @type {Role[]} */
export const ADMIN_ONLY = ['admin']

/** @type {Record<Role, string>} */
export const roleLabels = {
  admin: 'Administrador',
  receptionist: 'Recepcionista',
  professional: 'Profesional',
}
