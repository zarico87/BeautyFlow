import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { dateISO, formatDate } from '@/utils/dates'
import { supabase } from '@/lib/supabase'

const emptyForm = () => ({
  clientId: '',
  serviceId: '',
  professionalId: '',
  date: dateISO(0),
  start: '',
})

export default function Appointments() {
  const [day, setDay] = useState(dateISO(0))
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Estados locales desde Supabase
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [appointments, setAppointments] = useState([])

  // Cargar catálogos iniciales
  useEffect(() => {
    async function loadCatalogs() {
      const [resClients, resServices, resProfessionals] = await Promise.all([
        supabase.from('clients').select('id, full_name').order('full_name'),
        supabase.from('services').select('id, name, duration_minutes').eq('active', true),
        supabase.from('professionals').select('id, name').eq('active', true),
      ])

      if (resClients.data) setClients(resClients.data)
      if (resServices.data) setServices(resServices.data)
      if (resProfessionals.data) setProfessionals(resProfessionals.data)
    }
    loadCatalogs()
  }, [])

  // Cargar turnos del día seleccionado
  const fetchAppointments = async () => {
    setLoading(true)
    // Rango del día completo
    const startOfDay = `${day}T00:00:00.000Z`
    const endOfDay = `${day}T23:59:59.999Z`

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        starts_at,
        ends_at,
        status,
        client_id,
        service_id,
        professional_id,
        clients ( full_name ),
        services ( name, duration_minutes ),
        professionals ( name )
      `)
      .gte('starts_at', startOfDay)
      .lte('starts_at', endOfDay)
      .order('starts_at', { ascending: true })

    if (error) {
      console.error('Error al cargar turnos:', error)
    } else {
      setAppointments(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAppointments()
  }, [day])

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // Cambiar estado de un turno
  const handleSetStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar estado: ' + error.message)
    } else {
      fetchAppointments()
    }
  }

  // Guardar un nuevo turno en Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const next = {}
    if (!form.clientId) next.clientId = 'Elegí una clienta.'
    if (!form.serviceId) next.serviceId = 'Elegí un servicio.'
    if (!form.professionalId) next.professionalId = 'Elegí una profesional.'
    if (!form.date) next.date = 'Elegí una fecha.'
    if (!form.start) next.start = 'Indicá la hora.'
    setErrors(next)
    if (Object.keys(next).length) return

    // Calcular hora de inicio y fin según la duración del servicio
    const selectedService = services.find((s) => s.id === form.serviceId)
    const durationMinutes = selectedService?.duration_minutes || 30

    const startsAt = new Date(`${form.date}T${form.start}:00`)
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000)

    const { error } = await supabase.from('appointments').insert([
      {
        client_id: form.clientId,
        service_id: form.serviceId,
        professional_id: form.professionalId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'pendiente',
      },
    ])

    if (error) {
      if (error.message.includes('appointments_no_overlap')) {
        setErrors({ start: 'El profesional ya tiene un turno asignado en ese horario.' })
      } else {
        setErrors({ start: error.message })
      }
      return
    }

    setDay(form.date)
    setForm(emptyForm())
    setMessage('Turno creado correctamente.')
    fetchAppointments()
  }

  return (
    <>
      <PageHeader title="Agenda de turnos" subtitle={formatDate(day)} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card
          title="Turnos del día"
          className="lg:col-span-3"
          action={
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="input !w-auto"
              aria-label="Fecha de la agenda"
            />
          }
        >
          {loading ? (
            <p className="text-sm text-taupe">Cargando turnos...</p>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-taupe">No hay turnos para este día.</p>
          ) : (
            <ul className="divide-y divide-arena">
              {appointments.map((a) => {
                const startTime = new Date(a.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const endTime = new Date(a.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                return (
                  <li key={a.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {startTime} – {endTime} · {a.clients?.full_name}
                        </p>
                        <p className="text-sm text-taupe">
                          {a.services?.name} · {a.professionals?.name}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    {a.status !== 'cancelado' && a.status !== 'completado' && (
                      <div className="mt-2 flex gap-2">
                        {a.status === 'pendiente' && (
                          <Button variant="secondary" className="!px-3 !py-1" onClick={() => handleSetStatus(a.id, 'confirmado')}>
                            Confirmar
                          </Button>
                        )}
                        <Button variant="secondary" className="!px-3 !py-1" onClick={() => handleSetStatus(a.id, 'completado')}>
                          Completar
                        </Button>
                        <Button variant="ghost" className="!px-3 !py-1" onClick={() => handleSetStatus(a.id, 'cancelado')}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card title="Nueva reserva" className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Clienta" error={errors.clientId}>
              <select className="input" value={form.clientId} onChange={update('clientId')}>
                <option value="">Seleccionar…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Servicio" error={errors.serviceId}>
              <select className="input" value={form.serviceId} onChange={update('serviceId')}>
                <option value="">Seleccionar…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
                ))}
              </select>
            </Field>
            <Field label="Profesional" error={errors.professionalId}>
              <select className="input" value={form.professionalId} onChange={update('professionalId')}>
                <option value="">Seleccionar…</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha" error={errors.date}>
                <input type="date" className="input" value={form.date} onChange={update('date')} />
              </Field>
              <Field label="Hora" error={errors.start}>
                <input type="time" className="input" value={form.start} onChange={update('start')} />
              </Field>
            </div>
            <Button type="submit" className="w-full">Crear turno</Button>
            {message && <p className="text-sm text-ingles">{message}</p>}
          </form>
        </Card>
      </div>
    </>
  )
}