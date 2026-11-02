import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Mensaje centrado para estados de carga o sin acceso.
 * @param {{ title: string, children?: import('react').ReactNode }} props
 */
function Notice({ title, children }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-semibold text-ingles">{title}</h2>
        {children && <div className="mt-3 space-y-4 text-sm text-taupe">{children}</div>}
      </div>
    </div>
  )
}

/**
 * Protege un grupo de rutas: exige sesión y, opcionalmente, un rol permitido.
 * En modo demostración (sin Supabase) deja pasar con rol de administrador.
 * @param {{ roles?: import('@/utils/roles').Role[] }} props
 */
export default function ProtectedRoute({ roles }) {
  const { session, role, isDemo, loading, profileError, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <Notice title="Cargando…" />

  if (!isDemo && !session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!role) {
    return (
      <Notice title="Tu usuario no tiene perfil">
        <p>{profileError ?? 'Pedile a un administrador que revise tu cuenta.'}</p>
        <Button variant="secondary" onClick={signOut}>Cerrar sesión</Button>
      </Notice>
    )
  }

  if (roles && !roles.includes(role)) {
    return (
      <Notice title="Sin acceso">
        <p>Tu rol no tiene permiso para ver esta sección.</p>
      </Notice>
    )
  }

  return <Outlet />
}
