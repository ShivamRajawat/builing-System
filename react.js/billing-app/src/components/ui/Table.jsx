export default function Table({ columns, rows, emptyMessage = 'No data yet.' }) {
  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-12 text-center text-sm text-neutral-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-100 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-semibold text-neutral-600 first:pl-6 last:pr-6"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              className="transition-colors duration-150 hover:bg-accent-muted/60"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3.5 text-neutral-800 first:pl-6 last:pr-6"
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
