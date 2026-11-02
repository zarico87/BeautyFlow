import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/**
 * @typedef {import('@/utils/roles').Role} Role
 *
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} full_name
 * @property {Role} role
 *
 * @typedef {Object} AuthContextValue
 * @property {import('@supabase/supabase-js').Session | null} session
 * @property {Profile | null} profile
 * @property {Role | null} role
 * @property {boolean} isDemo           true si Supabase no está configurado
 * @property {boolean} loading          true mientras se resuelve sesión y perfil
 * @property {string | null} profileError
 * @property {(email: string, password: string) => Promise<{ error: string | null }>} signIn
 * @property {() => Promise<void>} signOut
 */

const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null))

/** Perfil ficticio para el modo demostración (sin Supabase). @type {Profile} */
const DEMO_PROFILE = { id: 'demo', full_name: 'Modo demostración', role: 'admin' }

/**
 * Traduce los errores de Supabase Auth más comunes.
 * @param {string} message
 */
function translateAuthError(message) {
  if (/invalid login credentials/i.test(message)) return 'Email o contraseña incorrectos.'
  if (/email not confirmed/i.test(message)) return 'Tenés que confirmar tu email antes de ingresar.'
  if (/rate limit|too many/i.test(message)) return 'Demasiados intentos. Esperá unos minutos.'
  return message
}

/**
 * Provee la sesión de Supabase Auth y el perfil (rol) del usuario.
 * La seguridad real la imponen las políticas RLS; esto solo adapta la interfaz.
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [session, setSession] = useState(/** @type {import('@supabase/supabase-js').Session | null} */ (null))
  const [profileState, setProfileState] = useState({
    userId: /** @type {string | null} */ (null),
    profile: /** @type {Profile | null} */ (null),
    error: /** @type {string | null} */ (null),
  })

  // Sesión: lectura inicial + cambios (login, logout, renovación de token).
  useEffect(() => {
    if (!supabase) return undefined
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setAuthReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  // Perfil: se vuelve a leer solo cuando cambia el usuario.
  const userId = session?.user?.id ?? null
  useEffect(() => {
    if (!supabase || !userId) return undefined
    let active = true

    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        setProfileState({ userId, profile: data ?? null, error: error?.message ?? null })
      })

    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(async (/** @type {string} */ email, /** @type {string} */ password) => {
    if (!supabase) return { error: 'Supabase no está configurado.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? translateAuthError(error.message) : null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfileState({ userId: null, profile: null, error: null })
  }, [])

  const profileLoading = Boolean(userId) && profileState.userId !== userId
  const loading = !authReady || profileLoading

  const profile = isSupabaseConfigured ? (userId && profileState.userId === userId ? profileState.profile : null) : DEMO_PROFILE

  const value = useMemo(
    () => ({
      session,
      profile,
      role: profile?.role ?? null,
      isDemo: !isSupabaseConfigured,
      loading,
      profileError: profileState.error,
      signIn,
      signOut,
    }),
    [session, profile, loading, profileState.error, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Accede a la sesión y al rol del usuario.
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
