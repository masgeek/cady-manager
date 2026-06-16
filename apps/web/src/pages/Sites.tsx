import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
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
    field: 'tlsEnabled',
    headerName: 'TLS',
    render: (value) => (value ? 'Yes' : 'No'),
  },
  {
    field: 'status',
    headerName: 'Status',
    render: (value) => <StatusBadge status={String(value)} />,
  },
];

export default function Sites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['sites'],
    queryFn: () => api.getSites(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setDeleteId(null);
    },
  });

  const rows = query.data || [];

  const actionColumn: Column<Site> = {
    field: 'actions',
    headerName: 'Actions',
    render: (_, row) => (
      <Box>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => navigate(`/sites/${row.id}/edit`)}>
            <EditIcon fontSize="small" />
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
        <Typography variant="h4">Sites</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/sites/new')}
        >
          Add Site
        </Button>
      </Box>

      <DataTable
        columns={[...columns, actionColumn]}
        rows={rows}
        getRowId={(r) => r.id}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Site"
        message="Are you sure you want to delete this site?"
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
