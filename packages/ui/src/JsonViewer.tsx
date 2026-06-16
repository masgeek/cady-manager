import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ContentCopy as CopyIcon, Download as DownloadIcon } from '@mui/icons-material';

interface JsonViewerProps {
  data: unknown;
  title?: string;
}

export function JsonViewer({ data, title }: JsonViewerProps) {
  const formatted = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
  };

  const handleDownload = () => {
    const blob = new Blob([formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {title && <Typography variant="subtitle2">{title}</Typography>}
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Copy">
            <IconButton size="small" onClick={handleCopy}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={handleDownload}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box
        component="pre"
        sx={{
          backgroundColor: 'grey.100',
          p: 2,
          borderRadius: 1,
          overflow: 'auto',
          maxHeight: '60vh',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
        }}
      >
        {formatted}
      </Box>
    </Box>
  );
}
