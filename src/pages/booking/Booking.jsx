import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import { formatPrice, dateISO, formatDate } from '@/utils/dates'
import { supabase } from '@/lib/supabase'

export default function Booking() {
  const [services, setServices] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState({
    service_id: '',
    professional_id: '',
    date: dateISO(0),
    start_time: '10:00',
    full_name: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    async function loadPublicData() {
      setLoading(true)
      const [resServices, resProfessionals] = await Promise.all([
        supabase.from('services').select('id, name, duration_minutes, price').eq('active', true),
        supabase.from('professionals').select('id, name, specialty').eq('active', true),
      ])

      if (resServices.data) setServices(resServices.data)
      if (resProfessionals.data) setProfessionals(resProfessionals.data)
      setLoading(false)
    }
    loadPublicData()
  }, [])

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!form.service_id || !form.professional_id || !form.full_name || !form.phone) {
      setErrorMsg('Por favor completa todos los campos requeridos.')
      return
    }

    try {
      // 1. Verificar si el cliente ya existe por teléfono/email o crearlo
      let clientId = null
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .or(`phone.eq.${form.phone},email.eq.${form.email}`)
        .maybeSingle()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{ full_name: form.full_name, phone: form.phone, email: form.email }])
          .select()
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }

      // 2. Calcular inicio y fin del turno
      const selectedService = services.find((s) => s.id === form.service_id)
      const duration = selectedService?.duration_minutes || 30

      const startsAt = new Date(`${form.date}T${form.start_time}:00`)
      const endsAt = new Date(startsAt.getTime() + duration * 60000)

      // 3. Crear la reserva
      const { error: appError } = await supabase.from('appointments').insert([
        {
          client_id: clientId,
          service_id: form.service_id,
          professional_id: form.professional_id,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: 'pendiente',
        },
      ])

      if (appError) {
        if (appError.message.includes('appointments_no_overlap')) {
          throw new Error('El profesional ya no tiene disponibilidad en ese horario. Por favor selecciona otro.')
        }
        throw appError
      }

      setSuccess(true)
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la reserva.')
    }
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-gray-900">¡Reserva solicitada con éxito!</h2>
        <p className="text-gray-600">
          Registramos tu solicitud para el {formatDate(form.date)} a las {form.start_time} hs.
          Nos pondremos en contacto a tu WhatsApp/email para confirmar el turno.
        </p>
        <Button onClick={() => setSuccess(false)}>Realizar otra reserva</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Reserva tu Turno Online" subtitle="Elige el servicio, fecha y horario de preferencia" />

      <Card>
        {loading ? (
          <p className="text-sm text-taupe">Cargando servicios disponibles...</p>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <Field label="1. Selecciona el Tratamiento">
              <select
                className="input"
                required
                value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
              >
                <option value="">Seleccionar servicio…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} min) — {formatPrice(s.price)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="2. Profesional de preferencia">
              <select
                className="input"
                required
                value={form.professional_id}
                onChange={(e) => setForm({ ...form, professional_id: e.target.value })}
              >
                <option value="">Seleccionar profesional…</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.specialty ? `(${p.specialty})` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="3. Fecha">
                <input
                  type="date"
                  className="input"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Field>
              <Field label="Hora">
                <input
                  type="time"
                  className="input"
                  required
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </Field>
            </div>

            <hr className="border-arena my-4" />
            <h3 className="font-medium text-gray-800">4. Mis Datos Personales</h3>

            <Field label="Nombre y Apellido">
              <input
                type="text"
                className="input"
                required
                placeholder="Ej. María Pérez"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono / WhatsApp">
                <input
                  type="tel"
                  className="input"
                  required
                  placeholder="+54 9 351..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className="input"
                  placeholder="maria@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
            </div>

            {errorMsg && <p className="text-sm text-red-600 font-medium">{errorMsg}</p>}

            <Button type="submit" className="w-full">
              Confirmar y Solicitar Reserva
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}