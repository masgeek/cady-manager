import React, {useEffect, useRef} from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({open, title, children, footer, onClose, size = 'md'}: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block app-modal" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="app-modal-title">
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size === 'md' ? '' : `modal-${size}`}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 id="app-modal-title" className="modal-title">{title}</h5>
              <button ref={closeRef} type="button" className="btn-close" aria-label="Close dialog" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
