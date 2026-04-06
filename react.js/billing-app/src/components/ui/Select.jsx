export default function Select({
  label,
  id,
  error,
  children,
  className = '',
  containerClassName = '',
  ...props
}) {
  const selectId = id ?? props.name
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
