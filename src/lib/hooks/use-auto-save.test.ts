import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from './use-auto-save';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get _store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAutoSave', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should report no draft when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useAutoSave({ key: 'test', data: { name: 'hello' } }),
    );

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draft).toBeNull();
  });

  it('should detect an existing draft in localStorage', () => {
    const draftData = { name: 'saved-draft' };
    localStorageMock.setItem(
      'poh-autosave-test',
      JSON.stringify({ data: draftData, timestamp: Date.now() }),
    );

    const { result } = renderHook(() =>
      useAutoSave({ key: 'test', data: { name: 'current' } }),
    );

    expect(result.current.hasDraft).toBe(true);
    expect(result.current.draft).toEqual(draftData);
  });

  it('should ignore drafts older than 24 hours', () => {
    const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
    localStorageMock.setItem(
      'poh-autosave-test',
      JSON.stringify({ data: { name: 'old' }, timestamp: oldTimestamp }),
    );

    const { result } = renderHook(() =>
      useAutoSave({ key: 'test', data: { name: 'current' } }),
    );

    expect(result.current.hasDraft).toBe(false);
  });

  it('should save data to localStorage on interval', () => {
    renderHook(() =>
      useAutoSave({ key: 'test', data: { name: 'auto-saved' }, interval: 1000 }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'poh-autosave-test',
      expect.stringContaining('"name":"auto-saved"'),
    );
  });

  it('should clear draft from localStorage', () => {
    localStorageMock.setItem(
      'poh-autosave-test',
      JSON.stringify({ data: { name: 'draft' }, timestamp: Date.now() }),
    );

    const { result } = renderHook(() =>
      useAutoSave({ key: 'test', data: { name: 'current' } }),
    );

    act(() => {
      result.current.clearDraft();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('poh-autosave-test');
    expect(result.current.hasDraft).toBe(false);
  });

  it('should restore draft and return data', () => {
    const draftData = { name: 'to-restore' };
    localStorageMock.setItem(
      'poh-autosave-test',
      JSON.stringify({ data: draftData, timestamp: Date.now() }),
    );

    const { result } = renderHook(() =>
      useAutoSave({ key: 'test', data: { name: 'current' } }),
    );

    let restored: { name: string } | null = null;
    act(() => {
      restored = result.current.restoreDraft();
    });

    expect(restored).toEqual(draftData);
    expect(result.current.hasDraft).toBe(false);
  });

  it('should not auto-save when disabled', () => {
    renderHook(() =>
      useAutoSave({ key: 'test', data: { name: 'data' }, enabled: false, interval: 1000 }),
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Only the initial clear call, no setItem for auto-save
    const autoSaveCalls = localStorageMock.setItem.mock.calls.filter(
      (call: string[]) => call[0] === 'poh-autosave-test',
    );
    expect(autoSaveCalls.length).toBe(0);
  });
});
