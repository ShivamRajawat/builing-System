import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import PageSpinner from '../components/PageSpinner'
import { fetchDashboardSummary } from '../services/api'

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)
}

function StatCard({ title, value, hint, icon }) {
  return (
    <Card accent className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
            {value}
          </p>
          {hint && <p className="mt-2 text-xs text-neutral-400">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchDashboardSummary()
        if (!cancelled) setStats(data)
      } catch (e) {
        if (!cancelled) {
          setStats({ totalCustomers: 0, totalItems: 0, totalRevenue: 0 })
          const d = e?.response?.data
          // BUG FIX: error message was showing port 3000, server is on 5000
          toast.error(
            d?.error ??
              d?.message ??
              'Could not load dashboard. Is the API running on port 5000?',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <PageSpinner label="Loading dashboard…" />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-500">
          Overview of your billing workspace. Figures update from your API or from list
          endpoints.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total customers"
          value={stats?.totalCustomers ?? 0}
          hint="Registered in the system"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Total items"
          value={stats?.totalItems ?? 0}
          hint="Products or services"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
        />
        <StatCard
          title="Total revenue"
          value={formatMoney(stats?.totalRevenue ?? 0)}
          hint="Sum of invoice totals"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>
    </div>
  )
}
