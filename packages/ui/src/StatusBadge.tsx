import React from 'react';

const statusColors: Record<string, string> = {
  online: 'bg-success',
  active: 'bg-success',
  offline: 'bg-danger',
  error: 'bg-danger',
  degraded: 'bg-warning text-dark',
  unknown: 'bg-secondary',
  inactive: 'bg-secondary',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = statusColors[status] || 'bg-secondary';
  return <span className={`badge ${color}`}>{status}</span>;
}
