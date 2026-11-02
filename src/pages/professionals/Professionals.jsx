import { useEffect, useState } from 'react'
import DataTable from '@/components/ui/DataTable'
import PageHeader from '@/components/ui/PageHeader'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showConfirm } from '@/utils/alerts'

/** Carga los profesionales ordenados por fecha de creación */
export async function loadProfessionals() {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al cargar profesionales desde Supabase:', error)
    return []
  }
  return data
}

export default function Professionals() {
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    specialty: ''
  })

  // Obtener la lista de profesionales al cargar la vista
  const fetchProfessionals = async () => {
    setLoading(true)
    const data = await loadProfessionals()
    setProfessionals(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProfessionals()
  }, [])

  // Crear un nuevo profesional
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name) return

    const { error } = await supabase
      .from('professionals')
      .insert([
        {
          name: formData.name,
          specialty: formData.specialty,
          active: true
        }
      ])

    if (error) {
      showError('Error al guardar el profesional', error.message)
    } else {
      showSuccess('¡Profesional guardado!', 'El profesional se agregó al equipo.')
      setFormData({ name: '', specialty: '' })
      setIsModalOpen(false)
      fetchProfessionals()
    }
  }

  // Activar o desactivar profesional
  const toggleActive = async (id, currentStatus) => {
    const { error } = await supabase
      .from('professionals')
      .update({ active: !currentStatus })
      .eq('id', id)

    if (error) {
      showError('Error al actualizar el estado', error.message)
    } else {
      showSuccess(currentStatus ? 'Profesional pausado' : 'Profesional activado')
      fetchProfessionals()
    }
  }

  // Eliminar un profesional
  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      '¿Eliminar profesional?',
      '¿Estás seguro de que deseas eliminar este profesional del sistema?'
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('professionals')
      .delete()
      .eq('id', id)

    if (error) {
      showError('Error al eliminar el profesional', error.message)
    } else {
      showSuccess('Profesional eliminado')
      fetchProfessionals()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Profesionales" />
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#1F4638] rounded-md hover:bg-[#18372c] transition-colors"
        >
          + Nuevo Profesional
        </button>
      </div>

      <DataTable
        title="Equipo de Trabajo"
        note={loading ? "Cargando profesionales..." : "Listado conectado a Supabase."}
        rows={professionals}
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'specialty', label: 'Especialidad', render: (r) => r.specialty || 'Sin especificar' },
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

      {/* Modal para crear profesional */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Agregar Nuevo Profesional</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. Ana García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidad</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. Cosmiatría / Manicuría"
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
                  Guardar Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}