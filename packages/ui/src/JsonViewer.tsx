import React from 'react';

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
    <div>
      <div className="d-flex align-items-center gap-2 mb-1">
        {title && <small className="fw-bold">{title}</small>}
        <div className="ms-auto">
          <button className="btn btn-sm btn-outline-secondary me-1" onClick={handleCopy} title="Copy">
            <i className="bi bi-clipboard"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={handleDownload} title="Download">
            <i className="bi bi-download"></i>
          </button>
        </div>
      </div>
      <pre
        className="bg-light p-3 rounded overflow-auto border"
        style={{ maxHeight: '60vh', fontSize: '0.8rem' }}
      >
        {formatted}
      </pre>
    </div>
  );
}
