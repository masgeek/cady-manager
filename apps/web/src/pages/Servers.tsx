import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Download as DownloadIcon } from '@mui/icons-material';
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
      <Box>
        <Tooltip title="Check health">
          <IconButton size="small" onClick={() => healthMutation.mutate(row.id)}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Import sites from config">
          <IconButton size="small" onClick={() => importMutation.mutate(row.id)}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => setDeleteId(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Servers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Server
        </Button>
      </Box>

      <DataTable
        columns={[...columns, actionColumn]}
        rows={rows}
        getRowId={(r) => r.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
          <DialogTitle>Add Server</DialogTitle>
          <DialogContent>
            <TextField
              {...register('name')}
              label="Name"
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
              margin="normal"
            />
            <TextField
              {...register('hostname')}
              label="Hostname"
              error={!!errors.hostname}
              helperText={errors.hostname?.message}
              fullWidth
              margin="normal"
            />
            <TextField
              {...register('apiEndpoint')}
              label="API Endpoint"
              error={!!errors.apiEndpoint}
              helperText={errors.apiEndpoint?.message}
              fullWidth
              margin="normal"
              placeholder="http://localhost:2019"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Server"
        message="Are you sure you want to delete this server?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
      >
        <Alert severity={importMutation.isError ? 'error' : 'success'} onClose={() => setSnackbar(null)}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}
