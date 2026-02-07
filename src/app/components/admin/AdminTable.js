'use client';

/**
 * Responsive table: renders as table on desktop, as stacked cards on mobile (< 768px).
 * @param {Object} props
 * @param {Array} props.columns - [{ key, label, render?: (row) => node }]
 * @param {Array} props.data - Array of row objects
 * @param {string} props.rowKey - Key to use for React key (default: 'id')
 * @param {React.ReactNode} props.children - Optional: header actions, extra content
 */
export default function AdminTable({ columns, data, rowKey = 'id', children }) {
  if (!data || data.length === 0) {
    return <div className="admin-table-empty">{children}</div>;
  }

  return (
    <div className="admin-table-responsive">
      {/* Desktop: table */}
      <div className="admin-table-desktop">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="admin-table-th">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row[rowKey] || row.id} className="admin-table-tr">
                {columns.map((col) => (
                  <td key={col.key} className="admin-table-td">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="admin-table-mobile">
        {data.map((row) => (
          <div key={row[rowKey] || row.id} className="admin-table-card">
            {columns.map((col) => (
              <div key={col.key} className="admin-table-card-row">
                <span className="admin-table-card-label">{col.label}</span>
                <span className="admin-table-card-value">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
