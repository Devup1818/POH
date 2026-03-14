'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { deleteRake } from '@/lib/actions/rake';
import { Loader2, AlertTriangle } from 'lucide-react';

export interface DeleteRakeDialogProps {
  open: boolean;
  onClose: () => void;
  rakeId: string;
  rakeNumber: string;
}

export function DeleteRakeDialog({ open, onClose, rakeId, rakeNumber }: DeleteRakeDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await deleteRake(rakeId);
      if (result.success) {
        onClose();
        toast.success(`Rake ${rakeNumber} has been deleted successfully.`);
        router.push('/');
      } else {
        onClose();
        toast.error(result.error || 'Failed to delete rake. Please try again.');
      }
    } catch {
      onClose();
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Delete Rake"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Rake'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Are you sure you want to delete rake <span className="font-semibold">{rakeNumber}</span>?
            </p>
            <p className="mt-2 text-sm text-gray-600">
              This action is permanent and cannot be undone. All associated data will be removed, including:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 space-y-0.5">
              <li>Coaches</li>
              <li>Stage history</li>
              <li>Parts</li>
              <li>Checklists</li>
              <li>Tests</li>
              <li>Notes</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
