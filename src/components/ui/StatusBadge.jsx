const styles = {
  pendiente: 'bg-arena text-taupe',
  confirmado: 'bg-ingles text-marfil',
  completado: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-red-100 text-red-800',
}

/**
 * Insignia del estado de un turno.
 * @param {{ status: import('@/data/demo').AppointmentStatus }} props
 */
export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}
