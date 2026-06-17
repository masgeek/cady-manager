import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function Dashboard() {
  const serversQuery = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.getServers(),
  });

  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: () => api.getSites(),
  });

  const servers = serversQuery.data || [];
  const sites = sitesQuery.data || [];
  const onlineServers = servers.filter(s => s.status === 'online').length;

  return (
    <div>
      <h4 className="mb-4">Dashboard</h4>
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-hdd-rack text-primary" style={{ fontSize: '2.5rem' }}></i>
                <div>
                  <h5 className="mb-0">{servers.length}</h5>
                  <small className="text-muted">Total Servers</small>
                </div>
              </div>
              <small className="d-block mt-2">{onlineServers} online</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-file-text text-secondary" style={{ fontSize: '2.5rem' }}></i>
                <div>
                  <h5 className="mb-0">{sites.length}</h5>
                  <small className="text-muted">Total Sites</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-hdd-stack text-danger" style={{ fontSize: '2.5rem' }}></i>
                <div>
                  <h5 className="mb-0">{servers.length - onlineServers}</h5>
                  <small className="text-muted">Offline Servers</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
