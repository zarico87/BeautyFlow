import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Field from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import { settingsSections } from '@/data/settingsSections'
import { isSupabaseConfigured, supabase, createTransientClient } from '@/lib/supabase'
import { loadSettings, saveSettings } from '@/services/settings'
import { formatCuit, isValidCuit } from '@/utils/cuit'
import { showError, showSuccess, showWarning, showConfirm } from '@/utils/alerts'
import { useAuth } from '@/contexts/AuthContext'
import { roleLabels } from '@/utils/roles'

/** Componente interno para gestionar Usuarios, Alta y Roles */
function UsersSection() {
  const { role: currentRole } = useAuth()
  const isAdmin = currentRole === 'admin'

  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Estado para editar usuario completo (solo admin)
  const [editingUser, setEditingUser] = useState(null)
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    role: 'receptionist',
    newPassword: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'receptionist',
  })
  const [creating, setCreating] = useState(false)

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

  // Contar usuarios del equipo (recepcionistas y profesionales, máx 20)
  const teamMembers = profiles.filter((p) => p.role === 'receptionist' || p.role === 'professional')
  const teamCount = teamMembers.length
  const MAX_TEAM_USERS = 20

  // Abrir modal de edición completa para un usuario
  const handleOpenEditUser = (user) => {
    if (!isAdmin) {
      showWarning('Acceso restringido', 'Solo el administrador puede editar el usuario completo.')
      return
    }
    setEditingUser(user)
    setEditFormData({
      full_name: user.full_name || '',
      role: user.role || 'receptionist',
      newPassword: '',
    })
  }

  // Guardar edición completa de usuario
  const handleSaveEditUser = async (e) => {
    e.preventDefault()
    if (!isAdmin) {
      showError('No autorizado', 'Solo el administrador puede editar usuarios.')
      return
    }
    if (!editFormData.full_name.trim()) {
      showWarning('Campo requerido', 'El nombre y apellido no puede estar vacío.')
      return
    }

    // Verificar límite de 20 si cambia de admin a recepcionista/profesional
    if (
      editingUser.role === 'admin' &&
      (editFormData.role === 'receptionist' || editFormData.role === 'professional') &&
      teamCount >= MAX_TEAM_USERS
    ) {
      showWarning(
        'Límite de equipo alcanzado',
        `Se pueden cargar como máximo hasta ${MAX_TEAM_USERS} usuarios entre recepcionistas y profesionales.`
      )
      return
    }

    // Si se asigna un rol distinto al admin y se solicita cambio de contraseña, validar
    if (editFormData.role !== 'admin' && editFormData.newPassword && editFormData.newPassword.length < 6) {
      showWarning('Contraseña corta', 'La contraseña asignada debe tener al menos 6 caracteres.')
      return
    }

    setSavingEdit(true)

    // Actualizar datos del perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: editFormData.full_name.trim(),
        role: editFormData.role,
      })
      .eq('id', editingUser.id)

    setSavingEdit(false)

    if (profileError) {
      showError('Error al actualizar usuario', profileError.message)
      return
    }

    // Si se convirtió a profesional, asegurar que exista en la tabla professionals
    if (editFormData.role === 'professional') {
      const { data: existingProf } = await supabase
        .from('professionals')
        .select('id')
        .eq('name', editFormData.full_name.trim())
        .maybeSingle()

      if (!existingProf) {
        await supabase.from('professionals').insert([
          {
            name: editFormData.full_name.trim(),
            specialty: 'Estética / Spa',
            active: true,
          },
        ])
      }
    }

    showSuccess(
      'Usuario actualizado',
      `El usuario completo ha sido modificado exitosamente con rol ${roleLabels[editFormData.role] || editFormData.role}.`
    )
    setEditingUser(null)
    fetchProfiles()
  }

  // Eliminar usuario
  const handleDeleteUser = async (user) => {
    if (!isAdmin) {
      showWarning('Acceso restringido', 'Solo el administrador puede eliminar usuarios.')
      return
    }

    const confirmed = await showConfirm(
      '¿Eliminar usuario?',
      `¿Estás seguro de que deseas eliminar a "${user.full_name || 'este usuario'}" del sistema? Esta acción es permanente.`
    )
    if (!confirmed) return

    const { error } = await supabase.from('profiles').delete().eq('id', user.id)

    if (error) {
      showError('Error al eliminar usuario', error.message)
    } else {
      showSuccess('Usuario eliminado', 'El usuario ha sido removido del sistema.')
      fetchProfiles()
    }
  }

  // Crear un nuevo registro de usuario en Supabase Auth y Profiles
  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!isAdmin) {
      showWarning('Acceso restringido', 'Solo el administrador puede agregar usuarios.')
      return
    }

    if (!newUser.full_name.trim() || !newUser.email.trim() || !newUser.password) {
      showWarning('Campos requeridos', 'Por favor completa el nombre, email y contraseña.')
      return
    }

    // Verificar límite de 20 usuarios entre recepcionista y profesionales
    if (
      (newUser.role === 'receptionist' || newUser.role === 'professional') &&
      teamCount >= MAX_TEAM_USERS
    ) {
      showWarning(
        'Límite de equipo alcanzado',
        `Se pueden cargar como máximo hasta ${MAX_TEAM_USERS} usuarios entre recepcionistas y profesionales.`
      )
      return
    }

    if (newUser.password.length < 6) {
      showWarning('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setCreating(true)

    // Usar cliente temporal sin persistencia para NO sobrescribir la sesión actual del admin
    const transientClient = createTransientClient() || supabase

    const { data: authData, error: authError } = await transientClient.auth.signUp({
      email: newUser.email.trim(),
      password: newUser.password,
      options: {
        data: {
          full_name: newUser.full_name.trim(),
          role: newUser.role,
        },
      },
    })

    if (authError) {
      setCreating(false)
      showError('Error al registrar usuario', authError.message)
      return
    }

    // Insertar en tabla profiles
    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([
          {
            id: authData.user.id,
            full_name: newUser.full_name.trim(),
            role: newUser.role,
          },
        ])

      if (profileError) {
        setCreating(false)
        showError('Error al guardar perfil de usuario', profileError.message)
        return
      }

      // Si es profesional, agregarlo también al directorio de profesionales
      if (newUser.role === 'professional') {
        await supabase.from('professionals').insert([
          {
            name: newUser.full_name.trim(),
            specialty: 'Estética / Spa',
            active: true,
          },
        ])
      }

      showSuccess(
        '¡Usuario agregado!',
        `Usuario creado con éxito (${roleLabels[newUser.role] || newUser.role}). Ya puede ingresar a su sesión.`
      )
      setNewUser({ email: '', password: '', full_name: '', role: 'receptionist' })
      setIsModalOpen(false)
      fetchProfiles()
    }
    setCreating(false)
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando usuarios de Supabase...</p>

  return (
    <div className="space-y-4">
      {/* Resumen del equipo y contador de límite */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Equipo de trabajo
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-gray-900">
              {teamCount} / {MAX_TEAM_USERS} usuarios
            </span>
            <span className="text-xs text-gray-500">
              (recepcionistas y profesionales)
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Los usuarios creados pueden ingresar a su sesión pero no tienen acceso a Configuración ni Reportes.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={!isAdmin || (teamCount >= MAX_TEAM_USERS && newUser.role !== 'admin')}
        >
          + Agregar Usuario
        </Button>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
            <tr>
              <th className="py-2.5 px-3">Usuario / Nombre</th>
              <th className="py-2.5 px-3">Rol Actual</th>
              <th className="py-2.5 px-3">Acceso al Sistema</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="py-3 px-3 font-medium">
                  <span>{p.full_name || 'Sin Nombre'}</span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`capitalize px-2 py-0.5 text-xs rounded-full font-medium ${
                      p.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : p.role === 'professional'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {roleLabels[p.role] || p.role || 'Recepcionista'}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-gray-500">
                  {p.role === 'admin' ? (
                    <span className="text-purple-700 font-medium">Acceso total (Admin)</span>
                  ) : (
                    <span className="text-gray-600">
                      Turnos y Clientes · <strong className="text-gray-400 font-normal">Sin acceso a Config/Reportes</strong>
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right space-x-2">
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(p)}
                        className="text-xs font-semibold text-[#1F4638] hover:text-[#18372c] underline"
                      >
                        Editar usuario completo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(p)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 underline ml-2"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-ingles">Agregar Nuevo Usuario</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <Field label="Nombre y Apellido *">
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Ej. Lorena Lopez"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                />
              </Field>

              <Field label="Correo electrónico (Email) *">
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="lorena@ejemplo.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </Field>

              <Field label="Rol en el sistema *">
                <select
                  className="input"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="receptionist">Recepcionista</option>
                  <option value="professional">Profesional</option>
                  <option value="admin">Administrador</option>
                </select>
              </Field>

              {newUser.role !== 'admin' && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800 font-medium mb-1">
                    🔒 Contraseña distinta de administrador:
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Al asignar un rol distinto al admin ({roleLabels[newUser.role]}), asignale una contraseña propia para que ingrese a su sesión. Este usuario no tendrá acceso a Configuración ni Reportes.
                  </p>
                </div>
              )}

              <Field label="Contraseña inicial del usuario *">
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Guardando…' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Usuario Completo (Solo Admin) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-ingles">Editar Usuario Completo</h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <Field label="Nombre y Apellido *">
                <input
                  type="text"
                  required
                  className="input"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                />
              </Field>

              <Field label="Rol en el sistema">
                <select
                  className="input"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="receptionist">Recepcionista</option>
                  <option value="professional">Profesional</option>
                  <option value="admin">Administrador</option>
                </select>
              </Field>

              {editFormData.role !== 'admin' && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-xs text-stone-700">
                    ℹ️ Los roles de Recepcionista y Profesional pueden ingresar a su sesión pero no tienen acceso a Configuración ni Reportes.
                  </p>
                </div>
              )}

              <Field label="Asignar nueva contraseña (opcional)">
                <input
                  type="password"
                  className="input"
                  placeholder="Dejar en blanco para mantener la actual"
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                />
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? 'Guardando…' : 'Guardar Cambios'}
                </Button>
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      showWarning('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      showWarning('Contraseñas no coinciden', 'Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    setSaving(false)

    if (error) {
      showError('Error al actualizar', error.message)
    } else {
      showSuccess('¡Contraseña actualizada!', 'Tu contraseña ha sido cambiada exitosamente.')
      setNewPassword('')
      setConfirmPassword('')
    }
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