import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AuditEvent } from '@caddy-manager/shared-types';

export default function Audit() {
  const query = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.getAuditLogs(),
  });

  const rows = query.data || [];
  const failures = rows.filter((row) => row.result === 'failure').length;
  const successes = rows.length - failures;

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">Accountability</div>
          <h1>Audit trail</h1>
          <p className="page-description">A quiet record of who changed infrastructure and what happened next.</p>
        </div>
        <div className="signal-strip">
          <strong>{successes} successful actions</strong>
          <span className="ms-auto">{failures ? `${failures} failed` : 'No failures recorded'}</span>
          <span>Latest 100 events</span>
        </div>
      </div>

      {query.isLoading && <div className="alert alert-info">Loading audit events...</div>}
      {query.isError && (
        <div className="alert alert-danger">
          Failed to load audit events: {query.error instanceof Error ? query.error.message : 'Request failed'}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => query.refetch()}>Retry</button>
        </div>
      )}

      {!query.isLoading && !query.isError && <div className="table-responsive">
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
                <td colSpan={6}>
                  <div className="empty-panel"><i className="bi bi-clock-history"></i><span>No audit events recorded yet.</span></div>
                </td>
              </tr>
            ) : (
              rows.map((row: AuditEvent) => (
                <tr key={row.id}>
                  <td>{new Date(row.timestamp).toLocaleString()}</td>
                  <td><code>{row.userId}</code></td>
                  <td><span className={`audit-action ${row.action}`}>{row.action}</span></td>
                  <td>{row.entity}</td>
                  <td>
                    {row.details ? (
                      <details className="audit-details">
                        <summary>View details</summary>
                        <div>{row.details}</div>
                      </details>
                    ) : <span className="text-muted">-</span>}
                  </td>
                  <td><span className={`audit-result ${row.result}`}>{row.result}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
