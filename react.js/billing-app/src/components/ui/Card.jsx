export default function Card({ children, className = '', accent = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-neutral-100/80 bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-soft ${
        accent ? 'ring-1 ring-accent/10' : ''
      } ${className}`}
    >
      {accent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-accent/0 via-accent to-accent/0 opacity-90" />
      )}
      {children}
    </div>
  )
}
