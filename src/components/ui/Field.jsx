/**
 * Campo de formulario con etiqueta y mensaje de error.
 * @param {{
 *   label: string,
 *   error?: string,
 *   hint?: string,
 *   children: import('react').ReactNode
 * }} props
 */
export default function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ingles">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-taupe">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  )
}
