import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { DArtWork } from '@/context/auth-context';

interface MapProps {
  dArtWorks: DArtWork[];
  selectedArt: DArtWork | null;
  onSelectArtwork: (art: DArtWork | null) => void;
  userLocation: { latitude: number; longitude: number };
  onUserLocationChange: (newLocation: { latitude: number; longitude: number }) => void;
  userEmoji?: string;
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
  const mapRef = useRef<MapView>(null);

  // Focus and zoom when an artwork is selected
  useEffect(() => {
    if (selectedArt && mapRef.current) {
      const coords = getDArtWorkCoords(selectedArt);
      if (coords) {
        const [lat, lng] = coords;
        mapRef.current.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      }
    }
  }, [selectedArt]);

  const initialLat = userLocation?.latitude || 46.0697;
  const initialLng = userLocation?.longitude || 11.1211;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Draggable user location marker */}
        <Marker
          coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
          draggable
          onDragEnd={(e) => {
            if (e.nativeEvent && e.nativeEvent.coordinate) {
              onUserLocationChange({
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
              });
            }
          }}
          title="La tua posizione"
          description="Trascina per spostarti a Trento"
        >
          <View style={styles.userMarkerBubble}>
            <Text style={{ fontSize: 16 }}>{userEmoji}</Text>
          </View>
        </Marker>

        {dArtWorks.map((art) => {
          const coords = getDArtWorkCoords(art);
          if (!coords) return null; // Skip invalid/empty coordinates
          const [lat, lng] = coords;

          const isSelected = selectedArt?.id === art.id;
          const emoji = '🖌️';

          return (
            <Marker
              key={art.id}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => onSelectArtwork(art)}
              title={art.title}
              description={`di @${art.artist} @ ${art.locationName}`}
            >
              {/* Modern glowing styled marker without circular background */}
              <View style={styles.markerContainer}>
                <Text style={[
                  styles.markerEmoji,
                  isSelected ? styles.markerEmojiActive : styles.markerEmojiInactive
                ]}>
                  {emoji}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  markerEmoji: {
    fontSize: 32,
  },
  markerEmojiActive: {
    transform: [{ scale: 1.35 }],
    textShadowColor: '#D8B4F8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  markerEmojiInactive: {
    transform: [{ scale: 1.0 }],
    textShadowColor: '#FDE047',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  userMarkerBubble: {
    backgroundColor: '#3498db',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
});
