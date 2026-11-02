import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { showError, showSuccess, showWarning } from '@/utils/alerts'
import { roleLabels } from '@/utils/roles'

/**
 * Pantalla de acceso, registro y recuperación de contraseña con Supabase Auth.
 */
export default function Login() {
  const { session, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/'

  // Modo: 'login' | 'register'
  const [mode, setMode] = useState('login')

  // Estados de Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Estados de Registro
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regRole, setRegRole] = useState('receptionist') // 'receptionist' | 'professional'
  const [regSpecialty, setRegSpecialty] = useState('')
  const [regSubmitting, setRegSubmitting] = useState(false)

  // Estados del modal "¿Olvidaste tu contraseña?"
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSending, setForgotSending] = useState(false)
  const [forgotMethod, setForgotMethod] = useState('email') // 'email' | 'admin'

  if (!loading && session) return <Navigate to={from} replace />

  /** Login submit */
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: signInError } = await signIn(email.trim(), password)
    setSubmitting(false)
    if (signInError) {
      setError(signInError)
      return
    }
    navigate(from, { replace: true })
  }

  /** Registro submit */
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      showWarning('Campos requeridos', 'Por favor completa todos los campos obligatorios.')
      return
    }

    if (regPassword.length < 6) {
      showWarning('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (regPassword !== regConfirmPassword) {
      showWarning('Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales.')
      return
    }

    setRegSubmitting(true)

    // 1. Verificar límite de 20 usuarios entre recepcionistas y profesionales
    if (supabase) {
      const { data: teamUsers, error: countErr } = await supabase
        .from('profiles')
        .select('id, role')
        .in('role', ['receptionist', 'professional'])

      if (!countErr && (teamUsers?.length || 0) >= 20) {
        setRegSubmitting(false)
        showWarning(
          'Límite de equipo alcanzado',
          'Se pueden cargar como máximo hasta 20 usuarios entre recepcionista y profesionales en este centro. Por favor contactá a la administración.'
        )
        return
      }
    }

    // 2. Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPassword,
      options: {
        data: {
          full_name: regFullName.trim(),
          role: regRole,
        },
      },
    })

    if (authError) {
      setRegSubmitting(false)
      showError('Error al registrarse', authError.message)
      return
    }

    // 3. Crear perfil en la tabla profiles
    if (authData?.user) {
      const { error: profErr } = await supabase
        .from('profiles')
        .upsert([
          {
            id: authData.user.id,
            full_name: regFullName.trim(),
            role: regRole,
          },
        ])

      if (profErr) {
        console.error('Error guardando perfil:', profErr)
      }

      // Si es profesional, agregarlo a la tabla professionals
      if (regRole === 'professional') {
        await supabase.from('professionals').insert([
          {
            name: regFullName.trim(),
            specialty: regSpecialty.trim() || 'Estética / Spa',
            active: true,
          },
        ])
      }
    }

    setRegSubmitting(false)
    showSuccess(
      '¡Registro exitoso!',
      `Tu cuenta como ${roleLabels[regRole] || regRole} fue creada. Ya podés ingresar a tu sesión.`
    )

    // Precargar email y volver a login
    setEmail(regEmail.trim())
    setPassword('')
    setMode('login')
  }

  /** Resetear contraseña por Email */
  const handleResetPasswordEmail = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      showWarning('Email requerido', 'Por favor ingresá tu correo electrónico.')
      return
    }

    setForgotSending(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim(),
      {
        redirectTo: window.location.origin + '/login',
      }
    )
    setForgotSending(false)

    if (resetError) {
      showError('Error al solicitar restablecimiento', resetError.message)
    } else {
      showSuccess(
        '¡Correo enviado!',
        'Revisá tu bandeja de entrada o spam. Te enviamos las instrucciones para restablecer tu contraseña.'
      )
      setIsForgotModalOpen(false)
      setForgotEmail('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-marfil p-4">
      <div className="w-full max-w-md rounded-2xl border border-arena bg-white p-8 shadow-sm">
        {/* Cabecera con Logo SVG */}
        <div className="text-center mb-6">
          <img
            src="/logo.svg"
            alt="BeautyFlow"
            className="mx-auto h-20 w-auto object-contain drop-shadow-sm"
          />
          <h1 className="mt-2 text-3xl font-semibold text-ingles">BeautyFlow</h1>
          <p className="mt-1 text-sm text-taupe">
            {mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta de usuario'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-4 rounded-lg bg-arena px-3 py-2 text-sm text-taupe">
            Falta configurar Supabase en <code>.env.local</code>.
          </p>
        )}

        {/* ----------------- VISTA DE INICIO DE SESIÓN ----------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                autoComplete="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <div>
              <Field label="Contraseña">
                <input
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setIsForgotModalOpen(true)
                  }}
                  className="text-xs font-semibold text-ingles hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isSupabaseConfigured || submitting}
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Button>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="pt-4 text-center text-xs text-taupe border-t border-arena">
              ¿No tenés cuenta en el equipo?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-semibold text-ingles hover:underline ml-1"
              >
                Registrate aquí
              </button>
            </div>
          </form>
        )}

        {/* ----------------- VISTA DE REGISTRO ----------------- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Selector de rol con dos opciones claras */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Deseo registrarme como: *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('receptionist')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'receptionist'
                      ? 'border-[#1F4638] bg-[#1F4638]/5 ring-2 ring-[#1F4638]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold text-ingles">Secretaria / Recepción</p>
                  <p className="text-[10px] text-taupe mt-0.5">Gestión de turnos, clientes y caja</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('professional')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'professional'
                      ? 'border-[#1F4638] bg-[#1F4638]/5 ring-2 ring-[#1F4638]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold text-ingles">Darse de alta como profesional</p>
                  <p className="text-[10px] text-taupe mt-0.5">Atención de citas y servicios</p>
                </button>
              </div>
              <p className="text-[11px] text-taupe mt-1.5">
                Nota: Tendrás acceso a tus tareas y agenda diaria. Las secciones de Configuración y Reportes son de acceso exclusivo para administración.
              </p>
            </div>

            <Field label="Nombre y Apellido *">
              <input
                type="text"
                required
                className="input"
                placeholder="Ej. Valeria Blanco"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
              />
            </Field>

            <Field label="Email *">
              <input
                type="email"
                required
                className="input"
                placeholder="valeria@ejemplo.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </Field>

            {regRole === 'professional' && (
              <Field label="Especialidad">
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Manicura, Masajes, Cosmetología"
                  value={regSpecialty}
                  onChange={(e) => setRegSpecialty(e.target.value)}
                />
              </Field>
            )}

            <Field label="Contraseña *">
              <input
                type="password"
                required
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </Field>

            <Field label="Confirmar Contraseña *">
              <input
                type="password"
                required
                className="input"
                placeholder="Repite la contraseña"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />
            </Field>

            <Button
              type="submit"
              className="w-full"
              disabled={!isSupabaseConfigured || regSubmitting}
            >
              {regSubmitting ? 'Registrando cuenta…' : 'Crear mi cuenta'}
            </Button>

            <div className="pt-4 text-center text-xs text-taupe border-t border-arena">
              ¿Ya tenés una cuenta registrada?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-ingles hover:underline ml-1"
              >
                Iniciá sesión aquí
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ----------------- MODAL OLVIDASTE TU CONTRASEÑA ----------------- */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold text-ingles">
                Recuperar Contraseña
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
              <button
                type="button"
                onClick={() => setForgotMethod('email')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  forgotMethod === 'email'
                    ? 'bg-[#1F4638] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Resetear por Mail
              </button>
              <button
                type="button"
                onClick={() => setForgotMethod('admin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  forgotMethod === 'admin'
                    ? 'bg-[#1F4638] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Escribir al Admin
              </button>
            </div>

            {forgotMethod === 'email' ? (
              <form onSubmit={handleResetPasswordEmail} className="space-y-4">
                <p className="text-xs text-taupe">
                  Ingresá tu correo electrónico para recibir un enlace de restablecimiento seguro.
                </p>
                <Field label="Correo electrónico">
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="tu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </Field>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsForgotModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={forgotSending}>
                    {forgotSending ? 'Enviando…' : 'Enviar enlace'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-taupe">
                  El administrador del centro puede reasignar tu contraseña directamente desde el panel de Configuración.
                </p>

                <div className="space-y-2 pt-2">
                  <a
                    href="https://wa.me/?text=Hola%2C+necesito+ayuda+para+recuperar+mi+contrase%C3%B1a+en+BeautyFlow"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <span>💬 Contactar por WhatsApp al Administrador</span>
                  </a>

                  <a
                    href={`mailto:admin@beautyflow.com?subject=Recuperaci%C3%B3n+de+contrase%C3%B1a+BeautyFlow&body=Hola%2C+necesito+ayuda+para+recuperar+el+acceso+a+mi+cuenta.+Mi+email+es%3A+${encodeURIComponent(
                      forgotEmail
                    )}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                  >
                    <span>✉️ Enviar Email al Administrador</span>
                  </a>
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsForgotModalOpen(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
