import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AuditEvent } from '@caddy-manager/shared-types';

const actionColors: Record<string, string> = {
  create: 'bg-success',
  update: 'bg-info',
  delete: 'bg-danger',
  reload: 'bg-warning text-dark',
  login: 'bg-secondary',
  logout: 'bg-secondary',
};

export default function Audit() {
  const query = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.getAuditLogs(),
  });

  const rows = query.data || [];

  return (
    <div>
      <h4 className="mb-3">Audit Trail</h4>

      <div className="table-responsive">
        <table className="table table-sm table-striped">
          <thead className="table-light">
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">User</th>
              <th scope="col">Action</th>
              <th scope="col">Entity</th>
              <th scope="col">Details</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-3">No audit events</td>
              </tr>
            ) : (
              rows.map((row: AuditEvent) => (
                <tr key={row.id}>
                  <td>{new Date(row.timestamp).toLocaleString()}</td>
                  <td>{row.userId}</td>
                  <td>
                    <span className={`badge ${actionColors[row.action] || 'bg-secondary'}`}>
                      {row.action}
                    </span>
                  </td>
                  <td>{row.entity}</td>
                  <td>{row.details || '-'}</td>
                  <td>
                    <span className={`badge ${row.result === 'success' ? 'bg-success' : 'bg-danger'}`}>
                      {row.result}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
