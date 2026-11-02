import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Field from '@/components/ui/Field'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

/** Pantalla de acceso con Supabase Auth (email y contraseña). */
export default function Login() {
  const { session, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to={from} replace />

  /** @param {import('react').FormEvent} e */
  const handleSubmit = async (e) => {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-marfil p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-arena bg-white p-8 shadow-sm">
        <div className="text-center">
          <img src="/logo.svg" alt="" className="mx-auto h-12 w-12 rounded-xl" />
          <h1 className="mt-3 text-3xl font-semibold text-ingles">BeautyFlow</h1>
          <p className="mt-1 text-sm text-taupe">Ingresá a tu cuenta</p>
        </div>

        {!isSupabaseConfigured && (
          <p className="rounded-lg bg-arena px-3 py-2 text-sm text-taupe">
            Falta configurar Supabase en <code>.env.local</code>.
          </p>
        )}

        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Button type="submit" className="w-full" disabled={!isSupabaseConfigured || submitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </Button>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
