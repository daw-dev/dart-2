import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

const STORAGE_KEY = '@dart_simulated_user_position_v1';

export const DEFAULT_TRENTO_LOCATION: LocationCoords = {
  latitude: 46.0692,
  longitude: 11.1205,
};

// Global in-memory singleton state
let globalLocation: LocationCoords = { ...DEFAULT_TRENTO_LOCATION };
const listeners = new Set<(loc: LocationCoords) => void>();
let isInitialized = false;

// Real geodetic distance in meters using Haversine formula
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Known Trento landmarks for proximity / location naming
export const TRENTO_LANDMARKS: { name: string; latitude: number; longitude: number }[] = [
  { name: 'Piazza Dante', latitude: 46.0718, longitude: 11.1197 },
  { name: 'Piazza Duomo', latitude: 46.0669, longitude: 11.1215 },
  { name: 'Castello del Buonconsiglio', latitude: 46.0712, longitude: 11.1276 },
  { name: 'Torre Civica', latitude: 46.0673, longitude: 11.1218 },
  { name: 'MUSE - Museo delle Scienze', latitude: 46.0632, longitude: 11.1147 },
  { name: 'Torre Vanga', latitude: 46.0708, longitude: 11.1189 },
  { name: 'Fiume Adige (Lungadige)', latitude: 46.0685, longitude: 11.1165 },
];

export function getNearestLandmarkName(latitude: number, longitude: number): string {
  let nearest = TRENTO_LANDMARKS[0];
  let minDistance = getDistanceMeters(latitude, longitude, nearest.latitude, nearest.longitude);

  for (let i = 1; i < TRENTO_LANDMARKS.length; i++) {
    const d = getDistanceMeters(latitude, longitude, TRENTO_LANDMARKS[i].latitude, TRENTO_LANDMARKS[i].longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = TRENTO_LANDMARKS[i];
    }
  }

  if (minDistance <= 150) {
    return nearest.name;
  }
  return `Trento (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
}

// Update position globally, notify all active listeners, and persist to AsyncStorage
function updateGlobalLocation(
  updater: LocationCoords | ((prev: LocationCoords) => LocationCoords)
) {
  const next = typeof updater === 'function' ? updater(globalLocation) : updater;
  globalLocation = {
    latitude: parseFloat(next.latitude.toFixed(6)),
    longitude: parseFloat(next.longitude.toFixed(6)),
  };

  listeners.forEach((listener) => listener(globalLocation));

  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(globalLocation)).catch((err) => {
    console.error('Failed to persist user position:', err);
  });
}

// Hook to access and manipulate persistent simulated user location
export function usePosition() {
  const [userLocation, setLocalLocation] = useState<LocationCoords>(globalLocation);

  useEffect(() => {
    // Register listener
    const listener = (loc: LocationCoords) => {
      setLocalLocation(loc);
    };
    listeners.add(listener);

    // Initial load from storage if not already initialized
    if (!isInitialized) {
      isInitialized = true;
      AsyncStorage.getItem(STORAGE_KEY)
        .then((stored) => {
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (
                typeof parsed?.latitude === 'number' &&
                typeof parsed?.longitude === 'number'
              ) {
                updateGlobalLocation(parsed);
              }
            } catch (e) {
              console.error('Error parsing stored location:', e);
            }
          }
        })
        .catch((e) => console.error('Error loading stored location:', e));
    } else {
      setLocalLocation(globalLocation);
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setUserLocation = useCallback(
    (updater: LocationCoords | ((prev: LocationCoords) => LocationCoords)) => {
      updateGlobalLocation(updater);
    },
    []
  );

  const moveBy = useCallback((dLat: number, dLon: number) => {
    updateGlobalLocation((prev) => ({
      latitude: prev.latitude + dLat,
      longitude: prev.longitude + dLon,
    }));
  }, []);

  const teleportTo = useCallback((latitude: number, longitude: number) => {
    updateGlobalLocation({ latitude, longitude });
  }, []);

  const resetLocation = useCallback(() => {
    updateGlobalLocation(DEFAULT_TRENTO_LOCATION);
  }, []);

  return {
    userLocation,
    setUserLocation,
    moveBy,
    teleportTo,
    resetLocation,
    getDistanceMeters,
    nearestLandmark: getNearestLandmarkName(userLocation.latitude, userLocation.longitude),
  };
}
