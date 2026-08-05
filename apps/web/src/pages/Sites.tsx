import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DataTable, StatusBadge, ConfirmDialog } from '@caddy-manager/ui';
import type { Column } from '@caddy-manager/ui';
import type { Site } from '@caddy-manager/shared-types';
import { api } from '../api/client';

const columns: Column<Site>[] = [
  { field: 'domain', headerName: 'Domain' },
  { field: 'routeId', headerName: '@id' },
  { field: 'upstream', headerName: 'Upstream' },
  {
    field: 'synced',
    headerName: 'In Config',
    render: (value) =>
      value ? (
        <i className="bi bi-check-circle text-success"></i>
      ) : (
        <i className="bi bi-x-circle text-danger"></i>
      ),
  },
  {
    field: 'tlsEnabled',
    headerName: 'TLS',
    render: (value) => (value ? 'Yes' : 'No'),
  },
  {
    field: 'status',
    headerName: 'Status',
    render: (value, row) => (
      <div>
        <StatusBadge status={String(value)} />
        {row.statusDetail && (
          <div className="small text-muted text-truncate" style={{ maxWidth: 220 }} title={row.statusDetail}>
            {row.statusDetail}
          </div>
        )}
      </div>
    ),
  },
];

export default function Sites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['sites'],
    queryFn: () => api.getSites(),
    refetchInterval: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setDeleteId(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.syncSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: () => api.reconcileSites(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });

  const rows = query.data || [];
  const identifiedRows = rows.filter((row) => row.routeId);
  const unidentifiedRows = rows.filter((row) => !row.routeId);

  const actionColumn: Column<Site> = {
    field: 'actions',
    headerName: 'Actions',
    render: (_, row) => (
      <div className="d-flex gap-1">
        {!row.synced && (
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => syncMutation.mutate(row.id)}
            title="Push to Caddy config"
          >
            <i className="bi bi-cloud-upload"></i>
          </button>
        )}
        <button
          className="btn btn-sm btn-outline-primary"
          disabled={!row.routeId}
          onClick={() => navigate(`/sites/${row.id}/edit`)}
          title={!row.routeId ? 'Sync to Caddy first' : 'Edit'}
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className="btn btn-sm btn-outline-danger"
          disabled={!row.routeId}
          onClick={() => setDeleteId(row.id)}
          title={!row.routeId ? 'Sync to Caddy first' : 'Delete'}
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>
    ),
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Sites</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success"
            onClick={() => reconcileMutation.mutate()}
            disabled={reconcileMutation.isPending}
            title="Recreate missing routes in Caddy"
          >
            <i className="bi bi-arrow-repeat me-1"></i>
            {reconcileMutation.isPending ? 'Reconciling...' : 'Reconcile Routes'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/sites/new')}>
            <i className="bi bi-plus-circle me-1"></i> Add Site
          </button>
        </div>
      </div>

      <DataTable
        columns={[...columns, actionColumn]}
        rows={identifiedRows}
        getRowId={(r) => r.id}
      />

      {unidentifiedRows.length > 0 && (
        <details className="mt-3">
          <summary className="text-muted" style={{ cursor: 'pointer' }}>
            Sites without @id ({unidentifiedRows.length})
          </summary>
          <div className="mt-2">
            <DataTable
              columns={[...columns, actionColumn]}
              rows={unidentifiedRows}
              getRowId={(r) => r.id}
            />
          </div>
        </details>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Site"
        message="Are you sure you want to delete this site?"
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
