import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
}

export default function Logs() {
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['logs', search],
    queryFn: async () => {
      const result = await api.getLogs({ search: search || undefined, limit: 100 });
      return result as unknown as LogEntry[];
    },
    refetchInterval: 5000,
  });

  const rows = query.data || [];

  return (
    <div>
      <h4 className="mb-3">Logs</h4>

      <input
        className="form-control mb-3"
        style={{ maxWidth: 300 }}
        placeholder="Search logs"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-responsive">
        <table className="table table-sm table-striped">
          <thead className="table-light">
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Level</th>
              <th scope="col">Source</th>
              <th scope="col">Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-3">No logs</td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  <td>{new Date(row.timestamp).toLocaleString()}</td>
                  <td>{row.level}</td>
                  <td>{row.source || '-'}</td>
                  <td>{row.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
