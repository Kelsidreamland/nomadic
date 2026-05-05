import type { Luggage } from '../db';

type SeasonFilter = '所有' | '冬季' | '夏季';

export const createLuggageDraftForSeason = (seasonFilter: SeasonFilter): Partial<Luggage> => ({
  name: '',
  type: '托运',
  season: seasonFilter === '冬季' || seasonFilter === '夏季' ? seasonFilter : '混合',
  length: 0,
  width: 0,
  height: 0,
  weightHistory: [],
});
