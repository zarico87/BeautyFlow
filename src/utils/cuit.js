/**
 * Valida un CUIT/CUIL argentino (11 dígitos con dígito verificador módulo 11).
 * Acepta guiones: "20-12345678-6".
 * @param {string} value
 * @returns {boolean}
 */
export function isValidCuit(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 11) return false

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0)
  let check = 11 - (sum % 11)
  if (check === 11) check = 0
  if (check === 10) return false // combinación inválida
  return check === Number(digits[10])
}

/**
 * Da formato "XX-XXXXXXXX-X" a un CUIT.
 * @param {string} value
 * @returns {string}
 */
export function formatCuit(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
}
