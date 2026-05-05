import { describe, expect, it } from 'vitest';
import { createLuggageDraftForSeason } from './luggageForm';

describe('createLuggageDraftForSeason', () => {
  it('uses the selected seasonal filter as the default luggage season', () => {
    expect(createLuggageDraftForSeason('冬季').season).toBe('冬季');
    expect(createLuggageDraftForSeason('夏季').season).toBe('夏季');
    expect(createLuggageDraftForSeason('所有').season).toBe('混合');
  });
});
