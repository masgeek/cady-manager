import { useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../api/client';

const siteSchema = z.object({
  serverId: z.string().min(1, 'Server is required'),
  name: z.string().optional(),
  baseDomain: z.string().min(1, 'Domain is required'),
  upstream: z.string().url('Must be a valid URL'),
  routeId: z.string().optional(),
  caddyServerName: z.string().optional(),
  tlsEnabled: z.boolean(),
  healthEndpoint: z.string().optional(),
  healthHeaders: z.string().optional(),
});

type SiteForm = z.infer<typeof siteSchema>;

function splitDomain(domain: string): { name: string; baseDomain: string } {
  const dot = domain.indexOf('.');
  if (dot <= 0) return { name: '', baseDomain: domain };
  return { name: domain.slice(0, dot), baseDomain: domain.slice(dot + 1) };
}

export default function SiteEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const serversQuery = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.getServers(),
  });

  const siteQuery = useQuery({
    queryKey: ['site', id],
    queryFn: () => api.getSite(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<SiteForm>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      serverId: isEdit ? '' : (searchParams.get('serverId') ?? ''),
      name: '',
      baseDomain: '',
      caddyServerName: '',
      tlsEnabled: true,
      healthEndpoint: '',
      healthHeaders: '',
    },
  });

  const selectedServerId = watch('serverId');
  const blocksQuery = useQuery({
    queryKey: ['server-blocks', selectedServerId],
    queryFn: () => api.getServerBlocks(selectedServerId),
    enabled: !!selectedServerId,
  });

  useEffect(() => {
    if (siteQuery.data) {
      const { name, baseDomain } = splitDomain(siteQuery.data.domain);
      reset({
        serverId: siteQuery.data.serverId,
        name,
        baseDomain,
        upstream: siteQuery.data.upstream,
        routeId: siteQuery.data.routeId ?? '',
        caddyServerName: siteQuery.data.caddyServerName ?? '',
        tlsEnabled: siteQuery.data.tlsEnabled,
        healthEndpoint: siteQuery.data.healthEndpoint ?? '',
        healthHeaders: siteQuery.data.healthHeaders ?? '',
      });
    }
  }, [siteQuery.data, reset]);
  const servers = serversQuery.data || [];

  const onServerChange = useCallback(
    (serverId: string) => {
      const server = servers.find((s) => s.id === serverId);
      if (server) {
        setValue('baseDomain', server.hostname);
      }
    },
    [servers, setValue],
  );

  const toApiPayload = useCallback(
    (data: SiteForm) => ({
      serverId: data.serverId,
      domain: data.name ? `${data.name}.${data.baseDomain}` : data.baseDomain,
      upstream: data.upstream,
      routeId: data.routeId || undefined,
      caddyServerName: data.caddyServerName || undefined,
      tlsEnabled: data.tlsEnabled,
      healthEndpoint: data.healthEndpoint || undefined,
      healthHeaders: data.healthHeaders || undefined,
    }),
    [],
  );

  const createMutation = useMutation({
    mutationFn: (data: SiteForm) => api.createSite(toApiPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      navigate('/sites');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SiteForm) => api.updateSite(id!, toApiPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      navigate('/sites');
    },
  });

  return (
    <div>
      <h4 className="mb-3">{isEdit ? 'Edit Site' : 'New Site'}</h4>
      <div className="card p-4" style={{ maxWidth: 600 }}>
        <form
          onSubmit={handleSubmit((data) => {
            return isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);
          })}
        >
          <div className="mb-3">
            <label className="form-label">Server</label>
            <select
              {...register('serverId', {
                onChange: (e) => onServerChange(e.target.value),
              })}
              className={`form-select ${errors.serverId ? 'is-invalid' : ''}`}
            >
              <option value="">Select a server...</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.hostname})
                </option>
              ))}
            </select>
            {errors.serverId && <div className="invalid-feedback">{errors.serverId.message}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Caddy HTTP Server Block</label>
            <select
              {...register('caddyServerName')}
              className={`form-select ${errors.caddyServerName ? 'is-invalid' : ''}`}
              disabled={!selectedServerId || blocksQuery.isLoading}
            >
              <option value="">
                {blocksQuery.isLoading ? 'Loading server blocks...' : 'Select a server block...'}
              </option>
              {(blocksQuery.data || []).map((block) => (
                <option key={block} value={block}>{block}</option>
              ))}
            </select>
            <div className="form-text">Routes are added to the selected Caddy HTTP server block.</div>
            {errors.caddyServerName && <div className="invalid-feedback">{errors.caddyServerName.message}</div>}
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Name</label>
              <input
                {...register('name')}
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="fees"
              />
              {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Domain</label>
              <input
                {...register('baseDomain')}
                className={`form-control ${errors.baseDomain ? 'is-invalid' : ''}`}
                placeholder="munywele.co.ke"
              />
              {errors.baseDomain && <div className="invalid-feedback">{errors.baseDomain.message}</div>}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Upstream URL</label>
            <input
              {...register('upstream')}
              className={`form-control ${errors.upstream ? 'is-invalid' : ''}`}
              placeholder="http://localhost:8080"
            />
            {errors.upstream && <div className="invalid-feedback">{errors.upstream.message}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">@id</label>
            <input
              {...register('routeId')}
              className={`form-control ${errors.routeId ? 'is-invalid' : ''}`}
              placeholder="fees"
            />
            {errors.routeId && <div className="invalid-feedback">{errors.routeId.message}</div>}
          </div>

          <div className="form-check form-switch mb-3">
            <Controller
              name="tlsEnabled"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  id="tls-switch"
                />
              )}
            />
            <label className="form-check-label" htmlFor="tls-switch">TLS Enabled</label>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Health Check Settings</h6>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                Leave blank to use <code>https://{'{domain}'}</code> with no custom headers.
              </p>
              <div className="mb-3">
                <label className="form-label">Health Endpoint URL</label>
                <input
                  {...register('healthEndpoint')}
                  className={`form-control ${errors.healthEndpoint ? 'is-invalid' : ''}`}
                  placeholder="https://api.example.com/health"
                />
                <div className="form-text">Custom URL to ping instead of the site domain.</div>
                {errors.healthEndpoint && <div className="invalid-feedback">{errors.healthEndpoint.message}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Health Check Headers (JSON)</label>
                <textarea
                  {...register('healthHeaders')}
                  className={`form-control font-monospace ${errors.healthHeaders ? 'is-invalid' : ''}`}
                  rows={3}
                  placeholder='{"Authorization": "Bearer token123"}'
                />
                <div className="form-text">JSON object of headers to include in the health check request.</div>
                {errors.healthHeaders && <div className="invalid-feedback">{errors.healthHeaders.message}</div>}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/sites')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
