import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Paper,
  MenuItem,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../api/client';

const siteSchema = z.object({
  serverId: z.string().min(1, 'Server is required'),
  domain: z.string().min(1, 'Domain is required'),
  upstream: z.string().url('Must be a valid URL'),
  tlsEnabled: z.boolean(),
});

type SiteForm = z.infer<typeof siteSchema>;

export default function SiteEditor() {
  const { id } = useParams();
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
    control,
    formState: { errors },
  } = useForm<SiteForm>({
    resolver: zodResolver(siteSchema),
    defaultValues: { tlsEnabled: true },
  });

  useEffect(() => {
    if (siteQuery.data) {
      reset({
        serverId: siteQuery.data.serverId,
        domain: siteQuery.data.domain,
        upstream: siteQuery.data.upstream,
        tlsEnabled: siteQuery.data.tlsEnabled,
      });
    }
  }, [siteQuery.data, reset]);

  const createMutation = useMutation({
    mutationFn: (data: SiteForm) => api.createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      navigate('/sites');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SiteForm) => api.updateSite(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      navigate('/sites');
    },
  });

  const servers = serversQuery.data || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Site' : 'New Site'}
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form
          onSubmit={handleSubmit((data) =>
            isEdit ? updateMutation.mutate(data) : createMutation.mutate(data),
          )}
        >
          <TextField
            select
            label="Server"
            {...register('serverId')}
            error={!!errors.serverId}
            helperText={errors.serverId?.message}
            fullWidth
            margin="normal"
            defaultValue=""
          >
            {servers.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.hostname})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            {...register('domain')}
            label="Domain"
            error={!!errors.domain}
            helperText={errors.domain?.message}
            fullWidth
            margin="normal"
            placeholder="example.com"
          />
          <TextField
            {...register('upstream')}
            label="Upstream URL"
            error={!!errors.upstream}
            helperText={errors.upstream?.message}
            fullWidth
            margin="normal"
            placeholder="http://localhost:8080"
          />
          <FormControlLabel
            control={
              <Controller
                name="tlsEnabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            }
            label="TLS Enabled"
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained">
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button onClick={() => navigate('/sites')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
