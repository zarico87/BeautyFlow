import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatPrice, formatDate } from '@/utils/dates'
import { supabase } from '@/lib/supabase'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [form, setForm] = useState({
    appointment_id: '',
    amount: '',
    method: 'mercado_pago',
    is_deposit: false,
  })

  // Cargar historial de pagos y turnos sin pagar completamente
  const fetchData = async () => {
    setLoading(true)

    // Cargar historial de pagos con detalles
    const { data: payData, error: payErr } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        method,
        status,
        is_deposit,
        created_at,
        external_reference,
        appointments (
          id,
          starts_at,
          clients ( full_name ),
          services ( name )
        )
      `)
      .order('created_at', { ascending: false })

    if (!payErr) setPayments(payData || [])

    // Cargar turnos para asociar nuevos pagos
    const { data: appData } = await supabase
      .from('appointments')
      .select(`
        id,
        starts_at,
        clients ( full_name ),
        services ( name, price )
      `)
      .neq('status', 'cancelado')
      .order('starts_at', { ascending: false })

    if (appData) setAppointments(appData)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Registrar cobro o generar cobro por Mercado Pago
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.appointment_id || !form.amount) return

    // Registrar en la base de datos de Supabase
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          appointment_id: form.appointment_id,
          amount: parseFloat(form.amount),
          method: form.method,
          status: form.method === 'mercado_pago' ? 'pendiente' : 'aprobado',
          is_deposit: form.is_deposit,
        },
      ])
      .select()

    if (error) {
      alert('Error al registrar el pago: ' + error.message)
      return
    }

    // Si el método es Mercado Pago, aquí se dispara la integración con el Checkout
    if (form.method === 'mercado_pago') {
      alert('Pago pendiente registrado. Redirigiendo a checkout de Mercado Pago...')
      // Aquí invocas la función backend que crea la preferencia en MP con data[0].id
    } else {
      alert('Pago registrado correctamente.')
    }

    setForm({ appointment_id: '', amount: '', method: 'mercado_pago', is_deposit: false })
    setIsModalOpen(false)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Caja y Pagos" subtitle="Gestión de señas y cobros con Mercado Pago" />
        <Button onClick={() => setIsModalOpen(true)}>+ Registrar Cobro</Button>
      </div>

      <Card title="Historial de Transacciones">
        {loading ? (
          <p className="text-sm text-taupe">Cargando transacciones...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-taupe">No hay cobros registrados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-arena text-taupe">
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Clienta</th>
                  <th className="py-2 px-3">Servicio</th>
                  <th className="py-2 px-3">Método</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Monto</th>
                  <th className="py-2 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arena">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-3">{formatDate(p.created_at.split('T')[0])}</td>
                    <td className="py-3 px-3 font-medium">
                      {p.appointments?.clients?.full_name || 'Cliente general'}
                    </td>
                    <td className="py-3 px-3">{p.appointments?.services?.name || '-'}</td>
                    <td className="py-3 px-3 capitalize">{p.method.replace('_', ' ')}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${p.is_deposit ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {p.is_deposit ? 'Seña' : 'Total'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#1F4638]">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal para registrar o solicitar pago */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Registrar / Solicitar Pago</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Turno / Clienta">
                <select
                  className="input"
                  required
                  value={form.appointment_id}
                  onChange={(e) => {
                    const app = appointments.find((a) => a.id === e.target.value)
                    setForm({
                      ...form,
                      appointment_id: e.target.value,
                      amount: app?.services?.price || '',
                    })
                  }}
                >
                  <option value="">Seleccionar turno…</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.clients?.full_name} - {a.services?.name} (${a.services?.price})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Monto ($)">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </Field>

              <Field label="Método de pago">
                <select
                  className="input"
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                >
                  <option value="mercado_pago">Mercado Pago (Link / QR)</option>
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="efectivo">Efectivo</option>
                </select>
              </Field>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_deposit"
                  checked={form.is_deposit}
                  onChange={(e) => setForm({ ...form, is_deposit: e.target.checked })}
                  className="rounded border-gray-300 text-[#1F4638] focus:ring-[#1F4638]"
                />
                <label htmlFor="is_deposit" className="text-sm text-gray-700">
                  Es una seña para reservar el turno
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {form.method === 'mercado_pago' ? 'Generar Cobro MP' : 'Guardar Pago'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}