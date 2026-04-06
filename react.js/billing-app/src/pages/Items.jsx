import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import PageSpinner from '../components/PageSpinner'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import { createItem, fetchItems } from '../services/api'

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
  }).format(Number(n) || 0)
}

function statusBadge(status) {
  const active = status === 'Active'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function Items() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [itemId, setItemId] = useState('')
  const [itemName, setItemName] = useState('')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState('Active')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchItems()
      setRows(list)
    } catch (e) {
      const d = e?.response?.data
      toast.error(d?.error ?? d?.message ?? 'Failed to load items.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSubmit(e) {
    e.preventDefault()
    const code = itemId.trim().toUpperCase()
    const trimmedName = itemName.trim()
    const p = Number(price)
    if (!code) {
      toast.error('Please enter an item code (e.g. IT00008).')
      return
    }
    if (!trimmedName) {
      toast.error('Please enter an item name.')
      return
    }
    if (!Number.isFinite(p) || p < 0) {
      toast.error('Enter a valid price.')
      return
    }
    setSubmitting(true)
    try {
      await createItem({
        item_id: code,
        item_name: trimmedName,
        price: p,
        status,
      })
      toast.success('Item added.')
      setItemId('')
      setItemName('')
      setPrice('')
      setStatus('Active')
      await load()
    } catch (err) {
      const d = err?.response?.data
      toast.error(d?.error ?? d?.message ?? 'Could not create item.')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'item_code', label: 'Code' },
    { key: 'name', label: 'Name' },
    {
      key: 'price',
      label: 'Price',
      render: (row) => formatMoney(row.price),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => statusBadge(row.status),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Catalog
        </h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-500">
          Item master for invoicing. Use a unique code (e.g. IT00008) and set Active/Inactive for
          billing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-neutral-900">Add item</h2>
          <p className="mt-1 text-sm text-neutral-500">Code, name, price, and status.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Item code"
              name="item_id"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              placeholder="IT00008"
              autoComplete="off"
            />
            <Input
              label="Item name"
              name="item_name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Product name"
            />
            <Input
              label="Price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
            <Select
              label="Status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Saving…' : 'Add item'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-3">
          {loading ? (
            <PageSpinner label="Loading catalog…" />
          ) : (
            <Table
              columns={columns}
              rows={rows}
              emptyMessage="No items returned from the API. Run schema.sql on MySQL."
            />
          )}
        </div>
      </div>
    </div>
  )
}
