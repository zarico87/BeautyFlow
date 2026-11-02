import Card from './Card'

/**
 * Tabla simple de solo lectura para los módulos todavía en desarrollo.
 * @param {{
 *   title: string,
 *   columns: { key: string, label: string, render?: (row: any) => import('react').ReactNode }[],
 *   rows: any[],
 *   note?: string
 * }} props
 */
export default function DataTable({ title, columns, rows, note }) {
  return (
    <Card title={title}>
      {note && <p className="mb-4 text-sm text-taupe">{note}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-arena text-taupe">
              {columns.map((c) => (
                <th key={c.key} className="py-2 pr-4 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-arena/60 last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className="py-3 pr-4">
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
