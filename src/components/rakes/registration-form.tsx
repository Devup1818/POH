'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Loader2, Train, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  rakeDetailsSchema,
  coachNumberSchema,
  coachNumbersSchema,
  intakeDateSchema,
} from '@/lib/validations/rake';
import { RAKE_TYPES, RAKE_CATEGORIES, COACH_TYPES, getCoachTypeSplit } from '@/lib/constants';
import { useShed } from '@/lib/shed-context';
import { createRake } from '@/lib/actions/rake';
import { useAutoSave } from '@/lib/hooks/use-auto-save';
import type { RakeType, RakeCategory, POHType } from '@/types';

const STEPS = ['Rake Details', 'Coach Numbers', 'Review & Submit'] as const;

export function RegistrationForm() {
  const router = useRouter();
  const { sheds, selectedShedId } = useShed();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Step 1 state
  const [rakeNumber, setRakeNumber] = useState('');
  const [rakeCategory, setRakeCategory] = useState<RakeCategory | ''>('');
  const [rakeType, setRakeType] = useState<RakeType | ''>('');
  const [pohType, setPohType] = useState<POHType | ''>('');
  const [shedId, setShedId] = useState(
    selectedShedId !== 'all' ? selectedShedId : sheds[0]?.id ?? '',
  );
  const [totalCoaches, setTotalCoaches] = useState<number>(12);

  // Step 2 state
  const [coachNumbers, setCoachNumbers] = useState<string[]>([]);
  const [coachTypes, setCoachTypes] = useState<string[]>([]);

  // Intake date state (pre-filled with today)
  const [intakeDate, setIntakeDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save
  interface DraftData {
    rakeNumber: string;
    rakeCategory: RakeCategory | '';
    rakeType: RakeType | '';
    pohType: POHType | '';
    shedId: string;
    totalCoaches: number;
    coachNumbers: string[];
    coachTypes: string[];
    intakeDate: string;
    step: number;
  }

  const { hasDraft, restoreDraft, clearDraft, dismissDraft } = useAutoSave<DraftData>({
    key: 'rake-registration',
    data: { rakeNumber, rakeCategory, rakeType, pohType, shedId, totalCoaches, coachNumbers, coachTypes, intakeDate, step },
    enabled: !submitted,
  });

  const handleRestoreDraft = useCallback(() => {
    const draft = restoreDraft();
    if (draft) {
      setRakeNumber(draft.rakeNumber);
      setRakeCategory(draft.rakeCategory);
      setRakeType(draft.rakeType);
      setPohType(draft.pohType);
      if (draft.shedId) setShedId(draft.shedId);
      setTotalCoaches(draft.totalCoaches);
      setCoachNumbers(draft.coachNumbers);
      setCoachTypes(draft.coachTypes || []);
      if (draft.intakeDate) setIntakeDate(draft.intakeDate);
      setStep(draft.step);
    }
  }, [restoreDraft]);

  /* ── Step 1 validation ─────────────────────────────── */
  const validateStep1 = useCallback(() => {
    const result = rakeDetailsSchema.safeParse({
      rakeNumber,
      rakeCategory: rakeCategory || undefined,
      rakeType: rakeType || undefined,
      pohType: pohType || undefined,
      shedId,
      totalCoaches,
    });
    const fieldErrors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
    }
    // Validate intake date
    const dateResult = intakeDateSchema.safeParse(intakeDate);
    if (!dateResult.success) {
      fieldErrors['intakeDate'] = dateResult.error.issues[0].message;
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [rakeNumber, rakeCategory, rakeType, pohType, shedId, totalCoaches, intakeDate]);

  /* ── Step 2 validation ─────────────────────────────── */
  const validateStep2 = useCallback(() => {
    const fieldErrors: Record<string, string> = {};
    coachNumbers.forEach((num, i) => {
      const r = coachNumberSchema.safeParse(num);
      if (!r.success) fieldErrors[`coach-${i}`] = r.error.issues[0].message;
    });
    coachTypes.forEach((ct, i) => {
      if (!ct) fieldErrors[`coachType-${i}`] = 'Select coach type (MC/TC)';
    });
    const arrayResult = coachNumbersSchema(totalCoaches).safeParse({
      coachNumbers,
      coachTypes,
    });
    if (!arrayResult.success) {
      arrayResult.error.issues.forEach((issue) => {
        if (issue.path.length === 0) {
          fieldErrors['coachArray'] = issue.message;
        }
      });
    }
    // Validate MC/TC ratio matches rake category
    if (rakeCategory === 'EMU' || rakeCategory === 'MEMU') {
      const expectedTypes = getCoachTypeSplit(rakeCategory, totalCoaches);
      const expectedMC = expectedTypes.filter((t) => t === 'MC').length;
      const expectedTC = expectedTypes.filter((t) => t === 'TC').length;
      const actualMC = coachTypes.filter((t) => t === 'MC').length;
      const actualTC = coachTypes.filter((t) => t === 'TC').length;
      if (actualMC !== expectedMC || actualTC !== expectedTC) {
        fieldErrors['coachArray'] = `${rakeCategory} rake requires ${expectedMC} MC and ${expectedTC} TC (ratio ${rakeCategory === 'EMU' ? '1:2' : '1:3'})`;
      }
    }
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  }, [coachNumbers, coachTypes, totalCoaches, rakeCategory]);

  /* ── Navigation ────────────────────────────────────── */
  function goNext() {
    if (step === 0) {
      if (!validateStep1()) return;
      if (coachNumbers.length !== totalCoaches) {
        setCoachNumbers(Array.from({ length: totalCoaches }, (_, i) => coachNumbers[i] || ''));
      }
      // Auto-fill coach types based on rake category (EMU/MEMU) ratio
      if (rakeCategory === 'EMU' || rakeCategory === 'MEMU') {
        const autoTypes = getCoachTypeSplit(rakeCategory, totalCoaches);
        setCoachTypes(autoTypes);
      } else if (coachTypes.length !== totalCoaches) {
        setCoachTypes(Array.from({ length: totalCoaches }, (_, i) => coachTypes[i] || ''));
      }
      setStep(1);
    } else if (step === 1) {
      if (!validateStep2()) return;
      setStep(2);
    }
  }

  function goBack() {
    setErrors({});
    setSubmitError('');
    setStep((s) => Math.max(0, s - 1));
  }

  /* ── Submit ────────────────────────────────────────── */
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await createRake({
        rakeNumber,
        rakeCategory: rakeCategory as RakeCategory,
        rakeType: rakeType as RakeType,
        pohType: pohType as POHType,
        shedId,
        totalCoaches,
        coachNumbers,
        coachTypes: coachTypes as string[],
        intakeDate: new Date(intakeDate).toISOString(),
      });

      if (!result.success) {
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      clearDraft();
      setTimeout(() => router.push(`/rakes/${result.data.rakeId}`), 1000);
    } catch (err) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Coach number helpers ──────────────────────────── */
  function updateCoachNumber(index: number, value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    setCoachNumbers((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`coach-${index}`];
      delete next['coachArray'];
      return next;
    });
  }

  function updateCoachType(index: number, value: string) {
    setCoachTypes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`coachType-${index}`];
      return next;
    });
  }

  const duplicateIndices = new Set<number>();
  const seen = new Map<string, number>();
  coachNumbers.forEach((num, i) => {
    if (num.length >= 5) {
      if (seen.has(num)) {
        duplicateIndices.add(seen.get(num)!);
        duplicateIndices.add(i);
      } else {
        seen.set(num, i);
      }
    }
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-7 w-7 text-emerald-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Rake Registered</h2>
        <p className="mt-1 text-sm text-gray-500">Redirecting to rake detail...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Draft restoration prompt */}
      {hasDraft && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700">You have an unsaved draft. Restore it?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="rounded-md bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="rounded p-1 text-blue-400 hover:text-blue-600"
              aria-label="Dismiss draft"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i < step
                  ? 'bg-emerald-500 text-white'
                  : i === step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-400',
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'hidden text-xs font-medium sm:inline',
                i === step ? 'text-gray-900' : 'text-gray-400',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-8 bg-gray-200" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {step === 0 && (
          <Step1
            rakeNumber={rakeNumber}
            setRakeNumber={setRakeNumber}
            rakeCategory={rakeCategory}
            setRakeCategory={setRakeCategory}
            rakeType={rakeType}
            setRakeType={setRakeType}
            pohType={pohType}
            setPohType={setPohType}
            shedId={shedId}
            setShedId={setShedId}
            totalCoaches={totalCoaches}
            setTotalCoaches={setTotalCoaches}
            intakeDate={intakeDate}
            setIntakeDate={setIntakeDate}
            errors={errors}
            setErrors={setErrors}
            sheds={sheds}
          />
        )}
        {step === 1 && (
          <Step2
            coachNumbers={coachNumbers}
            updateCoachNumber={updateCoachNumber}
            coachTypes={coachTypes}
            updateCoachType={updateCoachType}
            errors={errors}
            duplicateIndices={duplicateIndices}
          />
        )}
        {step === 2 && (
          <Step3
            rakeNumber={rakeNumber}
            rakeCategory={rakeCategory as RakeCategory}
            rakeType={rakeType as RakeType}
            pohType={pohType as POHType}
            shedId={shedId}
            totalCoaches={totalCoaches}
            coachNumbers={coachNumbers}
            coachTypes={coachTypes}
            intakeDate={intakeDate}
            sheds={sheds}
          />
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {submitError}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className={cn(
            'flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            step === 0
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {step < 2 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1 rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Registering...
              </>
            ) : (
              <>
                <Train className="h-4 w-4" /> Register Rake
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   Step 1: Rake Details
   ════════════════════════════════════════════════════════════ */

interface Step1Props {
  rakeNumber: string;
  setRakeNumber: (v: string) => void;
  rakeCategory: RakeCategory | '';
  setRakeCategory: (v: RakeCategory | '') => void;
  rakeType: RakeType | '';
  setRakeType: (v: RakeType | '') => void;
  pohType: POHType | '';
  setPohType: (v: POHType | '') => void;
  shedId: string;
  setShedId: (v: string) => void;
  totalCoaches: number;
  setTotalCoaches: (v: number) => void;
  intakeDate: string;
  setIntakeDate: (v: string) => void;
  errors: Record<string, string>;
  setErrors: (v: Record<string, string>) => void;
  sheds: { id: string; name: string }[];
}

function Step1({
  rakeNumber, setRakeNumber,
  rakeCategory, setRakeCategory,
  rakeType, setRakeType,
  pohType, setPohType,
  shedId, setShedId,
  totalCoaches, setTotalCoaches,
  intakeDate, setIntakeDate,
  errors, setErrors,
  sheds,
}: Step1Props) {
  function clearError(key: string) {
    setErrors({ ...errors, [key]: '' });
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/30';
  const labelClass = 'mb-1 block text-xs font-medium text-gray-500';
  const errorClass = 'mt-1 text-xs text-red-500';

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Rake Details</h2>

      <div>
        <label className={labelClass}>Rake Number</label>
        <input
          type="text"
          value={rakeNumber}
          onChange={(e) => { setRakeNumber(e.target.value); clearError('rakeNumber'); }}
          placeholder="e.g. GZB-EMU-2026-001"
          className={cn(inputClass, errors.rakeNumber && 'border-red-300')}
        />
        {errors.rakeNumber && <p className={errorClass}>{errors.rakeNumber}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Rake Category</label>
          <div className="flex gap-3">
            {RAKE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setRakeCategory(c); clearError('rakeCategory'); }}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
                  rakeCategory === c
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {errors.rakeCategory && <p className={errorClass}>{errors.rakeCategory}</p>}
        </div>

        <div>
          <label className={labelClass}>Rake Type</label>
          <select
            value={rakeType}
            onChange={(e) => { setRakeType(e.target.value as RakeType); clearError('rakeType'); }}
            className={cn(inputClass, !rakeType && 'text-gray-400')}
          >
            <option value="">Select rake type</option>
            {RAKE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.rakeType && <p className={errorClass}>{errors.rakeType}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>POH Type</label>
          <select
            value={pohType}
            onChange={(e) => { setPohType(e.target.value as POHType); clearError('pohType'); }}
            className={cn(inputClass, !pohType && 'text-gray-400')}
          >
            <option value="">Select POH type</option>
            <option value="1st POH">1st POH</option>
            <option value="2nd POH">2nd POH</option>
            <option value="3rd POH">3rd POH</option>
            <option value="4th POH">4th POH</option>
          </select>
          {errors.pohType && <p className={errorClass}>{errors.pohType}</p>}
        </div>

        <div>
          <label className={labelClass}>Date of Intake</label>
          <input
            type="date"
            value={intakeDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setIntakeDate(e.target.value); clearError('intakeDate'); }}
            className={cn(inputClass, errors.intakeDate && 'border-red-300')}
          />
          {errors.intakeDate && <p className={errorClass}>{errors.intakeDate}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Shed</label>
          <select
            value={shedId}
            onChange={(e) => { setShedId(e.target.value); clearError('shedId'); }}
            className={inputClass}
          >
            {sheds.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.shedId && <p className={errorClass}>{errors.shedId}</p>}
        </div>

        <div>
          <label className={labelClass}>Total Coaches</label>
          <input
            type="number"
            min={6}
            max={20}
            value={totalCoaches}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) { setTotalCoaches(v); clearError('totalCoaches'); }
            }}
            className={cn(inputClass, errors.totalCoaches && 'border-red-300')}
          />
          {errors.totalCoaches && <p className={errorClass}>{errors.totalCoaches}</p>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Step 2: Coach Numbers
   ════════════════════════════════════════════════════════════ */

interface Step2Props {
  coachNumbers: string[];
  updateCoachNumber: (index: number, value: string) => void;
  coachTypes: string[];
  updateCoachType: (index: number, value: string) => void;
  errors: Record<string, string>;
  duplicateIndices: Set<number>;
}

function Step2({ coachNumbers, updateCoachNumber, coachTypes, updateCoachType, errors, duplicateIndices }: Step2Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Coach Numbers</h2>
        <span className="text-xs text-gray-400">{coachNumbers.length} coaches</span>
      </div>

      {errors.coachArray && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{errors.coachArray}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {coachNumbers.map((num, i) => {
          const hasError = !!errors[`coach-${i}`];
          const hasTypeError = !!errors[`coachType-${i}`];
          const isDuplicate = duplicateIndices.has(i);
          return (
            <div key={i}>
              <label className="mb-1 block text-[10px] font-medium text-gray-400">
                Coach {i + 1}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={num}
                  onChange={(e) => updateCoachNumber(i, e.target.value)}
                  placeholder="5-8 digits"
                  className={cn(
                    'min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm font-mono text-gray-700 focus:outline-none focus:ring-1',
                    hasError || isDuplicate
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-400/30'
                      : num.length >= 5
                        ? 'border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/30'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-blue-400/30',
                  )}
                />
                <select
                  value={coachTypes[i] || ''}
                  onChange={(e) => updateCoachType(i, e.target.value)}
                  className={cn(
                    'w-[72px] shrink-0 rounded-lg border px-2 py-2 text-sm font-medium focus:outline-none focus:ring-1',
                    hasTypeError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-400/30'
                      : coachTypes[i]
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-400 focus:ring-emerald-400/30'
                        : 'border-gray-200 text-gray-400 focus:border-blue-400 focus:ring-blue-400/30',
                  )}
                >
                  <option value="">Type</option>
                  {COACH_TYPES.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
              {hasError && (
                <p className="mt-0.5 text-[10px] text-red-500">{errors[`coach-${i}`]}</p>
              )}
              {hasTypeError && (
                <p className="mt-0.5 text-[10px] text-red-500">{errors[`coachType-${i}`]}</p>
              )}
              {isDuplicate && !hasError && (
                <p className="mt-0.5 text-[10px] text-red-500">Duplicate</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Step 3: Review & Submit
   ════════════════════════════════════════════════════════════ */

interface Step3Props {
  rakeNumber: string;
  rakeCategory: RakeCategory;
  rakeType: RakeType;
  pohType: POHType;
  shedId: string;
  totalCoaches: number;
  coachNumbers: string[];
  coachTypes: string[];
  intakeDate: string;
  sheds: { id: string; name: string }[];
}

function Step3({ rakeNumber, rakeCategory, rakeType, pohType, shedId, totalCoaches, coachNumbers, coachTypes, intakeDate, sheds }: Step3Props) {
  const shed = sheds.find((s) => s.id === shedId);

  const row = (label: string, value: string) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Review & Submit</h2>

      <div className="divide-y divide-gray-50 rounded-lg border border-gray-100 bg-gray-50/50 px-4">
        {row('Rake Number', rakeNumber)}
        {row('Rake Category', rakeCategory)}
        {row('Rake Type', rakeType)}
        {row('POH Type', pohType)}
        {row('Shed', shed?.name ?? shedId)}
        {row('Total Coaches', String(totalCoaches))}
        {row('Date of Intake', intakeDate)}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-gray-500">Coach Numbers</p>
        <div className="flex flex-wrap gap-1.5">
          {coachNumbers.map((num, i) => (
            <span
              key={i}
              className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600"
            >
              {num}
              {coachTypes[i] && (
                <span className={cn(
                  'ml-1 font-sans font-medium',
                  coachTypes[i] === 'MC' ? 'text-blue-600' : 'text-amber-600'
                )}>
                  ({coachTypes[i]})
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
