import { useEffect, useState } from 'react'
import DataTable from '@/components/ui/DataTable'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'

/** Carga la lista de clientes ordenados por nombre */
export async function loadClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error al cargar clientes desde Supabase:', error)
    return []
  }
  return data
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    notes: ''
  })

  // Obtener lista de clientes
  const fetchClients = async () => {
    setLoading(true)
    const data = await loadClients()
    setClients(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Crear nuevo cliente
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.full_name) return

    const { error } = await supabase
      .from('clients')
      .insert([
        {
          full_name: formData.full_name,
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.notes || null
        }
      ])

    if (error) {
      alert('Error al guardar el cliente: ' + error.message)
    } else {
      setFormData({ full_name: '', phone: '', email: '', notes: '' })
      setIsModalOpen(false)
      fetchClients()
    }
  }

  // Eliminar un cliente
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar el cliente: ' + error.message)
    } else {
      fetchClients()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Clientes" />
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#1F4638] rounded-md hover:bg-[#18372c] transition-colors"
        >
          + Nuevo Cliente
        </button>
      </div>

      <DataTable
        title="Directorio de Clientes"
        note={loading ? "Cargando clientes..." : "Listado conectado a Supabase."}
        rows={clients}
        columns={[
          { key: 'full_name', label: 'Nombre y Apellido' },
          { key: 'phone', label: 'Teléfono', render: (r) => r.phone || '-' },
          { key: 'email', label: 'Email', render: (r) => r.email || '-' },
          { key: 'notes', label: 'Notas', render: (r) => r.notes || '-' },
          {
            key: 'actions',
            label: 'Acciones',
            render: (r) => (
              <button
                onClick={() => handleDelete(r.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Eliminar
              </button>
            )
          }
        ]}
      />

      {/* Modal para crear cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Agregar Nuevo Cliente</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. Maria Lopez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. +54 9 351 1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. maria@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notas / Antecedentes</label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. Piel sensible, alergia a fragancias..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-[#1F4638] rounded-md hover:bg-[#18372c]"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}