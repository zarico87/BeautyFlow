import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Indica si las credenciales de Supabase están configuradas. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Cliente de Supabase, o `null` si falta configuración (modo demostración).
 * Solo se usa la clave pública (anon); la seguridad real la imponen las
 * políticas RLS definidas en supabase/migrations.
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

/**
 * Crea un cliente temporal sin persistencia de sesión.
 * Útil para que un administrador registre usuarios con signUp()
 * sin que se sobrescriba su propia sesión activa en el navegador.
 */
export function createTransientClient() {
  if (!isSupabaseConfigured) return null
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
