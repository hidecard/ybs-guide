import Fuse from 'fuse.js';
import { BusRoute } from '../types';

let fuse: Fuse<BusRoute> | null = null;

export const initializeSearch = (routes: BusRoute[]) => {
  const options = {
    keys: ['id', 'stops'],
    threshold: 0.3, // Adjust for fuzziness
    includeScore: true,
  };
  fuse = new Fuse(routes, options);
};

export const searchRoutes = (query: string): BusRoute[] => {
  if (!fuse) return [];
  const results = fuse.search(query);
  return results.map(result => result.item);
};
