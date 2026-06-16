import React from 'react';
import { Chip } from '@mui/material';

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  online: 'success',
  active: 'success',
  offline: 'error',
  error: 'error',
  degraded: 'warning',
  unknown: 'default',
  inactive: 'default',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = statusColors[status] || 'default';
  return <Chip label={status} color={color} size="small" variant="outlined" />;
}
