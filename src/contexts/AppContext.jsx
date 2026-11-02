import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { clients, initialAppointments, professionals, services } from '@/data/demo'
import { addMinutes, overlaps } from '@/utils/dates'

/**
 * @typedef {import('@/data/demo').Appointment} Appointment
 * @typedef {import('@/data/demo').AppointmentStatus} AppointmentStatus
 *
 * @typedef {Object} NewAppointment
 * @property {string} clientId
 * @property {string} serviceId
 * @property {string} professionalId
 * @property {string} date
 * @property {string} start
 *
 * @typedef {Object} AppContextValue
 * @property {Appointment[]} appointments
 * @property {typeof clients} clients
 * @property {typeof services} services
 * @property {typeof professionals} professionals
 * @property {(data: NewAppointment) => { ok: boolean, error?: string }} addAppointment
 * @property {(id: string, status: AppointmentStatus) => void} setStatus
 */

const AppContext = createContext(/** @type {AppContextValue | null} */ (null))

/**
 * Estado global de demostración (turnos). En la siguiente etapa se
 * reemplaza por consultas a Supabase.
 * @param {{ children: import('react').ReactNode }} props
 */
export function AppProvider({ children }) {
  const [appointments, setAppointments] = useState(initialAppointments)

  const addAppointment = useCallback(
    (/** @type {NewAppointment} */ data) => {
      const service = services.find((s) => s.id === data.serviceId)
      if (!service) return { ok: false, error: 'Servicio inválido.' }

      const end = addMinutes(data.start, service.duration)
      const conflict = appointments.some(
        (a) =>
          a.professionalId === data.professionalId &&
          a.date === data.date &&
          a.status !== 'cancelado' &&
          overlaps(data.start, end, a.start, a.end),
      )
      if (conflict) {
        return { ok: false, error: 'La profesional ya tiene un turno en ese horario.' }
      }

      setAppointments((prev) => [
        ...prev,
        { id: `a${Date.now()}`, ...data, end, status: 'pendiente' },
      ])
      return { ok: true }
    },
    [appointments],
  )

  const setStatus = useCallback((id, status) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }, [])

  const value = useMemo(
    () => ({ appointments, clients, services, professionals, addAppointment, setStatus }),
    [appointments, addAppointment, setStatus],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * Accede al estado global de la aplicación.
 * @returns {AppContextValue}
 */
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
