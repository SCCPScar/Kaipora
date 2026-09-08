import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/lib/sanitize';

describe('escapeHtml', () => {
  it('escapes the characters that let user text break out of an innerHTML template', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes an attribute-breaking payload like <img onerror=...>', () => {
    const payload = `<img src=x onerror="alert('x')">`;
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<img');
    expect(escaped).toContain('&lt;img');
  });

  it('escapes ampersands, quotes and apostrophes', () => {
    expect(escapeHtml(`Tom & Jerry's "great" day`)).toBe('Tom &amp; Jerry&#39;s &quot;great&quot; day');
  });

  it('leaves plain text completely unchanged', () => {
    expect(escapeHtml('Corrida matinal, 30 minutos')).toBe('Corrida matinal, 30 minutos');
  });

  it('handles an empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});
