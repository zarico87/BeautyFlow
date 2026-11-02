import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatPrice, formatDate } from '@/utils/dates'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess } from '@/utils/alerts'

export const PAYMENT_METHODS = [
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_debito', label: 'Tarjeta Débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
  { value: 'go_cuotas', label: 'Go Cuotas' },
]

export const methodLabels = {
  mercado_pago: 'Mercado Pago',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo',
  tarjeta_debito: 'Tarjeta Débito',
  tarjeta_credito: 'Tarjeta Crédito',
  go_cuotas: 'Go Cuotas',
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Estado para editar método de pago
  const [editingPayment, setEditingPayment] = useState(null)
  const [editMethod, setEditMethod] = useState('efectivo')
  const [savingEdit, setSavingEdit] = useState(false)

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

  // Registrar cobro (guardar directamente sin redirigir)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.appointment_id || !form.amount) return

    // Registrar en la base de datos de Supabase
    const { error } = await supabase
      .from('payments')
      .insert([
        {
          appointment_id: form.appointment_id,
          amount: parseFloat(form.amount),
          method: form.method,
          status: 'aprobado',
          is_deposit: form.is_deposit,
        },
      ])
      .select()

    if (error) {
      showError('Error al registrar el pago', error.message)
      return
    }

    showSuccess('¡Pago registrado!', 'El cobro ha sido guardado correctamente en caja.')

    setForm({ appointment_id: '', amount: '', method: 'mercado_pago', is_deposit: false })
    setIsModalOpen(false)
    fetchData()
  }

  // Guardar edición del método de pago
  const handleUpdatePaymentMethod = async (e) => {
    e.preventDefault()
    if (!editingPayment) return
    setSavingEdit(true)

    const { error } = await supabase
      .from('payments')
      .update({ method: editMethod })
      .eq('id', editingPayment.id)

    setSavingEdit(false)

    if (error) {
      showError('Error al actualizar método', error.message)
    } else {
      showSuccess('Método actualizado', `El pago ahora figura como ${methodLabels[editMethod] || editMethod}.`)
      setEditingPayment(null)
      fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Caja y Pagos" subtitle="Gestión de señas y cobros del salón" />
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
                  <th className="py-2 px-3 text-right">Acción</th>
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
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-800">
                        {methodLabels[p.method] || p.method?.replace('_', ' ')}
                      </span>
                    </td>
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
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPayment(p)
                          setEditMethod(p.method)
                        }}
                        className="text-xs font-semibold text-[#1F4638] hover:text-[#18372c] underline"
                      >
                        Editar método
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal para editar método de pago */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-ingles">Editar Método de Pago</h3>
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-taupe mb-4">
              Transacción de <strong className="text-gray-800">{editingPayment.appointments?.clients?.full_name || 'Cliente'}</strong> por {formatPrice(editingPayment.amount)}.
            </p>
            <form onSubmit={handleUpdatePaymentMethod} className="space-y-4">
              <Field label="Seleccionar nuevo método de pago">
                <select
                  className="input"
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="ghost" onClick={() => setEditingPayment(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? 'Guardando…' : 'Guardar Cambio'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para registrar pago */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-ingles">Registrar Pago</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
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
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
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
                  Guardar Pago
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}