import { describe, expect, it } from 'vitest';
import { shouldPromptForAppUpdate } from './appVersion';

describe('shouldPromptForAppUpdate', () => {
  it('prompts only when the remote version is present and different', () => {
    expect(shouldPromptForAppUpdate('abc1234', 'def5678')).toBe(true);
    expect(shouldPromptForAppUpdate('abc1234', 'abc1234')).toBe(false);
    expect(shouldPromptForAppUpdate('abc1234', '')).toBe(false);
  });
});
