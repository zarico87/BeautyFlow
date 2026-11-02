import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/dashboard/Dashboard'
import Appointments from '@/pages/appointments/Appointments'
import Clients from '@/pages/clients/Clients'
import Services from '@/pages/services/Services'
import Professionals from '@/pages/professionals/Professionals'
import Payments from '@/pages/payments/Payments'
import Reports from '@/pages/reports/Reports'
import Booking from '@/pages/booking/Booking'
import Settings from '@/pages/settings/Settings'
import ProtectedRoute from './ProtectedRoute'
import { ADMIN_ONLY, ALL_ROLES, FRONT_DESK } from '@/utils/roles'

export default function AppRoutes() {
  return (
    <Routes>
      {/* 🌐 RUTA PÚBLICA: Acceso directo sin contraseña para clientes */}
      <Route path="/reservar" element={<Booking />} />

      {/* 🔑 AUTENTICACIÓN */}
      <Route path="/login" element={<Login />} />

      {/* 🔐 RUTAS PRIVADAS (ADMINISTRACIÓN CON MENÚ LATERAL) */}
      <Route element={<ProtectedRoute roles={ALL_ROLES} />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="turnos" element={<Appointments />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="servicios" element={<Services />} />

          <Route element={<ProtectedRoute roles={FRONT_DESK} />}>
            <Route path="profesionales" element={<Professionals />} />
            <Route path="pagos" element={<Payments />} />
            <Route path="reservas" element={<Booking />} />
          </Route>

          <Route element={<ProtectedRoute roles={ADMIN_ONLY} />}>
            <Route path="reportes" element={<Reports />} />
            <Route path="configuracion" element={<Settings />} />
          </Route>

          <Route path="*" element={<Dashboard />} />
        </Route>
      </Route>
    </Routes>
  )
}