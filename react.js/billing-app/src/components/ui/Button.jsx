export default function Button({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const variants = {
    primary:
      'bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow-md active:scale-[0.98]',
    secondary:
      'border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:border-accent/40 hover:bg-accent-muted',
    ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
    danger:
      'border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-500',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
