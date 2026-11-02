/**
 * Utilidades de fechas y formato. Las fechas se manejan como strings ISO
 * locales: "YYYY-MM-DD" para el día y "HH:MM" para la hora.
 */

/**
 * Devuelve la fecha de hoy (más un desplazamiento en días) como "YYYY-MM-DD".
 * @param {number} [offsetDays=0]
 * @returns {string}
 */
export function dateISO(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Suma minutos a una hora "HH:MM".
 * @param {string} time
 * @param {number} minutes
 * @returns {string}
 */
export function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Indica si dos franjas horarias "HH:MM" se superponen.
 * @param {string} startA
 * @param {string} endA
 * @param {string} startB
 * @param {string} endB
 * @returns {boolean}
 */
export function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA
}

/**
 * Formatea "YYYY-MM-DD" como fecha legible en español (Argentina).
 * @param {string} iso
 * @returns {string}
 */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Formatea un monto en pesos argentinos.
 * @param {number} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
}
