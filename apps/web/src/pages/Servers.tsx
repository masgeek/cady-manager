import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataTable, StatusBadge, ConfirmDialog } from '@caddy-manager/ui';
import type { Column } from '@caddy-manager/ui';
import type { Server } from '@caddy-manager/shared-types';
import type { ImportPreviewSite } from '@caddy-manager/shared-api';
import { api } from '../api/client';

const serverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hostname: z.string().min(1, 'Hostname is required'),
  apiEndpoint: z.string().url('Must be a valid URL'),
});

type ServerForm = z.infer<typeof serverSchema>;

const columns: Column<Server>[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'hostname', headerName: 'Hostname' },
  { field: 'apiEndpoint', headerName: 'API Endpoint' },
  {
    field: 'status',
    headerName: 'Status',
    render: (value) => <StatusBadge status={String(value)} />,
  },
  { field: 'version', headerName: 'Version' },
];

export default function Servers() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discoverUrl, setDiscoverUrl] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editServer, setEditServer] = useState<Server | null>(null);
  const [importPreview, setImportPreview] = useState<{ server: Server; sites: ImportPreviewSite[] } | null>(null);

  useEffect(() => {
    const modalOpen = dialogOpen || discoverOpen || !!importPreview || !!deleteId;
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [dialogOpen, discoverOpen, importPreview, deleteId]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServerForm>({
    resolver: zodResolver(serverSchema),
  });

  const query = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.getServers(),
  });

  useEffect(() => {
    if (editServer) {
      reset({
        name: editServer.name,
        hostname: editServer.hostname,
        apiEndpoint: editServer.apiEndpoint,
      });
    } else {
      reset({ name: '', hostname: '', apiEndpoint: '' });
    }
  }, [editServer, reset]);

  const createMutation = useMutation({
    mutationFn: (data: ServerForm) => api.createServer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setDialogOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ServerForm) => api.updateServer(editServer!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setDialogOpen(false);
      setEditServer(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteServer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setDeleteId(null);
    },
  });

  const healthMutation = useMutation({
    mutationFn: (id: string) => api.checkServerHealth(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: (id: string) => api.importServerSites(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setSnackbar(`${data.imported} site(s) imported, ${data.skipped} skipped`);
      setImportPreview(null);
    },
    onError: () => {
      setSnackbar('Failed to import sites');
    },
  });

  const previewImportMutation = useMutation({
    mutationFn: (server: Server) => api.previewServerSites(server.id),
    onSuccess: (sites, server) => setImportPreview({ server, sites }),
    onError: (error: Error) => setSnackbar(`Import preview failed: ${error.message}`),
  });

  const discoverMutation = useMutation({
    mutationFn: (url: string) => api.discoverServers(url),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setDiscoverOpen(false);
      setDiscoverUrl('');
      setSnackbar(`Discovered server "${data.server.name}" with ${data.imported} site(s) imported, ${data.skipped} skipped`);
    },
    onError: (err: Error) => {
      setSnackbar(`Discovery failed: ${err.message}`);
    },
  });

  const [snackbar, setSnackbar] = useState<string | null>(null);

  const rows = query.data || [];
  const onlineCount = rows.filter((server) => server.status === 'online').length;
  const attentionCount = rows.filter((server) => server.status !== 'online').length;

  const actionColumn: Column<Server> = {
    field: 'actions',
    headerName: 'Actions',
    render: (_, row) => (
      <div className="d-flex gap-1">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => healthMutation.mutate(row.id)}
          title="Check health"
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => { setEditServer(row); setDialogOpen(true); }}
          title="Edit"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className="btn btn-sm btn-outline-success"
           onClick={() => previewImportMutation.mutate(row)}
          title="Import sites from config"
        >
          <i className="bi bi-download"></i>
        </button>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => setDeleteId(row.id)}
          title="Delete"
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>
    ),
  };

  return (
    <div>
      <div className="page-heading">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <div className="page-eyebrow">Fleet control</div>
            <h1>Servers</h1>
            <p className="page-description">Your registered Caddy endpoints and the signal coming back from each one.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
            <i className="bi bi-plus-lg me-1"></i> Add server
          </button>
        </div>
        <div className="signal-strip">
          <strong>{onlineCount} of {rows.length} online</strong>
          <span className="ms-auto">{attentionCount} need attention</span>
          <span>Auto-refresh 30s</span>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="page-eyebrow mb-0">Registered endpoints</div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-info" onClick={() => setDiscoverOpen(true)}>
            <i className="bi bi-search me-1"></i> Discover
          </button>
        </div>
      </div>

      {query.isLoading && <div className="alert alert-info">Loading Caddy servers...</div>}
      {query.isError && (
        <div className="alert alert-danger">
          Failed to load servers: {query.error instanceof Error ? query.error.message : 'Request failed'}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => query.refetch()}>Retry</button>
        </div>
      )}
      {!query.isLoading && !query.isError && (
        <DataTable
          columns={[...columns, actionColumn]}
          rows={rows}
          getRowId={(r) => r.id}
        />
      )}

      {/* Add / Edit Server Modal */}
      {dialogOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit((data) =>
                  editServer ? updateMutation.mutate(data) : createMutation.mutate(data)
                )}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editServer ? 'Edit Server' : 'Add Server'}</h5>
                    <button type="button" className="btn-close" onClick={() => { setDialogOpen(false); setEditServer(null); }} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        {...register('name')}
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Hostname</label>
                      <input
                        {...register('hostname')}
                        className={`form-control ${errors.hostname ? 'is-invalid' : ''}`}
                      />
                      {errors.hostname && <div className="invalid-feedback">{errors.hostname.message}</div>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">API Endpoint</label>
                      <input
                        {...register('apiEndpoint')}
                        className={`form-control ${errors.apiEndpoint ? 'is-invalid' : ''}`}
                        placeholder="http://localhost:2019"
                      />
                      {errors.apiEndpoint && <div className="invalid-feedback">{errors.apiEndpoint.message}</div>}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setDialogOpen(false); setEditServer(null); }}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{editServer ? 'Update' : 'Create'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Discover Modal */}
      {discoverOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Discover & Import</h5>
                  <button type="button" className="btn-close" onClick={() => { setDiscoverOpen(false); setDiscoverUrl(''); }} />
                </div>
                <div className="modal-body">
                  <p className="text-muted small">Enter the Caddy admin API endpoint to auto-discover servers and import sites from the config.</p>
                  <div className="mb-3">
                    <label className="form-label">API Endpoint</label>
                    <input
                      className="form-control"
                      placeholder="http://localhost:2019"
                      value={discoverUrl}
                      onChange={(e) => setDiscoverUrl(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setDiscoverOpen(false); setDiscoverUrl(''); }}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-info"
                    disabled={!discoverUrl || discoverMutation.isPending}
                    onClick={() => discoverMutation.mutate(discoverUrl)}
                  >
                    {discoverMutation.isPending ? 'Discovering...' : 'Discover & Import'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Preview Modal */}
      {importPreview && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Import Sites from {importPreview.server.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setImportPreview(null)} />
                </div>
                <div className="modal-body">
                  {importPreview.sites.length === 0 ? (
                    <p className="text-muted mb-0">No reverse-proxy sites were found in the active Caddy configuration.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr><th>Domain</th><th>Upstream</th><th>Server Block</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {importPreview.sites.map((site) => (
                            <tr key={`${site.caddyServerName}:${site.domain}`}>
                              <td>{site.domain}</td>
                              <td>{site.upstream}</td>
                              <td>{site.caddyServerName}</td>
                              <td>{site.alreadyImported ? 'Already imported' : 'New'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setImportPreview(null)}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={importPreview.sites.length === 0 || importMutation.isPending}
                    onClick={() => importMutation.mutate(importPreview.server.id)}
                  >
                    {importMutation.isPending ? 'Importing...' : 'Import Sites'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Server"
        message="Are you sure you want to delete this server?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      {snackbar && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="alert alert-success alert-dismissible fade show mb-0">
            {snackbar}
            <button type="button" className="btn-close" onClick={() => setSnackbar(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
