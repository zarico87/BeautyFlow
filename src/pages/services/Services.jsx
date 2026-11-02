import { useEffect, useState } from 'react'
import DataTable from '@/components/ui/DataTable'
import PageHeader from '@/components/ui/PageHeader'
import { formatPrice } from '@/utils/dates'
import { supabase } from '@/lib/supabase'

/** Carga los servicios ordenados por fecha de creación */
export async function loadServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al cargar servicios desde Supabase:', error)
    return []
  }
  return data
}

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: 30,
    price: ''
  })

  // Obtener catálogo al cargar la vista
  const fetchServices = async () => {
    setLoading(true)
    const data = await loadServices()
    setServices(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchServices()
  }, [])

  // Crear un nuevo servicio
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price) return

    const { error } = await supabase
      .from('services')
      .insert([
        {
          name: formData.name,
          duration_minutes: parseInt(formData.duration_minutes, 10),
          price: parseFloat(formData.price),
          active: true
        }
      ])

    if (error) {
      alert('Error al guardar el servicio: ' + error.message)
    } else {
      setFormData({ name: '', duration_minutes: 30, price: '' })
      setIsModalOpen(false)
      fetchServices()
    }
  }

  // Activar o desactivar servicio
  const toggleActive = async (id, currentStatus) => {
    const { error } = await supabase
      .from('services')
      .update({ active: !currentStatus })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar el estado: ' + error.message)
    } else {
      fetchServices()
    }
  }

  // Eliminar un servicio
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar el servicio: ' + error.message)
    } else {
      fetchServices()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Servicios" />
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#1F4638] rounded-md hover:bg-[#18372c] transition-colors"
        >
          + Nuevo Servicio
        </button>
      </div>

      <DataTable
        title="Catálogo de Servicios"
        note={loading ? "Cargando servicios..." : "Catálogo conectado a Supabase."}
        rows={services}
        columns={[
          { key: 'name', label: 'Servicio' },
          { 
            key: 'duration_minutes', 
            label: 'Duración', 
            render: (r) => `${r.duration_minutes} min` 
          },
          { 
            key: 'price', 
            label: 'Precio', 
            render: (r) => formatPrice(r.price) 
          },
          {
            key: 'active',
            label: 'Estado',
            render: (r) => (
              <span className={`px-2 py-1 text-xs rounded-full ${r.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {r.active ? 'Activo' : 'Inactivo'}
              </span>
            )
          },
          {
            key: 'actions',
            label: 'Acciones',
            render: (r) => (
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(r.id, r.active)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {r.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            )
          }
        ]}
      />

      {/* Modal para crear servicio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Agregar Nuevo Servicio</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del servicio</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. Limpieza facial profunda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duración (minutos)</label>
                <input
                  type="number"
                  required
                  min="5"
                  step="5"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. 38000"
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
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}