import { useCallback, useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import PageSpinner from '../components/PageSpinner'
import Card from '../components/ui/Card'
import { fetchInvoices, fetchCustomers, fetchInvoiceById } from '../services/api'

function formatMoney(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Number(n) || 0)
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── PDF DOWNLOAD ─────────────────────────────────────────────
function downloadInvoicePDF(invoice, customer) {
  const gstLine = invoice.gst_applied
    ? `<tr><td style="padding:6px 10px;color:#555">GST (18%)</td><td style="padding:6px 10px;text-align:right">₹${Number(invoice.gst_amount).toFixed(2)}</td></tr>`
    : `<tr><td style="padding:6px 10px;color:#555">GST</td><td style="padding:6px 10px;text-align:right;color:#16a34a">Not Applicable</td></tr>`

  const itemRows = (invoice.items || []).map(item => `
    <tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:8px 10px">${item.item_id || item.item_code || '—'}</td>
      <td style="padding:8px 10px">${item.name || item.item_name || '—'}</td>
      <td style="padding:8px 10px;text-align:center">${item.quantity}</td>
      <td style="padding:8px 10px;text-align:right">₹${Number(item.unit_price).toFixed(2)}</td>
      <td style="padding:8px 10px;text-align:right">₹${Number(item.line_total).toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 30px; color: #111; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
    .company { font-size: 22px; font-weight: bold; color: #1a3c5e; }
    .company-sub { font-size: 12px; color: #666; margin-top: 4px; }
    .invoice-id { font-size: 18px; font-weight: bold; color: #1a3c5e; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-top: 6px; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-yellow { background: #fef9c3; color: #ca8a04; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 6px; }
    .customer-name { font-size: 15px; font-weight: bold; }
    .customer-detail { font-size: 13px; color: #555; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f4f6f9; }
    th { padding: 10px; text-align: left; font-size: 12px; color: #444; font-weight: 600; }
    .totals-table { width: 300px; margin-left: auto; margin-top: 16px; }
    .totals-table td { padding: 6px 10px; font-size: 13px; }
    .total-row { font-size: 15px; font-weight: bold; border-top: 2px solid #1a3c5e; }
    .total-row td { padding: 10px; color: #1a3c5e; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">LogiEdge Systems</div>
      <div class="company-sub">Billing Invoice</div>
    </div>
    <div style="text-align:right">
      <div class="invoice-id">${invoice.id}</div>
      <div style="font-size:13px;color:#666;margin-top:4px">${formatDate(invoice.created_at)}</div>
      <span class="badge ${invoice.gst_applied ? 'badge-yellow' : 'badge-green'}">
        ${invoice.gst_applied ? '18% GST Applied' : 'GST Exempt'}
      </span>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Bill To</div>
    <div class="customer-name">${customer?.name || invoice.customer_name || '—'}</div>
    ${customer?.address ? `<div class="customer-detail">${customer.address}</div>` : ''}
    ${customer?.gst_number ? `<div class="customer-detail">GSTIN: ${customer.gst_number}</div>` : ''}
  </div>
  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Item Code</th><th>Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="5" style="padding:12px;text-align:center;color:#aaa">No items</td></tr>'}
      </tbody>
    </table>
    <table class="totals-table">
      <tr><td style="color:#555">Subtotal</td><td style="text-align:right">₹${Number(invoice.subtotal).toFixed(2)}</td></tr>
      ${gstLine}
      <tr class="total-row">
        <td>Total</td><td style="text-align:right">₹${Number(invoice.total_amount).toFixed(2)}</td>
      </tr>
    </table>
  </div>
  <div class="footer">
    Thank you for your business! &bull; LogiEdge Systems &bull; Generated on ${new Date().toLocaleString('en-IN')}
  </div>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

// ─── VIEW MODAL ───────────────────────────────────────────────
function InvoiceModal({ invoice, customer, onClose }) {
  if (!invoice) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Invoice</p>
            <h2 className="text-xl font-bold font-mono text-neutral-900 mt-0.5">{invoice.id}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadInvoicePDF(invoice, customer)}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            <button onClick={onClose} className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50 transition-colors">
              <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Bill To</p>
              <p className="font-semibold text-neutral-900">{customer?.name || invoice.customer_name || '—'}</p>
              {customer?.address && <p className="text-sm text-neutral-500 mt-1">{customer.address}</p>}
              {customer?.gst_number && (
                <p className="text-xs font-mono text-neutral-500 mt-1">GSTIN: {customer.gst_number}</p>
              )}
            </div>
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Invoice Details</p>
              <p className="text-sm text-neutral-700"><span className="text-neutral-400">Date:</span> {formatDate(invoice.created_at)}</p>
              <p className="text-sm text-neutral-700 mt-1">
                <span className="text-neutral-400">GST:</span>{' '}
                {invoice.gst_applied
                  ? <span className="text-yellow-700 font-medium">18% Applied</span>
                  : <span className="text-emerald-700 font-medium">Exempt</span>
                }
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Items</p>
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Code</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Item</th>
                    <th className="px-4 py-3 text-center font-medium text-neutral-600">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-600">Unit Price</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(invoice.items || []).length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400 text-xs">No items</td></tr>
                  ) : (
                    (invoice.items || []).map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-mono text-xs text-neutral-500">{item.item_id || item.item_code || '—'}</td>
                        <td className="px-4 py-3 font-medium text-neutral-900">{item.name || item.item_name}</td>
                        <td className="px-4 py-3 text-center text-neutral-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{formatMoney(item.unit_price)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900">{formatMoney(item.line_total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{formatMoney(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>GST {invoice.gst_applied ? '(18%)' : '(not applicable)'}</span>
                <span className="tabular-nums font-medium">{formatMoney(invoice.gst_amount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-neutral-900 border-t border-neutral-200 pt-2 mt-2">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(invoice.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AllInvoices() {
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchId, setSearchId] = useState('')
  const [filterCust, setFilterCust] = useState('')
  const [viewInvoice, setViewInvoice] = useState(null)
  const [viewCustomer, setViewCustomer] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [inv, cust] = await Promise.all([
        fetchInvoices({ limit: 100 }),
        fetchCustomers(),
      ])
      setInvoices(inv)
      setCustomers(cust)
    } catch (e) {
      toast.error('Failed to load invoices.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Search + Filter
  const filtered = useMemo(() => {
    let list = [...invoices]
    if (searchId.trim()) {
      list = list.filter(i => i.id.toLowerCase().includes(searchId.trim().toLowerCase()))
    }
    if (filterCust) {
      list = list.filter(i => String(i.customer_id) === String(filterCust))
    }
    return list
  }, [invoices, searchId, filterCust])

  function getCustomer(customerId) {
    return customers.find(
      c => String(c.id) === String(customerId) || String(c.customer_id) === String(customerId)
    )
  }

  async function handleView(inv) {
    setViewLoading(true)
    try {
      // Fetch full invoice with items
      const full = await fetchInvoiceById(inv.id)
      const cust = getCustomer(inv.customer_id)
      setViewInvoice(full)
      setViewCustomer(cust)
    } catch (e) {
      // Fallback to list data if detail fetch fails
      setViewInvoice(inv)
      setViewCustomer(getCustomer(inv.customer_id))
      toast.error('Could not load full invoice details.')
    } finally {
      setViewLoading(false)
    }
  }

  if (loading) return <PageSpinner label="Loading invoices…" />

  return (
    <div className="space-y-6">
      {/* Modal */}
      {viewInvoice && (
        <InvoiceModal
          invoice={viewInvoice}
          customer={viewCustomer}
          onClose={() => { setViewInvoice(null); setViewCustomer(null) }}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            All Invoices
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Search + Filter */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Search by Invoice ID</label>
            <input
              type="text"
              placeholder="e.g. INVC224830"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Filter by Customer</label>
            <select
              value={filterCust}
              onChange={e => setFilterCust(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              <option value="">All Customers</option>
              {customers.map(c => (
                <option key={c.id || c.customer_id} value={c.id || c.customer_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {(searchId || filterCust) && (
            <button
              onClick={() => { setSearchId(''); setFilterCust('') }}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
        {(searchId || filterCust) && (
          <p className="mt-3 text-xs text-neutral-400">
            Showing {filtered.length} of {invoices.length} invoices
          </p>
        )}
      </Card>

      {/* Invoices Table */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-neutral-400 py-12 text-sm">
            {invoices.length === 0 ? 'No invoices yet. Create one from the Invoice page.' : 'No invoices match your search.'}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                <th className="px-4 py-3 font-medium text-neutral-600">Invoice ID</th>
                <th className="px-4 py-3 font-medium text-neutral-600">Customer</th>
                <th className="px-4 py-3 font-medium text-neutral-600">Date</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Subtotal</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">GST</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Total</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(inv => {
                const cust = getCustomer(inv.customer_id)
                return (
                  <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900 text-xs">
                      {inv.id}
                    </td>
                    <td className="px-4 py-3 text-neutral-900">
                      {cust?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {formatMoney(inv.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                      {inv.gst_applied ? formatMoney(inv.gst_amount) : <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-900">
                      {formatMoney(inv.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inv.gst_applied ? (
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">18% GST</span>
                      ) : (
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">Exempt</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => handleView(inv)}
                          disabled={viewLoading}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all disabled:opacity-50"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        {/* Download Button */}
                        <button
                          onClick={() => downloadInvoicePDF(inv, cust)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
