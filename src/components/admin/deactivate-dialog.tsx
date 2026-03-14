'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { UserRecord } from '@/types';

interface DeactivateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: UserRecord;
  action: 'deactivate' | 'reactivate';
  loading: boolean;
}

export function DeactivateDialog({ open, onClose, onConfirm, user, action, loading }: DeactivateDialogProps) {
  const isDeactivate = action === 'deactivate';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isDeactivate ? 'Deactivate User' : 'Reactivate User'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={isDeactivate ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? (isDeactivate ? 'Deactivating...' : 'Reactivating...')
              : (isDeactivate ? 'Deactivate' : 'Reactivate')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        {isDeactivate
          ? `Are you sure you want to deactivate ${user.full_name}? They will no longer be able to log in.`
          : `Are you sure you want to reactivate ${user.full_name}? They will be able to log in again.`}
      </p>
    </Modal>
  );
}
