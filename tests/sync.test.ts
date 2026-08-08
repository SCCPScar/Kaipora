import { describe, it, expect, beforeEach } from 'vitest';
import { isCloudConfigured, fullSync, getSession, signInWithEmail, signOut, onAuthChange } from '../src/lib/sync';
import { addWeight, getWeights } from '../src/lib/storage';

beforeEach(() => {
  localStorage.clear();
});

// This test environment never sets VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY,
// so these assert the app's most important safety property for anyone who
// hasn't configured cloud sync: nothing throws, nothing silently pretends to
// have synced, and the app stays fully usable offline/local-only.
describe('sync (cloud not configured)', () => {
  it('reports cloud sync as unavailable', () => {
    expect(isCloudConfigured).toBe(false);
  });

  it('fullSync fails closed with a clear reason instead of throwing', async () => {
    const result = await fullSync();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('não configurada');
  });

  it('auth helpers no-op safely instead of throwing', async () => {
    await expect(getSession()).resolves.toBeNull();
    const signIn = await signInWithEmail('scar@example.com');
    expect(signIn.ok).toBe(false);
    await expect(signOut()).resolves.toBeUndefined();
    const unsubscribe = onAuthChange(() => {});
    expect(() => unsubscribe()).not.toThrow();
  });

  it('signOut never touches local app data — logging out must not be destructive', async () => {
    addWeight(75, '2026-01-01');
    await signOut();
    expect(getWeights()).toEqual([{ kg: 75, date: '2026-01-01', updatedAt: expect.any(Number) }]);
  });
});
