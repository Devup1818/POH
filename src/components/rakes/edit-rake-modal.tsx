'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useShed } from '@/lib/shed-context';
import { rakeDetailsSchema, intakeDateSchema } from '@/lib/validations/rake';
import { editRake } from '@/lib/actions/rake';
import { RAKE_CATEGORIES, RAKE_TYPES } from '@/lib/constants';
import type { RakeCategory, RakeType, POHType } from '@/types';

export interface EditRakeModalProps {
  open: boolean;
  onClose: () => void;
  rakeId: string;
  currentValues: {
    rakeNumber: string;
    rakeCategory: RakeCategory;
    rakeType: RakeType;
    pohType: POHType;
    shedId: string;
    totalCoaches: number;
    intakeDate: string;
  };
}

export function EditRakeModal({ open, onClose, rakeId, currentValues }: EditRakeModalProps) {
  const router = useRouter();
  const toast = useToast();
  const { sheds } = useShed();

  const [rakeNumber, setRakeNumber] = useState(currentValues.rakeNumber);
  const [rakeCategory, setRakeCategory] = useState<RakeCategory>(currentValues.rakeCategory);
  const [rakeType, setRakeType] = useState<RakeType>(currentValues.rakeType);
  const [pohType, setPohType] = useState<POHType>(currentValues.pohType);
  const [shedId, setShedId] = useState(currentValues.shedId);
  const [totalCoaches, setTotalCoaches] = useState(currentValues.totalCoaches);
  const [intakeDate, setIntakeDate] = useState(() => {
    // Normalize to YYYY-MM-DD for date input
    const d = currentValues.intakeDate;
    return d ? d.split('T')[0] : '';
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reset form values when modal opens or currentValues change
  useEffect(() => {
    if (open) {
      setRakeNumber(currentValues.rakeNumber);
      setRakeCategory(currentValues.rakeCategory);
      setRakeType(currentValues.rakeType);
      setPohType(currentValues.pohType);
      setShedId(currentValues.shedId);
      setTotalCoaches(currentValues.totalCoaches);
      setIntakeDate(currentValues.intakeDate ? currentValues.intakeDate.split('T')[0] : '');
      setErrors({});
    }
  }, [open, currentValues]);

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const fieldErrors: Record<string, string> = {};

    const detailsResult = rakeDetailsSchema.safeParse({
      rakeNumber,
      rakeCategory,
      rakeType,
      pohType,
      shedId,
      totalCoaches,
    });

    if (!detailsResult.success) {
      detailsResult.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
    }

    const dateResult = intakeDateSchema.safeParse(intakeDate);
    if (!dateResult.success) {
      fieldErrors.intakeDate = dateResult.error.issues[0].message;
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  }, [rakeNumber, rakeCategory, rakeType, pohType, shedId, totalCoaches, intakeDate]);

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await editRake({
        rakeId,
        rakeNumber,
        rakeCategory,
        rakeType,
        pohType,
        shedId,
        totalCoaches,
        intakeDate,
      });

      if (result.success) {
        onClose();
        toast.success('Rake updated successfully.');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update rake. Please try again.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shedOptions = sheds.map((s) => ({ value: s.id, label: s.name }));

  const rakeCategoryOptions = RAKE_CATEGORIES.map((c) => ({ value: c, label: c }));
  const rakeTypeOptions = RAKE_TYPES.map((t) => ({ value: t, label: t }));
  const pohTypeOptions = [
    { value: '1st POH', label: '1st POH' },
    { value: '2nd POH', label: '2nd POH' },
    { value: '3rd POH', label: '3rd POH' },
    { value: '4th POH', label: '4th POH' },
  ];

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Edit Rake"
      className="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          id="edit-rake-number"
          label="Rake Number"
          value={rakeNumber}
          onChange={(e) => { setRakeNumber(e.target.value); clearError('rakeNumber'); }}
          placeholder="e.g. GZB-EMU-2026-001"
          error={errors.rakeNumber}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="edit-rake-category"
            label="Rake Category"
            value={rakeCategory}
            onChange={(e) => { setRakeCategory(e.target.value as RakeCategory); clearError('rakeCategory'); }}
            options={rakeCategoryOptions}
            error={errors.rakeCategory}
          />
          <Select
            id="edit-rake-type"
            label="Rake Type"
            value={rakeType}
            onChange={(e) => { setRakeType(e.target.value as RakeType); clearError('rakeType'); }}
            options={rakeTypeOptions}
            error={errors.rakeType}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="edit-poh-type"
            label="POH Type"
            value={pohType}
            onChange={(e) => { setPohType(e.target.value as POHType); clearError('pohType'); }}
            options={pohTypeOptions}
            error={errors.pohType}
          />
          <Select
            id="edit-shed"
            label="Shed"
            value={shedId}
            onChange={(e) => { setShedId(e.target.value); clearError('shedId'); }}
            options={shedOptions}
            error={errors.shedId}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="edit-intake-date"
            label="Date of Intake"
            type="date"
            value={intakeDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setIntakeDate(e.target.value); clearError('intakeDate'); }}
            error={errors.intakeDate}
          />
          <Input
            id="edit-total-coaches"
            label="Total Coaches"
            type="number"
            min={6}
            max={20}
            value={totalCoaches}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) { setTotalCoaches(v); clearError('totalCoaches'); }
            }}
            error={errors.totalCoaches}
          />
        </div>
      </div>
    </Modal>
  );
}
