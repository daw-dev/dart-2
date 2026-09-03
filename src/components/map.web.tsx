import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { DArtWork } from '@/context/auth-context';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface MapProps {
  dArtWorks: DArtWork[];
  selectedArt: DArtWork | null;
  onSelectArtwork: (art: DArtWork | null) => void;
  userLocation: { latitude: number; longitude: number };
  onUserLocationChange: (newLocation: { latitude: number; longitude: number }) => void;
  userEmoji?: string;
}

declare global {
  interface Window {
    L: any;
  }
}

// Helper to resolve coordinates safely, with support for legacy records
export function getDArtWorkCoords(art: DArtWork): [number, number] | null {
  if (
    art &&
    typeof art.latitude === 'number' &&
    typeof art.longitude === 'number' &&
    !isNaN(art.latitude) &&
    !isNaN(art.longitude)
  ) {
    return [art.latitude, art.longitude];
  }

  // Legacy fallback based on locationName if database has missing coordinates
  if (art && art.locationName) {
    const name = art.locationName.toLowerCase().trim();
    if (name.includes('dante')) {
      return [46.0718, 11.1197];
    } else if (name.includes('duomo')) {
      return [46.0669, 11.1215];
    } else if (name.includes('buonconsiglio')) {
      return [46.0712, 11.1276];
    } else if (name.includes('torre civica')) {
      return [46.0673, 11.1218];
    }
  }

  return null;
}

