import Dexie, { type Table } from 'dexie';

export interface Luggage {
  id: string;
  name: string;
  type: '托运' | '手提' | '随身' | '特殊';
  season: '冬季' | '夏季' | '混合' | '通用';
  length: number;
  width: number;
  height: number;
  weightHistory: { date: string; weight: number; flightId?: string }[];
  createdAt: number;
}

export interface Item {
  id: string;
  luggageId: string;
  name: string;
  category: '衣物' | '器材' | '保養品' | '其他';
  subCategory?: '上衣' | '下裝' | '連身裙' | '鞋子' | '配飾' | '外套' | '內搭' | '襪子' | '內衣' | '內褲';
  season: '冬季' | '夏季' | '通用';
  expirationDate?: string;
  condition: '新' | '舊' | '快用完';
  isDiscardable: boolean;
  notes?: string;
  createdAt: number;
  image?: string;
  
  // Pack AI Refactor - New Metadata
  color?: string;
  occasion?: '商務' | '休閒' | '運動' | '正式' | '其他';
  wrinkleProne?: '易皺' | '適中' | '抗皺';
  tempRange?: string;
  quantity?: number;
  inventoryMode?: 'quick' | 'detail';
  outfitEligible?: boolean;
}

export interface OutfitMatch {
  id: string;
  topItemId: string;
  bottomItemId: string;
  createdAt: number;
}

export interface UserConfig {
  id: string;
  geminiApiKey: string;
  useLocalAi: boolean;
  adPreferences: string;
  gmailToken?: string;
}

export interface Flight {
  id: string;
  departureDate: string;
  departureTime?: string;
  arrivalTime?: string;
  destination: string;
  airline: string;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTerminal?: string;
  arrivalTerminal?: string;
  returnDepartureDate?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnFlightNumber?: string;
  returnDepartureAirport?: string;
  returnArrivalAirport?: string;
  returnDepartureTerminal?: string;
  returnArrivalTerminal?: string;
  checkedAllowance: number;
  carryOnAllowance: number;
  personalAllowance: number;
  rawEmailId?: string;
}

export class NomadicDB extends Dexie {
  luggages!: Table<Luggage, string>;
  items!: Table<Item, string>;
  outfit_matches!: Table<OutfitMatch, string>;
  user_configs!: Table<UserConfig, string>;
  flights!: Table<Flight, string>;

  constructor() {
    super('NomadicLuggageDB');
    this.version(1).stores({
      luggages: 'id, type, season',
      items: 'id, luggageId, category, subCategory, season, expirationDate',
      outfit_matches: 'id, topItemId, bottomItemId',
      user_configs: 'id',
      flights: 'id, departureDate',
    });
    this.version(2).stores({
      items: 'id, luggageId, category, subCategory, season, expirationDate, occasion, wrinkleProne',
    });
  }
}

export const db = new NomadicDB();
