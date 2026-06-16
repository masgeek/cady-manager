import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
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
    queryFn: () => {
      const params = new URLSearchParams({ serverId });
      return api.getConfig();
    },
    enabled: !!serverId,
  });

  const reloadMutation = useMutation({
    mutationFn: () =>
      api.reloadConfig(),
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuration
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          select
          label="Server"
          value={serverId}
          onChange={(e) => setServerId(e.target.value)}
          sx={{ minWidth: 250 }}
          size="small"
        >
          {servers.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => reloadMutation.mutate()}
          disabled={!serverId || reloadMutation.isPending}
        >
          Reload Config
        </Button>
      </Box>

      {configQuery.data && (
        <JsonViewer data={configQuery.data} title="Active Configuration" />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
