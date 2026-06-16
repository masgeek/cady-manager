import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { api } from '../api/client';
import type { AuditEvent } from '@caddy-manager/shared-types';

const actionColors: Record<string, 'info' | 'success' | 'error' | 'warning' | 'default'> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  reload: 'warning',
  login: 'default',
  logout: 'default',
};

export default function Audit() {
  const query = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.getAuditLogs(),
  });

  const rows = query.data || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Audit Trail
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Entity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No audit events
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row: AuditEvent) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{row.userId}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.action}
                      color={actionColors[row.action] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.entity}</TableCell>
                  <TableCell>{row.details || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.result}
                      color={row.result === 'success' ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
