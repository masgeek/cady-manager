import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataTable, StatusBadge, ConfirmDialog } from '@caddy-manager/ui';
import type { Column } from '@caddy-manager/ui';
import type { Server } from '@caddy-manager/shared-types';
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
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServerForm>({
    resolver: zodResolver(serverSchema),
  });

  const query = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.getServers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ServerForm) => api.createServer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setDialogOpen(false);
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
    },
    onError: () => {
      setSnackbar('Failed to import sites');
    },
  });

  const [snackbar, setSnackbar] = useState<string | null>(null);

  const rows = query.data || [];

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
          className="btn btn-sm btn-outline-success"
          onClick={() => importMutation.mutate(row.id)}
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Servers</h4>
        <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
          <i className="bi bi-plus-circle me-1"></i> Add Server
        </button>
      </div>

      <DataTable
        columns={[...columns, actionColumn]}
        rows={rows}
        getRowId={(r) => r.id}
      />

      {/* Add Server Modal */}
      {dialogOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
                  <div className="modal-header">
                    <h5 className="modal-title">Add Server</h5>
                    <button type="button" className="btn-close" onClick={() => setDialogOpen(false)} />
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
                    <button type="button" className="btn btn-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Create</button>
                  </div>
                </form>
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
