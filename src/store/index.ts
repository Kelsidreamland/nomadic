import { create } from 'zustand';

interface AppState {
  currentSeasonFilter: '所有' | '冬季' | '夏季';
  setSeasonFilter: (season: '所有' | '冬季' | '夏季') => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  language: 'zh-TW' | 'en';
  setLanguage: (lang: 'zh-TW' | 'en') => void;
  activeLuggageId: string | null;
  setActiveLuggageId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  currentSeasonFilter: '所有',
  setSeasonFilter: (season) => set({ currentSeasonFilter: season }),
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  language: 'zh-TW',
  setLanguage: (lang) => set({ language: lang }),
  activeLuggageId: null,
  setActiveLuggageId: (id) => set({ activeLuggageId: id }),
}));
