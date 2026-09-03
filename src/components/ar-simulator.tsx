import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { SymbolView } from '@/components/symbol-view';
import { Spacing } from '@/constants/theme';
import { useAuth, DArtWork } from '@/context/auth-context';
import { translations } from '@/constants/translations';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

export const TRENTO_AR_BACKGROUNDS = [
  {
    id: 'trento-duomo',
    name: 'Piazza Duomo • Trento',
    source: require('../../assets/images/trento/duomo.jpg'),
  },
  {
    id: 'trento-torre-civica',
    name: 'Torre Civica & Palazzo Pretorio • Trento',
    source: require('../../assets/images/trento/torre_civica.jpg'),
  },
  {
    id: 'trento-castello',
    name: 'Castello del Buonconsiglio • Trento',
    source: require('../../assets/images/trento/castello.jpg'),
  },
  {
    id: 'trento-dante',
    name: 'Piazza Dante & Monumento • Trento',
    source: require('../../assets/images/trento/dante.jpg'),
  },
  {
    id: 'trento-panoramica',
    name: 'Piazza Duomo (Vista Panoramica) • Trento',
    source: require('../../assets/images/trento/panoramica.jpg'),
  },
];

interface ArSimulatorProps {
  artwork: DArtWork;
  onClose: () => void;
  onPhotoSaved?: () => void;
}

export function ArSimulator({ artwork, onClose, onPhotoSaved }: ArSimulatorProps) {
  const { currentUser, language, visitDArtWork } = useAuth();
  const t = translations[language];
  const theme = useTheme();
  const [photoTaken, setPhotoTaken] = useState(false);

  // Exact spatial scale and rotation as calibrated and published by the artist
  const artistScale = typeof artwork.scale === 'number' ? artwork.scale : 1.0;
  const artistRotation = typeof artwork.rotation === 'number' ? artwork.rotation : 0;

  // Pick a random Trento background photo on mount
  const [selectedBackground] = useState(() => {
    const randomIndex = Math.floor(Math.random() * TRENTO_AR_BACKGROUNDS.length);
    return TRENTO_AR_BACKGROUNDS[randomIndex];
  });

  // Floating animation for realistic AR depth hovering
  const hoverAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth AR levitation effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: -8,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleCapture = () => {
    visitDArtWork(artwork.id);
    setPhotoTaken(true);
    onPhotoSaved?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top Header Bar matching app theme */}
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.divider }]}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <SymbolView name="chevron.left" size={20} tintColor={theme.text} />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              {artwork.title}
            </ThemedText>
          </Pressable>
          <ThemedText type="code" themeColor="textSecondary" style={styles.locationText}>
            {artwork.locationName}
          </ThemedText>
        </View>

        {/* Camera Viewport */}
        <View style={styles.viewport}>
          {/* Real Trento Environment Background Image */}
          <Image
            source={selectedBackground.source}
            style={styles.bgImage}
            resizeMode="cover"
          />

          {/* Dark Scrim Overlay for AR Contrast and Readability */}
          <View style={styles.arOverlayScrim} />

          {/* Simulation Notice Banner */}
          <View style={[styles.simulationNoticeBanner, { backgroundColor: theme.isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ThemedText type="smallBold" style={{ color: '#6366F1', fontSize: 12 }}>
                VISUALIZZAZIONE AR SIMULATA (Prototipo Didattico)
              </ThemedText>
            </View>
            <ThemedText type="code" themeColor="textSecondary" style={styles.simulationNoticeDesc}>
              Nell'app reale nativa (iOS/Android): ARKit/ARCore traccia lo spazio 6DoF (SLAM), rileva le superfici reali (muri/marciapiedi) e ancora l'asset 3D alle coordinate GPS con stima dell'illuminazione solare e occlusione dei passanti.
            </ThemedText>
          </View>

          {/* Location Badge */}
          <View style={styles.locationBadge}>
            <ThemedText type="code" style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
              {selectedBackground.name}
            </ThemedText>
          </View>

          {/* 3D AR Spatial Object Container positioned as intended by artist */}
          <Animated.View
            style={[
              styles.arObjectWrapper,
              {
                zIndex: 10,
                transform: [{ translateY: hoverAnim }],
              },
            ]}
          >
            {/* Spatial Artwork Image rendered with artist's exact scale & rotation */}
            <View
              style={[
                styles.artworkProjection,
                {
                  transform: [
                    { scale: artistScale },
                    { rotate: `${artistRotation}deg` },
                  ],
                },
              ]}
            >
              {artwork.preview ? (
                <Image
                  source={{ uri: artwork.preview }}
                  style={[styles.artworkImage, { borderColor: theme.cardBorderSubtle }]}
                  resizeMode="contain"
                />
              ) : (
                <ThemedText type="code" style={{ fontSize: 13, color: '#94A3B8' }}>
                  D'Art 3D Projection
                </ThemedText>
              )}
            </View>

            {/* Clean Floating Info Badge matching app theme */}
            <View style={[styles.labelPill, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
              <ThemedText type="smallBold">
                {artwork.title} • @{artwork.artist}
              </ThemedText>
            </View>
          </Animated.View>

          {/* Guide Text */}
          <ThemedText type="code" style={styles.instructions}>
            {t.arGuide}
          </ThemedText>
        </View>

        {/* Bottom Shutter / Capture Bar */}
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
          {currentUser ? (
            <View style={{ alignItems: 'center' }}>
              <Pressable
                style={[
                  styles.captureBtn,
                  { borderColor: theme.primary },
                  photoTaken && { borderColor: '#10B981' },
                ]}
                onPress={handleCapture}
                disabled={photoTaken}
              >
                <View
                  style={[
                    styles.captureInner,
                    { backgroundColor: theme.primary },
                    photoTaken && { backgroundColor: '#10B981' },
                  ]}
                />
              </Pressable>
              <ThemedText type="smallBold" style={{ marginTop: Spacing.one }}>
                {photoTaken ? t.photoSavedNotice : t.snapPhotoBtn}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.guestBox}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                {t.roleGuest}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                {t.guestArNotice}
              </ThemedText>
              <Pressable
                style={[styles.loginBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  onClose();
                  router.replace('/profile');
                }}
              >
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  {t.loginNow}
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 17,
  },
  locationText: {
    fontSize: 12,
  },
  viewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  arOverlayScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  locationBadge: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.five,
    zIndex: 25,
  },
  simulationNoticeBanner: {
    position: 'absolute',
    top: 12,
    left: Spacing.two,
    right: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.one + 2,
    borderWidth: 1.5,
    zIndex: 50,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
      default: { elevation: 6 },
    }),
  },
  simulationNoticeDesc: {
    fontSize: 10,
    marginTop: 3,
    lineHeight: 14,
  },
  arObjectWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  artworkProjection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkImage: {
    width: 170,
    height: 170,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  labelPill: {
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: Spacing.one,
    marginTop: Spacing.three,
  },
  instructions: {
    color: '#94A3B8',
    position: 'absolute',
    bottom: 12,
    textAlign: 'center',
    width: '90%',
    fontSize: 11,
    zIndex: 20,
  },
  footer: {
    padding: Spacing.three,
    alignItems: 'center',
    borderTopWidth: 1,
    zIndex: 100,
  },
  captureBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  guestBox: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  loginBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    marginTop: Spacing.one,
  },
});
