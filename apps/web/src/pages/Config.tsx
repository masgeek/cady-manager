import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JsonViewer } from '@caddy-manager/ui';
import { api } from '../api/client';

export default function Config() {
  const queryClient = useQueryClient();
  const [serverId, setServerId] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const serversQuery = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.getServers(),
  });

  const configQuery = useQuery({
    queryKey: ['config', serverId],
    queryFn: () => api.getConfig(serverId),
    enabled: !!serverId,
  });

  const reloadMutation = useMutation({
    mutationFn: () =>
      api.reloadConfig(serverId),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Configuration reloaded successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['config', serverId] });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to reload configuration', severity: 'error' });
    },
  });

  const servers = serversQuery.data || [];

  return (
    <div>
      <h4 className="mb-3">Configuration</h4>

      <div className="d-flex gap-2 mb-3 align-items-center">
        <select
          className="form-select"
          style={{ maxWidth: 250 }}
          value={serverId}
          onChange={(e) => setServerId(e.target.value)}
        >
          <option value="">Select a server...</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          onClick={() => reloadMutation.mutate()}
          disabled={!serverId || reloadMutation.isPending}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Reload Config
        </button>
      </div>

      {configQuery.data && (
        <JsonViewer data={configQuery.data} title="Active Configuration" />
      )}

      {snackbar.open && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`alert alert-${snackbar.severity === 'error' ? 'danger' : 'success'} alert-dismissible fade show mb-0`}>
            {snackbar.message}
            <button type="button" className="btn-close" onClick={() => setSnackbar({ ...snackbar, open: false })} />
          </div>
        </div>
      )}
    </div>
  );
}
