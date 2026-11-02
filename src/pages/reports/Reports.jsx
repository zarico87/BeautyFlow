import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import { formatPrice } from '@/utils/dates'
import { supabase } from '@/lib/supabase'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    topServices: [],
  })

  const fetchReports = async () => {
    setLoading(true)

    // 1. Obtener total recaudado en pagos aprobados
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'aprobado')

    const totalRevenue = paymentsData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // 2. Obtener métricas de turnos
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('status, service_id, services(name)')

    const totalAppointments = appointmentsData?.length || 0
    const completedAppointments = appointmentsData?.filter((a) => a.status === 'completado').length || 0
    const cancelledAppointments = appointmentsData?.filter((a) => a.status === 'cancelado').length || 0

    // 3. Calcular servicios más demandados
    const serviceCounts = {}
    appointmentsData?.forEach((app) => {
      const name = app.services?.name || 'Otro'
      serviceCounts[name] = (serviceCounts[name] || 0) + 1
    })

    const topServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    setStats({
      totalRevenue,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      topServices,
    })

    setLoading(false)
  }

  useEffect(() => {
    fetchReports()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes y Estadísticas" subtitle="Resumen de rendimiento del centro" />

      {loading ? (
        <p className="text-sm text-taupe">Cargando métricas...</p>
      ) : (
        <>
          {/* Tarjetas de Métricas Principales */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs font-medium uppercase text-taupe">Recaudación Total</p>
              <p className="mt-2 text-2xl font-bold text-[#1F4638]">{formatPrice(stats.totalRevenue)}</p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium uppercase text-taupe">Total de Turnos</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium uppercase text-taupe">Turnos Completados</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.completedAppointments}</p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium uppercase text-taupe">Turnos Cancelados</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{stats.cancelledAppointments}</p>
            </Card>
          </div>

          {/* Desglose de Servicios */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Servicios Más Demandados">
              {stats.topServices.length === 0 ? (
                <p className="text-sm text-taupe">No hay datos de servicios aún.</p>
              ) : (
                <ul className="divide-y divide-arena">
                  {stats.topServices.map((service, idx) => (
                    <li key={idx} className="flex justify-between py-2 text-sm">
                      <span className="font-medium text-gray-700">{service.name}</span>
                      <span className="text-taupe">{service.count} reserva(s)</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}