const variants = {
  primary: 'bg-ingles text-marfil hover:bg-ingles-light',
  secondary: 'bg-arena text-ingles hover:bg-nude/50',
  ghost: 'text-ingles hover:bg-arena/60',
  danger: 'bg-red-700 text-white hover:bg-red-800',
}

/**
 * Botón con variantes de la paleta BeautyFlow.
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement> & {
 *   variant?: 'primary'|'secondary'|'ghost'|'danger'
 * }} props
 */
export default function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
