/**
 * Tarjeta contenedora.
 * @param {{ title?: string, action?: import('react').ReactNode, className?: string, children: import('react').ReactNode }} props
 */
export default function Card({ title, action, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-arena bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-xl font-semibold text-ingles">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