export function Map({
  dArtWorks,
  selectedArt,
  onSelectArtwork,
  userLocation,
  onUserLocationChange,
  userEmoji = '🦊',
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const proximityCircleRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const isDraggingRef = useRef(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep a ref to onUserLocationChange to avoid re-binding Leaflet events
  const onLocationChangeRef = useRef(onUserLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onUserLocationChange;
  }, [onUserLocationChange]);

  // Dynamically load Leaflet assets on mount
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="leaflet.js"]');
    if (existingScript) {
      const handleLoad = () => setLeafletLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    try {
      // Add stylesheet to head
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);

      // Add script to head
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      script.onerror = () => {
        setErrorMsg('Errore nel caricamento delle librerie mappa (Leaflet CDN)');
      };
      document.head.appendChild(script);
    } catch (e) {
      setErrorMsg('Errore durante l\'inizializzazione delle risorse mappa.');
    }
  }, []);

  // Initialize map instance
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const initialLat = userLocation?.latitude || 46.0692;
    const initialLng = userLocation?.longitude || 11.1205;

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        doubleClickZoom: false, // Reserved for user teleport on double-click
      }).setView([initialLat, initialLng], 15);

      mapInstanceRef.current = map;

      // Add zoom control to bottom-right to avoid header overlay collisions
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Use OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Double-click on map moves the user avatar to that exact position
      map.on('dblclick', (e: any) => {
        if (e && e.latlng) {
          onLocationChangeRef.current({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          });
        }
      });

      // Draggable user location marker
      const userIcon = L.divIcon({
        html: `
          <div style="
            background-color: #3b82f6;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 18px;
            cursor: grab;
            user-select: none;
            transition: transform 0.15s ease;
          " title="La tua posizione (Trascina o doppio-click per spostarti)">${userEmoji}</div>
        `,
        className: 'user-location-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const userMarker = L.marker([initialLat, initialLng], {
        icon: userIcon,
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);

      userMarker.bindTooltip('Trascina o fai doppio click sulla mappa per muoverti!', {
        direction: 'top',
        offset: [0, -16],
      });

      userMarker.on('dragstart', () => {
        isDraggingRef.current = true;
      });

      userMarker.on('drag', () => {
        const latlng = userMarker.getLatLng();
        onLocationChangeRef.current({
          latitude: latlng.lat,
          longitude: latlng.lng,
        });
      });

      userMarker.on('dragend', () => {
        isDraggingRef.current = false;
        const latlng = userMarker.getLatLng();
        onLocationChangeRef.current({
          latitude: latlng.lat,
          longitude: latlng.lng,
        });
      });

      userMarkerRef.current = userMarker;
    } catch (e) {
      console.error('Failed to initialize Leaflet Map:', e);
      setErrorMsg('Impossibile inizializzare la mappa interattiva.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        proximityCircleRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Update user marker icon when userEmoji changes
  useEffect(() => {
    const userMarker = userMarkerRef.current;
    if (!userMarker || !leafletLoaded) return;
    const L = window.L;
    const userIcon = L.divIcon({
      html: `
        <div style="
          background-color: #3b82f6;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 20px;
          cursor: grab;
          user-select: none;
          transition: transform 0.15s ease;
        " title="La tua posizione (Trascina o doppio-click per spostarti)">${userEmoji || '👤'}</div>
      `,
      className: 'user-location-marker',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
    userMarker.setIcon(userIcon);
  }, [userEmoji, leafletLoaded]);

  // Sync external userLocation changes to the marker position (e.g. from keyboard WASD or double click)
  useEffect(() => {
    if (!userMarkerRef.current || isDraggingRef.current || !userLocation) return;
    const current = userMarkerRef.current.getLatLng();
    if (
      Math.abs(current.lat - userLocation.latitude) > 0.000001 ||
      Math.abs(current.lng - userLocation.longitude) > 0.000001
    ) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);

  // Render visual 30-meter proximity circle around selected artwork (RF3 / D1 specs)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletLoaded) return;
    const L = window.L;

    if (proximityCircleRef.current) {
      map.removeLayer(proximityCircleRef.current);
      proximityCircleRef.current = null;
    }

    if (selectedArt) {
      const coords = getDArtWorkCoords(selectedArt);
      if (coords) {
        const [lat, lng] = coords;
        const circle = L.circle([lat, lng], {
          radius: 30, // 30 meters activation radius
          color: '#059669',
          weight: 2,
          opacity: 0.8,
          fillColor: '#10B981',
          fillOpacity: 0.18,
          dashArray: '5, 5',
        }).addTo(map);

        circle.bindTooltip("Raggio di attivazione (30m)", {
          permanent: false,
          direction: 'center',
          className: 'proximity-tooltip',
        });

        proximityCircleRef.current = circle;
      }
    }
  }, [selectedArt, leafletLoaded]);

  // Update markers and center on selected art
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletLoaded) return;

    const L = window.L;

    // Clear old markers
    Object.entries(markersRef.current).forEach(([id, marker]: [string, any]) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Add new markers
    dArtWorks.forEach((art) => {
      const coords = getDArtWorkCoords(art);
      if (!coords) return; // Skip invalid/empty coordinates
      const [lat, lng] = coords;

      const isSelected = selectedArt?.id === art.id;
      const emoji = '🖌️';

      // Glow directly on the emoji silhouette / contour with lighter vibrant tones
      const glowFilter = isSelected
        ? 'filter: drop-shadow(0 0 2px #F3E8FF) drop-shadow(0 0 6px #D8B4F8) drop-shadow(0 0 14px rgba(216, 180, 248, 0.95)); transform: scale(1.35);'
        : 'filter: drop-shadow(0 0 2px #FEF08A) drop-shadow(0 0 5px #FDE047) drop-shadow(0 0 11px rgba(254, 240, 138, 0.9)); transform: scale(1.0);';

      const icon = L.divIcon({
        html: `
          <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 32px;
            cursor: pointer;
            background: transparent;
            border: none;
            outline: none;
            ${glowFilter}
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
          ">
            ${emoji}
          </div>
        `,
        className: `art-pin-${art.id}`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: monospace; font-size: 12px; padding: 2px;">
            <b style="font-size: 14px;">${art.title}</b><br/>
            <span>di <b>@${art.artist}</b></span><br/>
            <span>${art.locationName}</span>
          </div>
        `);

      marker.on('click', () => {
        onSelectArtwork(art);
      });

      markersRef.current[art.id] = marker;

      // If this artwork is selected, center on it and open popup
      if (isSelected) {
        map.setView([lat, lng], 16, { animate: true });
        marker.openPopup();
      }
    });

  }, [leafletLoaded, dArtWorks, selectedArt]);

  // Handle map centering when selectedArt is updated but was already loaded
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedArt || !leafletLoaded) return;
    
    const coords = getDArtWorkCoords(selectedArt);
    if (!coords) return;
    const [lat, lng] = coords;

    // Smoothly pan to the coordinates
    map.setView([lat, lng], 16, { animate: true });
    
    const selectedMarker = markersRef.current[selectedArt.id];
    if (selectedMarker) {
      selectedMarker.openPopup();
    }
  }, [selectedArt, leafletLoaded]);

  if (errorMsg) {
    return (
      <ThemedView style={styles.fallbackContainer}>
        <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
      </ThemedView>
    );
  }

  if (!leafletLoaded) {
    return (
      <ThemedView style={styles.fallbackContainer}>
        <ActivityIndicator size="large" color="#ff4757" />
        <ThemedText style={styles.loadingText}>Caricamento mappa in corso...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', outline: 'none' }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  fallbackContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5EBE6',
  },
  errorText: {
    color: '#ff4757',
    fontFamily: 'Courier New',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
    fontWeight: 'bold',
  },
  loadingText: {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#000000',
  },
});
