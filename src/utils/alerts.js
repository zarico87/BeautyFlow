import Swal from 'sweetalert2'

// Configuración estilizada con la paleta de BeautyFlow
const BFSwal = Swal.mixin({
  confirmButtonColor: '#1F4638',
  cancelButtonColor: '#9B8170',
  customClass: {
    popup: 'rounded-2xl font-sans',
    confirmButton: 'rounded-lg px-4 py-2 font-medium',
    cancelButton: 'rounded-lg px-4 py-2 font-medium',
  },
})

export default BFSwal
export { BFSwal as Swal }

/**
 * Notificación exitosa
 * @param {string} title
 * @param {string} [text]
 */
export function showSuccess(title, text = '') {
  return BFSwal.fire({
    icon: 'success',
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
  })
}

/**
 * Notificación de error
 * @param {string} title
 * @param {string} [text]
 */
export function showError(title, text = '') {
  return BFSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Entendido',
  })
}

/**
 * Notificación de advertencia
 * @param {string} title
 * @param {string} [text]
 */
export function showWarning(title, text = '') {
  return BFSwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'Aceptar',
  })
}

/**
 * Diálogo de confirmación (reemplazo de window.confirm)
 * @param {string} title
 * @param {string} [text]
 * @param {string} [confirmButtonText]
 * @param {string} [cancelButtonText]
 * @returns {Promise<boolean>}
 */
export async function showConfirm(
  title,
  text = '',
  confirmButtonText = 'Sí, confirmar',
  cancelButtonText = 'Cancelar'
) {
  const result = await BFSwal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  })
  return result.isConfirmed
}

/**
 * Toast flotante rápido
 * @param {string} title
 * @param {'success'|'error'|'warning'|'info'} [icon]
 */
export function showToast(title, icon = 'success') {
  return BFSwal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    icon,
    title,
  })
}
