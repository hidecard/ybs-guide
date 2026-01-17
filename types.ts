
export interface BusRoute {
  id: string;
  operator?: string;
  stops: string[];
  color?: string; // Hex code or standard color name
}

export interface RouteResult {
  busId: string;
  fromStop: string;
  toStop: string;
  fullRoute: string[];
}

export interface TransferResult {
  firstBus: string;
  secondBus: string;
  transferStop: string;
}

export enum ViewMode {
  BUS_LIST = 'BUS_LIST',
  ROUTE_FINDER = 'ROUTE_FINDER',
  STOP_DIRECTORY = 'STOP_DIRECTORY',
  MAP = 'MAP',
  AI_ASSISTANT = 'AI_ASSISTANT',
  EXPLORE = 'EXPLORE',
  PLACES = 'PLACES',
  FEEDBACK = 'FEEDBACK',
  CARD_COMPANION = 'CARD_COMPANION'
}

export interface CardBalance {
  id: string;
  balance: number;
  lastUpdated: Date;
  currency: string;
}

export interface CardTransaction {
  id: string;
  amount: number;
  type: 'deduct' | 'topup';
  description: string;
  timestamp: Date;
  balanceAfter: number;
}

export interface CardSettings {
  id: string;
  reminderThreshold: number; // Minimum balance before warning
  averageDailySpending: number;
  autoCalculateAverage: boolean;
}
