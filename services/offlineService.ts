import { openDB } from 'idb';
import { BusRoute } from '../types';

const DB_NAME = 'ybs-db';
const DB_VERSION = 1;

interface StopData {
  id: string;
  name_en: string;
  name_mm: string;
  lat: number;
  lng: number;
}

interface RouteData {
  id: string;
  stops: string[];
  color?: string;
  operator?: string;
}

// Initialize IndexedDB
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Routes store
    if (!db.objectStoreNames.contains('routes')) {
      db.createObjectStore('routes');
    }
    // Stops store
    if (!db.objectStoreNames.contains('stops')) {
      db.createObjectStore('stops');
    }
    // Discovery info store
    if (!db.objectStoreNames.contains('discovery')) {
      db.createObjectStore('discovery');
    }
  },
});

// Check if user is online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Cache bus routes
export async function cacheRoutes(routes: BusRoute[]): Promise<void> {
  try {
    const db = await dbPromise;
    await db.put('routes', routes, 'allRoutes');
    console.log('Routes cached successfully');
  } catch (error) {
    console.error('Failed to cache routes:', error);
  }
}

// Get cached routes
export async function getCachedRoutes(): Promise<BusRoute[] | null> {
  try {
    const db = await dbPromise;
    const routes = await db.get('routes', 'allRoutes');
    return routes || null;
  } catch (error) {
    console.error('Failed to get cached routes:', error);
    return null;
  }
}

// Cache stops data
export async function cacheStops(stops: StopData[]): Promise<void> {
  try {
    const db = await dbPromise;
    await db.put('stops', stops, 'allStops');
    console.log('Stops cached successfully');
  } catch (error) {
    console.error('Failed to cache stops:', error);
  }
}

// Get cached stops
export async function getCachedStops(): Promise<StopData[] | null> {
  try {
    const db = await dbPromise;
    const stops = await db.get('stops', 'allStops');
    return stops || null;
  } catch (error) {
    console.error('Failed to get cached stops:', error);
    return null;
  }
}

// Cache discovery info
export async function cacheDiscoveryInfo(info: string): Promise<void> {
  try {
    const db = await dbPromise;
    await db.put('discovery', info, 'discoveryInfo');
    console.log('Discovery info cached successfully');
  } catch (error) {
    console.error('Failed to cache discovery info:', error);
  }
}

// Get cached discovery info
export async function getCachedDiscoveryInfo(): Promise<string | null> {
  try {
    const db = await dbPromise;
    const info = await db.get('discovery', 'discoveryInfo');
    return info || null;
  } catch (error) {
    console.error('Failed to get cached discovery info:', error);
    return null;
  }
}

// Clear all cached data
export async function clearCache(): Promise<void> {
  try {
    const db = await dbPromise;
    await db.clear('routes');
    await db.clear('stops');
    await db.clear('discovery');
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Get cache size (approximate)
export async function getCacheSize(): Promise<number> {
  try {
    const db = await dbPromise;
    const routes = await db.get('routes', 'allRoutes');
    const stops = await db.get('stops', 'allStops');
    const discovery = await db.get('discovery', 'discoveryInfo');

    const routesSize = routes ? JSON.stringify(routes).length : 0;
    const stopsSize = stops ? JSON.stringify(stops).length : 0;
    const discoverySize = discovery ? discovery.length : 0;

    return routesSize + stopsSize + discoverySize;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}
