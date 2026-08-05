import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {Modal, StatusBadge} from '@caddy-manager/ui';

describe('shared UI primitives', () => {
  it('renders a semantic status pill', () => {
    render(<StatusBadge status="active" />);

    expect(screen.getByText('Active').classList.contains('status-pill-active')).toBe(true);
  });

  it('closes on Escape and traps focus within the modal', () => {
    const onClose = vi.fn();
    render(
      <Modal
        open
        title="Edit site"
        onClose={onClose}
        footer={<button type="button">Save changes</button>}
      >
        <button type="button">First action</button>
      </Modal>,
    );

    expect(screen.getByRole('dialog', {name: 'Edit site'})).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Close dialog'}));

    fireEvent.keyDown(document, {key: 'Tab', shiftKey: true});
    expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Save changes'}));

    fireEvent.keyDown(document, {key: 'Escape'});
    expect(onClose).toHaveBeenCalledOnce();
  });
});
