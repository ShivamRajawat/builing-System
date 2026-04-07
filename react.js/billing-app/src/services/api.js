import axios from 'axios'

// BUG FIX: was defaulting to port 3000 but server runs on 5000
const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api' : '')

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (data?.customers) return data.customers
  if (data?.items) return data.items
  if (data?.invoices) return data.invoices
  if (data?.data && Array.isArray(data.data)) return data.data
  return []
}

export async function fetchCustomers() {
  const { data } = await api.get('/customers')
  return unwrapList(data)
}

export async function createCustomer(payload) {
  const { data } = await api.post('/customers', payload)
  return data?.customer ?? data
}

export async function updateCustomer(id, payload) {
  const { data } = await api.put(`/customers/${id}`, payload)
  return data
}

export async function deleteCustomer(id) {
  const { data } = await api.delete(`/customers/${id}`)
  return data
}

export async function fetchItems() {
  const { data } = await api.get('/items')
  return unwrapList(data)
}

export async function createItem(payload) {
  const { data } = await api.post('/items', payload)
  return data?.item ?? data
}

export async function updateItem(itemId, payload) {
  const { data } = await api.put(`/items/${encodeURIComponent(itemId)}`, payload)
  return data
}

export async function deleteItem(itemId) {
  const { data } = await api.delete(`/items/${encodeURIComponent(itemId)}`)
  return data
}

export async function fetchInvoices(params = {}) {
  const { data } = await api.get('/invoices', { params })
  return unwrapList(data)
}

export async function fetchInvoiceById(invoiceId) {
  const { data } = await api.get(`/invoices/${encodeURIComponent(invoiceId)}`)
  return data
}

export async function createInvoice(payload) {
  const { customerId, lines } = payload
  const body = {
    customer_id: Number(customerId),
    items: (lines ?? []).map((l) => ({
      item_id: String(l.itemId),
      quantity: Number(l.quantity),
    })),
  }
  const { data } = await api.post('/invoice', body)
  return data?.invoice ?? data
}

export async function fetchDashboardSummary() {
  try {
    const { data } = await api.get('/dashboard/summary')
    if (
      data &&
      typeof data.totalCustomers === 'number' &&
      typeof data.totalItems === 'number' &&
      typeof data.totalRevenue === 'number'
    ) {
      return data
    }
  } catch {
    /* use fallback */
  }

  const [customers, items, invoices] = await Promise.all([
    fetchCustomers().catch(() => []),
    fetchItems().catch(() => []),
    fetchInvoices({ limit: 500 }).catch(() => []),
  ])

  const totalRevenue = invoices.reduce((sum, inv) => {
    const v = Number(
      inv.total_amount ?? inv.total ?? inv.amount ?? inv.grandTotal ?? 0,
    )
    return sum + (Number.isFinite(v) ? v : 0)
  }, 0)

  return {
    totalCustomers: customers.length,
    totalItems: items.length,
    totalRevenue,
  }
}

export const GST_RATE = 0.18