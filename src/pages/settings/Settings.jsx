import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import { settingsSections } from '@/data/settingsSections'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { loadSettings, saveSettings } from '@/services/settings'
import { formatCuit, isValidCuit } from '@/utils/cuit'

/** Componente interno para gestionar Usuarios, Alta y Roles */
function UsersSection() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'receptionist',
  })

  // Cargar usuarios desde la tabla profiles
  const fetchProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('full_name', { ascending: true })

    if (!error) setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  // Guardar nombre actualizado
  const handleSaveName = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar nombre: ' + error.message)
    } else {
      setEditingId(null)
      fetchProfiles()
    }
  }

  // Cambiar rol de usuario
  const handleRoleChange = async (id, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar el rol: ' + error.message)
    } else {
      fetchProfiles()
    }
  }

  // Crear un nuevo registro de usuario en Supabase Auth y Profiles
  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      alert('Por favor completa el nombre, email y contraseña.')
      return
    }

    // 1. Registrar cuenta de usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: {
          full_name: newUser.full_name,
        },
      },
    })

    if (authError) {
      alert('Error al registrar usuario: ' + authError.message)
      return
    }

    // 2. Insertar o actualizar los datos del usuario en la tabla profiles
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([
          {
            id: authData.user.id,
            full_name: newUser.full_name,
            role: newUser.role,
          },
        ])

      if (profileError) {
        alert('Error al guardar perfil de usuario: ' + profileError.message)
      } else {
        alert('¡Usuario agregado correctamente!')
        setNewUser({ email: '', password: '', full_name: '', role: 'receptionist' })
        setIsModalOpen(false)
        fetchProfiles()
      }
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando usuarios de Supabase...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">
            Administra los nombres y permisos de acceso del equipo.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Agregar Usuario</Button>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
            <tr>
              <th className="py-2.5 px-3">Usuario / Nombre</th>
              <th className="py-2.5 px-3">Rol Actual</th>
              <th className="py-2.5 px-3">Asignar Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="py-3 px-3 font-medium">
                  {editingId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input !py-1 text-xs"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveName(p.id)}
                        className="text-xs text-emerald-700 font-bold hover:underline"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{p.full_name || 'Sin Nombre'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(p.id)
                          setEditName(p.full_name || '')
                        }}
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        (Editar)
                      </button>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span className="capitalize px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    {p.role || 'receptionist'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <select
                    className="input text-xs !py-1"
                    value={p.role || 'receptionist'}
                    onChange={(e) => handleRoleChange(p.id, e.target.value)}
                  >
                    <option value="admin">Administrador</option>
                    <option value="receptionist">Recepcionista</option>
                    <option value="professional">Profesional</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Agregar Nuevo Usuario</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <Field label="Nombre y Apellido">
                <input
                  type="text"
                  required
                  className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Ej. Lorena Lopez"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                />
              </Field>

              <Field label="Correo electrónico (Email)">
                <input
                  type="email"
                  required
                  className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="lorena@ejemplo.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </Field>

              <Field label="Contraseña inicial">
                <input
                  type="password"
                  required
                  className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  placeholder="Mínimo 6 caracteres"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </Field>

              <Field label="Rol en el sistema">
                <select
                  className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="admin">Administrador</option>
                  <option value="receptionist">Recepcionista</option>
                  <option value="professional">Profesional</option>
                </select>
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar Usuario</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/** Componente interno para gestionar Seguridad y Contraseña */
function SecuritySection() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setMessage('')

    if (newPassword.length < 6) {
      setMessage('Error: La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Error: Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setMessage('Error al actualizar: ' + error.message)
    } else {
      setMessage('¡Contraseña actualizada correctamente!')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
      <Field label="Nueva contraseña">
        <input
          type="password"
          required
          className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </Field>

      <Field label="Confirmar nueva contraseña">
        <input
          type="password"
          required
          className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
        />
      </Field>

      {message && (
        <p className={`text-sm font-medium ${message.startsWith('Error') ? 'text-red-600' : 'text-emerald-700'}`}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? 'Actualizando...' : 'Cambiar contraseña'}
      </Button>
    </form>
  )
}

/** Configuración administrativa. Se guarda en Supabase (tabla business_settings). */
export default function Settings() {
  const [activeId, setActiveId] = useState(settingsSections[0].id)
  const [values, setValues] = useState(/** @type {Record<string, any>} */ ({}))
  const [rowId, setRowId] = useState(/** @type {string | null} */ (null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const [saved, setSaved] = useState(false)

  // Cargar configuración desde Supabase al iniciar el componente
  useEffect(() => {
    let active = true
    loadSettings().then((result) => {
      if (!active) return
      setRowId(result.id)
      setValues(result.values || {})
      setLoadError(result.error ?? '')
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const section = settingsSections.find((s) => s.id === activeId) ?? settingsSections[0]

  /**
   * Actualiza el valor de un campo y formatea si es CUIT
   * @param {import('@/data/settingsSections').SettingsField} field
   * @param {any} value
   */
  const setValue = (field, value) => {
    const finalValue = field.validate === 'cuit' ? formatCuit(value) : value
    setValues((v) => ({ ...v, [field.name]: finalValue }))
    setSaved(false)
    setSaveError('')
  }

  /** Guardar todos los cambios de la configuración en Supabase */
  const handleSave = async (e) => {
    e.preventDefault()
    setSaveError('')

    // Validación general de campos de todas las secciones
    /** @type {Record<string, string>} */
    const next = {}
    for (const s of settingsSections) {
      for (const field of s.fields || []) {
        if (field.validate === 'cuit' && values[field.name] && !isValidCuit(values[field.name])) {
          next[field.name] = 'El CUIT no es válido.'
        }
      }
    }

    setErrors(next)
    if (Object.keys(next).length) {
      const inCurrent = section.fields?.some((f) => next[f.name])
      if (!inCurrent) setSaveError('Hay un dato inválido en otra sección (ej. CUIT en Datos fiscales).')
      return
    }

    setSaving(true)
    const result = await saveSettings(rowId, values)
    setSaving(false)

    if (result.error) {
      setSaveError(result.error)
      return
    }

    setRowId(result.id)
    setSaved(true)
  }

  /**
   * Renderiza el control del formulario según el tipo de campo
   * @param {import('@/data/settingsSections').SettingsField} field
   */
  const renderControl = (field) => {
    const value = values[field.name]
    switch (field.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            className="h-5 w-5 accent-[#1F4638] rounded border-gray-300"
            checked={Boolean(value)}
            onChange={(e) => setValue(field, e.target.checked)}
          />
        )
      case 'textarea':
        return (
          <textarea
            rows={3}
            className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
            value={value ?? ''}
            onChange={(e) => setValue(field, e.target.value)}
          />
        )
      case 'select':
        return (
          <select 
            className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]" 
            value={value ?? ''} 
            onChange={(e) => setValue(field, e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {field.options?.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )
      default:
        return (
          <input
            type={field.type ?? 'text'}
            className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F4638]"
            value={value ?? (field.type === 'color' ? '#1F4638' : '')}
            onChange={(e) => setValue(field, e.target.value)}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" subtitle="Datos del centro y de la persona responsable" />

      {loadError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          No se pudo cargar la configuración: {loadError}
        </p>
      )}

      {!isSupabaseConfigured && (
        <p className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
          Modo demostración: los cambios se guardan solo en este navegador.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Navegación lateral de pestañas */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {settingsSections.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveId(s.id)
                setSaved(false)
                setSaveError('')
              }}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                s.id === activeId 
                  ? 'bg-[#1F4638] text-white shadow-sm' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {s.title}
            </button>
          ))}
        </nav>

        {/* Panel de contenido de la sección activa */}
        <Card title={section.title} className="lg:col-span-3">
          {section.note && <p className="mb-4 text-sm text-gray-500">{section.note}</p>}

          {loading ? (
            <p className="text-sm text-gray-500">Cargando datos de configuración...</p>
          ) : section.id === 'usuarios' || activeId === 'usuarios' ? (
            <UsersSection />
          ) : section.id === 'seguridad' || activeId === 'seguridad' ? (
            <SecuritySection />
          ) : section.soon ? (
            <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
              Esta sección estará disponible en una próxima versión.
            </p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4" noValidate>
              {section.fields?.map((field) =>
                field.type === 'checkbox' ? (
                  <label key={field.name} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                    {renderControl(field)}
                    <span>{field.label}</span>
                  </label>
                ) : (
                  <Field key={field.name} label={field.label} hint={field.hint} error={errors[field.name]}>
                    {renderControl(field)}
                  </Field>
                )
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
                {saved && <span className="text-sm font-medium text-emerald-700">✓ Guardado en Supabase.</span>}
                {saveError && (
                  <span role="alert" className="text-sm font-medium text-red-600">
                    {saveError}
                  </span>
                )}
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}