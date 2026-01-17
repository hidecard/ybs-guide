import { BusRoute } from '../types';

interface UserChoice {
  from: string;
  to: string;
  selectedRoute: string;
  timestamp: number;
  aiSuggestion?: string;
}

interface SkippedSuggestion {
  from: string;
  to: string;
  aiSuggestion: string;
  timestamp: number;
}

interface LearningData {
  userChoices: UserChoice[];
  skippedSuggestions: SkippedSuggestion[];
  routePreferences: { [routeId: string]: number };
  locationPreferences: { [location: string]: number };
}

const LEARNING_DATA_KEY = 'ybs_learning_data';

const getLearningData = (): LearningData => {
  const stored = localStorage.getItem(LEARNING_DATA_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse learning data, resetting');
    }
  }
  return {
    userChoices: [],
    skippedSuggestions: [],
    routePreferences: {},
    locationPreferences: {}
  };
};

const saveLearningData = (data: LearningData) => {
  localStorage.setItem(LEARNING_DATA_KEY, JSON.stringify(data));
};

export const recordUserChoice = (from: string, to: string, selectedRoute: string, aiSuggestion?: string) => {
  const data = getLearningData();
  const choice: UserChoice = {
    from: from.toLowerCase().trim(),
    to: to.toLowerCase().trim(),
    selectedRoute,
    timestamp: Date.now(),
    aiSuggestion
  };

  data.userChoices.push(choice);

  // Update route preferences
  data.routePreferences[selectedRoute] = (data.routePreferences[selectedRoute] || 0) + 1;

  // Update location preferences
  data.locationPreferences[choice.from] = (data.locationPreferences[choice.from] || 0) + 1;
  data.locationPreferences[choice.to] = (data.locationPreferences[choice.to] || 0) + 1;

  // Keep only recent data (last 100 choices)
  if (data.userChoices.length > 100) {
    data.userChoices = data.userChoices.slice(-100);
  }

  saveLearningData(data);
};

export const recordSkippedSuggestion = (from: string, to: string, aiSuggestion: string) => {
  const data = getLearningData();
  const skipped: SkippedSuggestion = {
    from: from.toLowerCase().trim(),
    to: to.toLowerCase().trim(),
    aiSuggestion,
    timestamp: Date.now()
  };

  data.skippedSuggestions.push(skipped);

  // Keep only recent data (last 50 skipped suggestions)
  if (data.skippedSuggestions.length > 50) {
    data.skippedSuggestions = data.skippedSuggestions.slice(-50);
  }

  saveLearningData(data);
};

export const getLearnedPreferences = (from: string, to: string) => {
  const data = getLearningData();
  const fromLower = from.toLowerCase().trim();
  const toLower = to.toLowerCase().trim();

  // Find similar trips
  const similarChoices = data.userChoices.filter(choice =>
    (choice.from === fromLower && choice.to === toLower) ||
    (choice.from === toLower && choice.to === fromLower)
  );

  // Get preferred routes for this trip
  const routeCounts: { [routeId: string]: number } = {};
  similarChoices.forEach(choice => {
    routeCounts[choice.selectedRoute] = (routeCounts[choice.selectedRoute] || 0) + 1;
  });

  // Sort routes by preference
  const preferredRoutes = Object.entries(routeCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([routeId]) => routeId);

  return {
    preferredRoutes,
    totalChoices: similarChoices.length,
    routePreferences: data.routePreferences,
    locationPreferences: data.locationPreferences
  };
};

export const getLearningContext = (): string => {
  const data = getLearningData();

  if (data.userChoices.length === 0) {
    return "No learning data available yet.";
  }

  const totalChoices = data.userChoices.length;
  const uniqueRoutes = Object.keys(data.routePreferences).length;
  const uniqueLocations = Object.keys(data.locationPreferences).length;

  // Get top preferred routes
  const topRoutes = Object.entries(data.routePreferences)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([routeId, count]) => `Route ${routeId} (${count} times)`);

  // Get top locations
  const topLocations = Object.entries(data.locationPreferences)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([location, count]) => `${location} (${count} times)`);

  return `User Learning Data:
- Total route choices recorded: ${totalChoices}
- Unique routes used: ${uniqueRoutes}
- Unique locations visited: ${uniqueLocations}
- Most preferred routes: ${topRoutes.join(', ')}
- Most frequent locations: ${topLocations.join(', ')}

Recent choices: ${data.userChoices.slice(-5).map(c => `Route ${c.selectedRoute} for ${c.from} → ${c.to}`).join('; ')}`;
};

export const clearLearningData = () => {
  localStorage.removeItem(LEARNING_DATA_KEY);
};

export const getLearningStats = () => {
  const data = getLearningData();
  return {
    totalChoices: data.userChoices.length,
    totalSkipped: data.skippedSuggestions.length,
    uniqueRoutes: Object.keys(data.routePreferences).length,
    uniqueLocations: Object.keys(data.locationPreferences).length,
    lastActivity: data.userChoices.length > 0 ? data.userChoices[data.userChoices.length - 1].timestamp : null
  };
};
