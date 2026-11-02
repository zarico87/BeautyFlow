import { dateISO } from '@/utils/dates'

/**
 * Datos de demostración. Se reemplazarán por consultas a Supabase.
 *
 * @typedef {Object} Professional
 * @property {string} id
 * @property {string} name
 * @property {string} specialty
 *
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} name
 * @property {number} duration  Minutos
 * @property {number} price     Pesos argentinos
 *
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {string} email
 *
 * @typedef {'pendiente'|'confirmado'|'completado'|'cancelado'} AppointmentStatus
 *
 * @typedef {Object} Appointment
 * @property {string} id
 * @property {string} clientId
 * @property {string} serviceId
 * @property {string} professionalId
 * @property {string} date    YYYY-MM-DD
 * @property {string} start   HH:MM
 * @property {string} end     HH:MM
 * @property {AppointmentStatus} status
 */

/** @type {Professional[]} */
export const professionals = [
  { id: 'p1', name: 'Lucía Ferreyra', specialty: 'Cosmetología facial' },
  { id: 'p2', name: 'Camila Duarte', specialty: 'Masajes y corporales' },
  { id: 'p3', name: 'Rocío Almada', specialty: 'Manicuría y pedicuría' },
]

/** @type {Service[]} */
export const services = [
  { id: 's1', name: 'Limpieza facial profunda', duration: 60, price: 38000 },
  { id: 's2', name: 'Masaje descontracturante', duration: 50, price: 32000 },
  { id: 's3', name: 'Manicuría semipermanente', duration: 75, price: 24000 },
  { id: 's4', name: 'Depilación definitiva (sesión)', duration: 30, price: 28000 },
]

/** @type {Client[]} */
export const clients = [
  { id: 'c1', name: 'Martina Quiroga', phone: '+54 351 555-0101', email: 'martina@example.com' },
  { id: 'c2', name: 'Valentina Sosa', phone: '+54 351 555-0102', email: 'valen@example.com' },
  { id: 'c3', name: 'Julieta Paz', phone: '+54 351 555-0103', email: 'julieta@example.com' },
  { id: 'c4', name: 'Agustina Rey', phone: '+54 351 555-0104', email: 'agus@example.com' },
]

/** @type {Appointment[]} */
export const initialAppointments = [
  { id: 'a1', clientId: 'c1', serviceId: 's1', professionalId: 'p1', date: dateISO(0), start: '09:00', end: '10:00', status: 'completado' },
  { id: 'a2', clientId: 'c2', serviceId: 's2', professionalId: 'p2', date: dateISO(0), start: '10:30', end: '11:20', status: 'confirmado' },
  { id: 'a3', clientId: 'c3', serviceId: 's3', professionalId: 'p3', date: dateISO(0), start: '15:00', end: '16:15', status: 'pendiente' },
  { id: 'a4', clientId: 'c4', serviceId: 's4', professionalId: 'p1', date: dateISO(1), start: '11:00', end: '11:30', status: 'confirmado' },
  { id: 'a5', clientId: 'c1', serviceId: 's2', professionalId: 'p2', date: dateISO(2), start: '16:00', end: '16:50', status: 'pendiente' },
]
