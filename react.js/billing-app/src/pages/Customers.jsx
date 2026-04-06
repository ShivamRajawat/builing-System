import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import PageSpinner from '../components/PageSpinner'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'
import { createCustomer, fetchCustomers } from '../services/api'

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

export default function Customers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [status, setStatus] = useState('Active')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchCustomers()
      setRows(list)
    } catch (e) {
      const d = e?.response?.data
      toast.error(d?.error ?? d?.message ?? 'Failed to load customers.')
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
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Please enter a customer name.')
      return
    }
    const payload = {
      name: trimmed,
      address: address.trim() || null,
      pan_number: panNumber.trim() || null,
      gst_number: gstNumber.trim() || null,
      status,
    }

    setSubmitting(true)
    try {
      await createCustomer(payload)
      toast.success('Customer added.')
      setName('')
      setAddress('')
      setPanNumber('')
      setGstNumber('')
      setStatus('Active')
      await load()
    } catch (err) {
      const d = err?.response?.data
      toast.error(d?.error ?? d?.message ?? 'Could not create customer.')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'address',
      label: 'Address',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-neutral-600">
          {row.address || '—'}
        </span>
      ),
    },
    {
      key: 'pan_number',
      label: 'PAN',
      render: (row) =>
        row.pan_number ? (
          <span className="font-mono text-sm text-neutral-800">{row.pan_number}</span>
        ) : (
          <span className="text-neutral-500">—</span>
        ),
    },
    {
      key: 'gst_number',
      label: 'GST number',
      render: (row) =>
        row.gst_number ? (
          <span className="font-mono text-sm text-neutral-800">{row.gst_number}</span>
        ) : (
          <span className="text-neutral-500">—</span>
        ),
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
          Customers
        </h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-500">
          Add walk-in or business customers. If a GST number is saved, invoices use catalog prices
          only (no extra 18% GST). Leave it empty to charge GST on the subtotal.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-neutral-900">Add customer</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Name (required). Address, PAN, GST optional. Status defaults to Active.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Customer name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              autoComplete="organization"
            />
            <Input
              label="Address (optional)"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city"
              autoComplete="street-address"
            />
            <Input
              label="PAN (optional)"
              name="pan_number"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              placeholder="ABCDE1234F"
              autoComplete="off"
            />
            <Input
              label="GST number (optional)"
              name="gst_number"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="15-character GSTIN"
              autoComplete="off"
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
              {submitting ? 'Saving…' : 'Add customer'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-3">
          {loading ? (
            <PageSpinner label="Loading customers…" />
          ) : (
            <Table columns={columns} rows={rows} emptyMessage="No customers yet. Add one on the left." />
          )}
        </div>
      </div>
    </div>
  )
}
