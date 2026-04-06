import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageSpinner from '../components/PageSpinner'
import Select from '../components/ui/Select'
import { GST_RATE, createInvoice, fetchCustomers, fetchItems } from '../services/api'

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
  }).format(Number(n) || 0)
}

/** Non-empty gst_number → no extra GST on invoice (matches API). */
function customerHasGstNumber(customer) {
  if (!customer?.gst_number) return false
  return String(customer.gst_number).trim().length > 0
}

export default function Invoices() {
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [quantities, setQuantities] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, i] = await Promise.all([fetchCustomers(), fetchItems()])
      setCustomers(c)
      setItems(i)
      const billable = i.filter((it) => it.status !== 'Inactive')
      setQuantities(Object.fromEntries(billable.map((it) => [String(it.id), 0])))
    } catch (e) {
      const d = e?.response?.data
      toast.error(d?.error ?? d?.message ?? 'Failed to load customers or items.')
      setCustomers([])
      setItems([])
      setQuantities({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(customerId)),
    [customers, customerId],
  )

  const billableItems = useMemo(
    () => items.filter((it) => it.status !== 'Inactive'),
    [items],
  )

  const billableCustomers = useMemo(
    () => customers.filter((c) => c.status !== 'Inactive'),
    [customers],
  )

  const hasGst = customerHasGstNumber(selectedCustomer)
  const chargeGst = selectedCustomer != null && !hasGst

  const { previewRows, subtotal, gstAmount, total } = useMemo(() => {
    const previewRows = []
    let rawSubtotal = 0
    for (const item of billableItems) {
      const id = String(item.id)
      const qty = Math.max(0, Math.floor(Number(quantities[id]) || 0))
      if (qty < 1) continue
      const unit = Number(item.price) || 0
      const lineTotal = unit * qty
      rawSubtotal += lineTotal
      previewRows.push({
        id,
        item_code: item.item_code,
        name: item.name,
        qty,
        unit,
        lineTotal,
      })
    }
    const subtotal = Math.round(rawSubtotal * 100) / 100
    const gstAmount = chargeGst ? Math.round(subtotal * GST_RATE * 100) / 100 : 0
    const total = Math.round((subtotal + gstAmount) * 100) / 100
    return { previewRows, subtotal, gstAmount, total }
  }, [billableItems, quantities, chargeGst])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customerId) {
      toast.error('Select a customer.')
      return
    }
    const payloadLines = billableItems
      .map((it) => ({
        itemId: it.id,
        quantity: Math.max(0, Math.floor(Number(quantities[String(it.id)]) || 0)),
      }))
      .filter((l) => l.quantity > 0)
    if (!payloadLines.length) {
      toast.error('Enter quantity for at least one item.')
      return
    }
    setSubmitting(true)
    try {
      await createInvoice({
        customerId,
        lines: payloadLines,
      })
      toast.success('Invoice created.')
      setCustomerId('')
      setQuantities(
        Object.fromEntries(billableItems.map((it) => [String(it.id), 0])),
      )
    } catch (err) {
      const d = err?.response?.data
      toast.error(d?.error ?? d?.message ?? 'Could not create invoice.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageSpinner label="Loading invoice data…" />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Invoice
        </h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-900">
          Select a customer, set quantities from your catalog, and create the bill.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="shadow-card">
            <h2 className="text-base font-semibold text-neutral-900">Customer</h2>
            <p className="mt-1 text-sm text-neutral-900/70">
              Customers with a GST number are billed at catalog prices only. Without a GST number,
              {GST_RATE * 100}% GST is added to the subtotal.
            </p>
            <div className="mt-6">
              <Select
                label="Bill to"
                name="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer…</option>
                {billableCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {customerHasGstNumber(c) ? ' (has GSTIN)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card className="shadow-card">
            <h2 className="text-base font-semibold text-neutral-900">Items</h2>
            <p className="mt-1 text-sm text-neutral-900/70">
              Adjust quantity for each product. Only items with quantity greater than zero are
              included.
            </p>

            {billableItems.length === 0 ? (
              <p className="mt-6 text-sm text-neutral-900">
                No active items in catalog. Activate an item on the Catalog page.
              </p>
            ) : (
              <ul className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
                {billableItems.map((it) => {
                  const id = String(it.id)
                  const q = quantities[id]
                  return (
                    <li
                      key={id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900">
                          {it.item_code ? (
                            <>
                              <span className="font-mono text-neutral-600">{it.item_code}</span>{' '}
                            </>
                          ) : null}
                          {it.name}
                        </p>
                        <p className="mt-0.5 text-sm tabular-nums text-neutral-900">
                          {formatMoney(it.price)} <span className="text-neutral-900/60">each</span>
                        </p>
                      </div>
                      <div className="flex w-full items-center gap-3 sm:w-36 sm:shrink-0">
                        <label className="sr-only" htmlFor={`qty-${id}`}>
                          Quantity for {it.name}
                        </label>
                        <input
                          id={`qty-${id}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={q ?? 0}
                          onChange={(e) => {
                            const n =
                              e.target.value === ''
                                ? 0
                                : Math.max(0, Math.floor(Number(e.target.value)) || 0)
                            setQuantities((prev) => ({ ...prev, [id]: n }))
                          }}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 tabular-nums shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <Button type="submit" disabled={submitting || billableItems.length === 0} className="mt-6">
              {submitting ? 'Creating…' : 'Create invoice'}
            </Button>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24 border-neutral-200 shadow-card">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                  Summary
                </p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-900">Totals</h2>
              </div>
              <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-900">
                Draft
              </span>
            </div>

            <div className="mt-6 space-y-1 text-sm">
              <p className="text-neutral-900/60">Bill to</p>
              <p className="font-medium text-neutral-900">{selectedCustomer?.name ?? '—'}</p>
              {selectedCustomer && (
                <p className="text-xs text-neutral-900/70">
                  {hasGst
                    ? 'GST number on file — no additional GST on this invoice.'
                    : `No GST number — ${GST_RATE * 100}% GST added to subtotal.`}
                </p>
              )}
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left text-neutral-900">
                    <th className="px-4 py-2.5 font-medium">Item</th>
                    <th className="px-4 py-2.5 font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {previewRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-neutral-900/50">
                        Set quantities to see line totals
                      </td>
                    </tr>
                  ) : (
                    previewRows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          {r.item_code ? (
                            <span className="mr-2 font-mono text-xs text-neutral-500">
                              {r.item_code}
                            </span>
                          ) : null}
                          {r.name}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-neutral-900">{r.qty}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-neutral-900">
                          {formatMoney(r.lineTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <dl className="mt-6 space-y-3 border-t border-neutral-200 pt-6 text-sm">
              <div className="flex justify-between text-neutral-900">
                <dt>Subtotal</dt>
                <dd className="tabular-nums font-medium">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-neutral-900">
                <dt>GST {chargeGst ? `(${GST_RATE * 100}%)` : '(not applicable)'}</dt>
                <dd className="tabular-nums font-medium">{formatMoney(gstAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-3 text-base text-neutral-900">
                <dt className="font-semibold">Total</dt>
                <dd className="tabular-nums font-semibold">{formatMoney(total)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </form>
    </div>
  )
}
