import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_ONLY, ALL_ROLES, FRONT_DESK, roleLabels } from '@/utils/roles'

/** Módulos de navegación del panel administrativo. */
export const navItems = [
  { to: '/', label: 'Dashboard', end: true, roles: ALL_ROLES },
  { to: '/turnos', label: 'Agenda de turnos', roles: ALL_ROLES },
  { to: '/clientes', label: 'Clientes', roles: ALL_ROLES },
  { to: '/servicios', label: 'Servicios', roles: ALL_ROLES },
  { to: '/profesionales', label: 'Profesionales', roles: FRONT_DESK },
  { to: '/pagos', label: 'Pagos', roles: FRONT_DESK },
  { to: '/reportes', label: 'Reportes', roles: ADMIN_ONLY },
  { to: '/reservas', label: 'Reservas online', roles: FRONT_DESK },
  { to: '/configuracion', label: 'Configuración', roles: ADMIN_ONLY },
]

/**
 * Menú lateral. En pantallas chicas funciona como cajón deslizable.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function Sidebar({ open, onClose }) {
  const { role, profile, session, isDemo, signOut } = useAuth()
  const visibleItems = navItems.filter((item) => role && item.roles.includes(role))
  const displayName = profile?.full_name || session?.user?.email || ''

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ingles text-marfil transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <img src="/logo.svg" alt="" className="h-9 w-9 rounded-lg" />
          <div>
            <p className="font-display text-2xl font-semibold leading-none">BeautyFlow</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-nude">Spa & Beauty</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-marfil text-ingles font-medium' : 'text-arena hover:bg-ingles-light'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ingles-light px-6 py-4 text-xs text-nude">
          {isDemo ? (
            <p>v0.2.0 · modo demostración</p>
          ) : (
            <>
              <p className="truncate text-sm text-marfil" title={displayName}>{displayName}</p>
              <p className="mt-0.5">{role ? roleLabels[role] : ''}</p>
              <button onClick={signOut} className="mt-3 text-arena underline-offset-2 hover:underline">
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
