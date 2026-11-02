import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { isSupabaseConfigured } from '@/lib/supabase'

/** Estructura general del panel: menú lateral + contenido. */
export default function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-arena bg-marfil/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-ingles hover:bg-arena"
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-display text-xl font-semibold text-ingles">BeautyFlow</span>
        </header>

        <main className="mx-auto max-w-6xl p-4 sm:p-8">
          {!isSupabaseConfigured && (
            <p className="mb-6 rounded-lg bg-arena px-4 py-2 text-sm text-taupe">
              Supabase no está configurado: la app usa datos de demostración. Copiá{' '}
              <code>.env.example</code> como <code>.env.local</code> para conectarlo.
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
