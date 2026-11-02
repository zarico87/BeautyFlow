import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { useApp } from '@/contexts/AppContext'
import { dateISO, formatDate, formatPrice } from '@/utils/dates'

/**
 * @param {{ label: string, value: string | number, hint?: string }} props
 */
function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-arena bg-white p-5 shadow-sm">
      <p className="text-sm text-taupe">{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold text-ingles">{value}</p>
      {hint && <p className="mt-1 text-xs text-taupe">{hint}</p>}
    </div>
  )
}

/** Resumen general del día. */
export default function Dashboard() {
  const { appointments, clients, services, professionals } = useApp()
  const today = dateISO(0)

  const todays = appointments
    .filter((a) => a.date === today && a.status !== 'cancelado')
    .sort((a, b) => a.start.localeCompare(b.start))
  const upcoming = appointments.filter((a) => a.date > today && a.status !== 'cancelado')

  const revenue = todays
    .filter((a) => a.status === 'completado')
    .reduce((sum, a) => sum + (services.find((s) => s.id === a.serviceId)?.price ?? 0), 0)

  return (
    <>
      <PageHeader title="Buen día" subtitle={formatDate(today)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Turnos de hoy" value={todays.length} />
        <Stat label="Próximos turnos" value={upcoming.length} />
        <Stat label="Facturado hoy" value={formatPrice(revenue)} hint="Turnos completados" />
        <Stat label="Clientes" value={clients.length} />
      </div>

      <Card
        title="Agenda de hoy"
        className="mt-6"
        action={
          <Link to="/turnos" className="text-sm font-medium text-ingles underline">
            Ver agenda completa
          </Link>
        }
      >
        {todays.length === 0 ? (
          <p className="text-sm text-taupe">No hay turnos para hoy.</p>
        ) : (
          <ul className="divide-y divide-arena">
            {todays.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">
                    {a.start} · {clients.find((c) => c.id === a.clientId)?.name}
                  </p>
                  <p className="text-sm text-taupe">
                    {services.find((s) => s.id === a.serviceId)?.name} ·{' '}
                    {professionals.find((p) => p.id === a.professionalId)?.name}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
