import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DataTable, StatusBadge, ConfirmDialog, PageHeader } from '@caddy-manager/ui';
import type { Column } from '@caddy-manager/ui';
import type { Site } from '@caddy-manager/shared-types';
import { api } from '../api/client';
import SiteEditor from './SiteEditor';

const columns: Column<Site>[] = [
  { field: 'domain', headerName: 'Domain' },
  {
    field: 'routeId',
    headerName: '@id',
    render: (value) => value
      ? <code>{String(value)}</code>
      : <span className="small text-muted" title="Managed directly in the Caddyfile"><i className="bi bi-file-earmark-code me-1"></i>Caddyfile-managed</span>,
  },
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
        {row.healthLatencyMs !== undefined && (
          <div className="small text-muted">{row.healthLatencyMs} ms</div>
        )}
        {row.consecutiveFailures > 0 && (
          <div className="small text-danger">{row.consecutiveFailures} consecutive failures</div>
        )}
      </div>
    ),
  },
];

export default function Sites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ id?: string } | null>(null);

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
    onError: (error) => setFeedback(error instanceof Error ? error.message : 'Failed to delete site'),
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.syncSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : 'Failed to sync site'),
  });

  const reconcileMutation = useMutation({
    mutationFn: () => api.reconcileSites(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : 'Failed to reconcile routes'),
  });

  const healthCheckMutation = useMutation({
    mutationFn: () => api.checkAllSites(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : 'Failed to check site health'),
  });

  const rows = query.data || [];
  const identifiedRows = rows.filter((row) => row.routeId);
  const unidentifiedRows = rows.filter((row) => !row.routeId);
  const activeCount = rows.filter((row) => row.status === 'active').length;
  const errorCount = rows.filter((row) => row.status === 'error').length;
  const syncedCount = rows.filter((row) => row.synced).length;

  const actionColumn: Column<Site> = {
    field: 'actions',
    headerName: 'Actions',
    render: (_, row) => !row.routeId ? (
      <span className="small text-muted">Managed in Caddyfile</span>
    ) : (
      <div className="d-flex gap-1">
        {!row.synced && row.routeId && (
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
          onClick={() => setEditor({ id: row.id })}
          title="Edit site"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => setDeleteId(row.id)}
          title="Delete site"
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>
    ),
  };

  return (
    <div>
      <PageHeader
        eyebrow="Routing inventory"
        title="Sites"
        description="Managed domains, upstream targets, and the health signal behind each route."
        actions={<button className="btn btn-primary" onClick={() => setEditor({})}><i className="bi bi-plus-lg me-1"></i> Add site</button>}
        signal={
          <>
          <strong>{activeCount} of {rows.length} healthy</strong>
            <span className="ms-auto">{syncedCount} synced to Caddy</span>
            <span className={errorCount ? 'text-danger' : 'text-success'}>{errorCount ? `${errorCount} errors` : 'No errors'}</span>
          </>
        }
      />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="page-eyebrow mb-0">Managed routes</div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-info"
            onClick={() => healthCheckMutation.mutate()}
            disabled={healthCheckMutation.isPending}
            title="Check health for all sites"
          >
            <i className="bi bi-heart-pulse me-1"></i>
            {healthCheckMutation.isPending ? 'Checking...' : 'Check Health'}
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => reconcileMutation.mutate()}
            disabled={reconcileMutation.isPending}
            title="Recreate missing routes in Caddy"
          >
            <i className="bi bi-arrow-repeat me-1"></i>
            {reconcileMutation.isPending ? 'Reconciling...' : 'Reconcile Routes'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {feedback}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      {query.isLoading && <div className="alert alert-info" role="status" aria-live="polite">Loading sites...</div>}
      {query.isError && (
        <div className="alert alert-danger" role="alert">
          Failed to load sites: {query.error instanceof Error ? query.error.message : 'Request failed'}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => query.refetch()}>
            Retry
          </button>
        </div>
      )}

      {!query.isError && !query.isLoading && <DataTable
        columns={[...columns, actionColumn]}
        rows={identifiedRows}
        getRowId={(r) => r.id}
      />}

      {!query.isError && !query.isLoading && unidentifiedRows.length > 0 && (
        <details className="mt-3">
          <summary className="text-muted" style={{ cursor: 'pointer' }}>
            Caddyfile-managed sites without @id ({unidentifiedRows.length})
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

      {editor && <SiteEditor modal siteId={editor.id} onClose={() => setEditor(null)} />}

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
