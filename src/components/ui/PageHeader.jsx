/**
 * Encabezado de página.
 * @param {{ title: string, subtitle?: string }} props
 */
export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-semibold text-ingles">{title}</h1>
      {subtitle && <p className="mt-1 text-sm capitalize text-taupe">{subtitle}</p>}
    </div>
  )
}
