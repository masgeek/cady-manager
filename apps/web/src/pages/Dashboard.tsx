import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, StatusBadge } from '@caddy-manager/ui';
import { api } from '../api/client';

function formatCheckedAt(value?: string): string {
  if (!value) return 'Not checked yet';
  return `Checked ${new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const serversQuery = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.getServers(),
    refetchInterval: 30_000,
  });
  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: () => api.getSites(),
    refetchInterval: 30_000,
  });

  const servers = serversQuery.data || [];
  const sites = sitesQuery.data || [];
  const onlineServers = servers.filter((server) => server.status === 'online').length;
  const activeSites = sites.filter((site) => site.status === 'active').length;
  const attentionSites = sites.filter((site) => site.status === 'error' || site.consecutiveFailures > 0);
  const checkedSites = sites.filter((site) => site.lastCheckedAt).length;
  const isLoading = serversQuery.isLoading || sitesQuery.isLoading;
  const hasError = serversQuery.isError || sitesQuery.isError;

  return (
    <div>
      <PageHeader
        eyebrow="Operations overview"
        title="Good morning, operator."
        description="A quiet view of your Caddy fleet, with attention surfaced only when it matters."
        actions={
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => navigate('/servers')}>
              <i className="bi bi-hdd-rack me-1"></i> Manage servers
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/sites/new')}>
              <i className="bi bi-plus-lg me-1"></i> Add site
            </button>
          </div>
        }
        signal={
          <>
            <strong>{onlineServers} of {servers.length} servers online</strong>
            <span className="ms-auto">{checkedSites} of {sites.length} sites checked</span>
            <span>{new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </>
        }
      />

      {isLoading && <div className="alert alert-info">Loading infrastructure status...</div>}
      {hasError && <div className="alert alert-danger">Some infrastructure data could not be loaded. Refresh to try again.</div>}

      {!isLoading && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-8">
              <section className="dashboard-hero h-100">
                <div className="dashboard-hero-kicker">Fleet signal</div>
                <div className="d-flex justify-content-between align-items-end gap-3">
                  <div>
                    <div className="dashboard-number">{activeSites}<span>/{sites.length}</span></div>
                    <div className="dashboard-hero-label">sites responding normally</div>
                  </div>
                  <i className="bi bi-activity dashboard-hero-icon"></i>
                </div>
                <div className="dashboard-progress mt-4">
                  <span style={{ width: `${sites.length ? (activeSites / sites.length) * 100 : 0}%` }} />
                </div>
                <div className="d-flex justify-content-between mt-2 dashboard-hero-meta">
                  <span>{attentionSites.length ? `${attentionSites.length} need attention` : 'Everything looks steady'}</span>
                  <span>{sites.length ? Math.round((activeSites / sites.length) * 100) : 0}% healthy</span>
                </div>
              </section>
            </div>
            <div className="col-12 col-lg-4">
              <div className="dashboard-metric-stack h-100">
                <div className="metric-panel">
                  <span className="metric-panel-label">Caddy servers</span>
                  <strong>{servers.length}</strong>
                  <span className="text-success">{onlineServers} online</span>
                </div>
                <div className={`metric-panel ${attentionSites.length ? 'metric-panel-alert' : ''}`}>
                  <span className="metric-panel-label">Attention queue</span>
                  <strong>{attentionSites.length}</strong>
                  <span>{attentionSites.length ? 'site checks need review' : 'No open issues'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-7">
              <section>
                <div className="d-flex justify-content-between align-items-end mb-3">
                  <div>
                    <div className="page-eyebrow mb-1">Needs attention</div>
                    <h3 className="mb-0">Site checks</h3>
                  </div>
                  <button className="btn btn-sm btn-link text-decoration-none" onClick={() => navigate('/sites')}>View all sites <i className="bi bi-arrow-up-right"></i></button>
                </div>
                <div className="attention-list">
                  {attentionSites.length === 0 ? (
                    <div className="empty-panel"><i className="bi bi-check2-circle"></i><span>No site issues detected.</span></div>
                  ) : attentionSites.slice(0, 5).map((site) => (
                    <button className="attention-item" key={site.id} onClick={() => navigate(`/sites/${site.id}/edit`)}>
                      <span className="status-dot status-dot-danger"></span>
                      <span className="attention-main"><strong>{site.domain}</strong><small>{site.statusDetail || 'Health check failed'}</small></span>
                      <span className="attention-side"><StatusBadge status={site.status} /><small>{formatCheckedAt(site.lastCheckedAt)}</small></span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-5">
              <section>
                <div className="d-flex justify-content-between align-items-end mb-3">
                  <div>
                    <div className="page-eyebrow mb-1">Fleet</div>
                    <h3 className="mb-0">Server pulse</h3>
                  </div>
                  <button className="btn btn-sm btn-link text-decoration-none" onClick={() => navigate('/servers')}>Manage <i className="bi bi-arrow-up-right"></i></button>
                </div>
                <div className="server-pulse-list">
                  {servers.length === 0 ? (
                    <div className="empty-panel"><i className="bi bi-hdd-rack"></i><span>No servers registered.</span></div>
                  ) : servers.map((server) => (
                    <button className="server-pulse-row" key={server.id} onClick={() => navigate('/servers')}>
                      <span className={`status-dot ${server.status === 'online' ? 'status-dot-success' : 'status-dot-danger'}`}></span>
                      <span className="server-pulse-main"><strong>{server.name}</strong><small>{server.hostname}</small></span>
                      <StatusBadge status={server.status} />
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
