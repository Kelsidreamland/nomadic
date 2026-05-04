import { create } from 'zustand';

const ACTIVE_LUGGAGE_KEY = 'nomadic_active_luggage_id';

const getStoredActiveLuggageId = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_LUGGAGE_KEY);
};

const storeActiveLuggageId = (id: string | null) => {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(ACTIVE_LUGGAGE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_LUGGAGE_KEY);
  }
};

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
  activeLuggageId: getStoredActiveLuggageId(),
  setActiveLuggageId: (id) => {
    storeActiveLuggageId(id);
    set({ activeLuggageId: id });
  },
}));
