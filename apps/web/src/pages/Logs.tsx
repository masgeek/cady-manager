import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { api } from '../api/client';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
}

export default function Logs() {
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['logs', search],
    queryFn: async () => {
      const result = await api.getLogs({ search: search || undefined, limit: 100 });
      return result as unknown as LogEntry[];
    },
    refetchInterval: 5000,
  });

  const rows = query.data || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Logs
      </Typography>

      <TextField
        label="Search logs"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: 300 }}
      />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No logs
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{row.level}</TableCell>
                  <TableCell>{row.source || '-'}</TableCell>
                  <TableCell>{row.message}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
