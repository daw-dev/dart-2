import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Pressable,
  Platform,
  Clipboard,
  View,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, DArtWork } from '@/context/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from '@/components/symbol-view';
import { router, useLocalSearchParams } from 'expo-router';
import { Map, getDArtWorkCoords } from '@/components/map';
import { translations } from '@/constants/translations';
import { ReportModal } from '@/components/report-modal';
import { ArSimulator } from '@/components/ar-simulator';
import { ArtworkModal } from '@/components/artwork-modal';
import { NotificationsModal } from '@/components/notifications-modal';
import { usePosition, getDistanceMeters } from '@/hooks/use-position';

export default function HomeScreen() {
  const {
    currentUser,
    dArtWorks,
    users,
    notifications,
    language,
    likeDArtWork,
    commentDArtWork,
    toggleFavoriteCollection,
  } = useAuth();

  const t = translations[language];
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const [selectedArt, setSelectedArt] = useState<DArtWork | null>(null);
  const [mapCommentText, setMapCommentText] = useState('');
  const { userLocation, setUserLocation, moveBy, teleportTo } = usePosition();
  const [revealedSensitive, setRevealedSensitive] = useState<Record<string, boolean>>({});
  const [isArActive, setIsArActive] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const params = useLocalSearchParams<{ selectArtId?: string }>();

  const activeArt = selectedArt
    ? dArtWorks.find((a) => a.id === selectedArt.id) || selectedArt
    : null;

  const artistUser = activeArt
    ? users.find((u) => u.username.toLowerCase() === activeArt.artist.toLowerCase())
    : null;

  const selectedArtCoords = activeArt ? getDArtWorkCoords(activeArt) : null;
  const distanceToSelected =
    selectedArtCoords && userLocation
      ? getDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          selectedArtCoords[0],
          selectedArtCoords[1]
        )
      : null;

  // RF3 / D1 specs: activation radius is within 30 meters
  const isWithinRadius = distanceToSelected !== null && distanceToSelected <= 30;

  const handleSendMapComment = () => {
    if (!mapCommentText.trim() || !activeArt) return;
    commentDArtWork(activeArt.id, mapCommentText.trim());
    setMapCommentText('');
  };

  // Keyboard navigation for movement simulation on web (WASD / Arrows)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const STEP = 0.00008; // ~8-9 meters step
      let dLat = 0;
      let dLng = 0;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        dLat += STEP;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        dLat -= STEP;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        dLng -= STEP;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        dLng += STEP;
      } else {
        return;
      }

      e.preventDefault();
      moveBy(dLat, dLng);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveBy]);

  useEffect(() => {
    if (params.selectArtId && dArtWorks.length > 0) {
      const art = dArtWorks.find((a) => a.id === params.selectArtId);
      if (art) {
        setSelectedArt(art);
        const coords = getDArtWorkCoords(art);
        if (coords) {
          setUserLocation({
            latitude: coords[0],
            longitude: coords[1],
          });
        }
      }
    }
  }, [params.selectArtId, dArtWorks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleShare = (art: DArtWork) => {
    const shareMsg = `Visita "${art.title}" di @${art.artist} in "${art.locationName}"! Link: dart-app://d-art-work/${art.id}`;
    Clipboard.setString(shareMsg);
    showToast(t.copiedToClipboard);
  };

  const isLikedByMe = (art: DArtWork) =>
    !!currentUser && art.likedByUsernames.includes(currentUser.username);

  const isFavoritedByMe = (art: DArtWork) =>
    !!currentUser && currentUser.collection.includes(art.id);

  const isSensitiveHidden = selectedArt?.isSensitive && !revealedSensitive[selectedArt.id];

  // Only active (non-expired) artworks are shown as map pins
  const activeDArtWorks = useMemo(
    () => dArtWorks.filter((a) => !a.isExpired),
    [dArtWorks]
  );

  return (
    <SafeAreaView style={[styles.mainSafeArea, { backgroundColor: theme.background }]}>
      {/* Map View - Only shows active artworks */}
      <Map
        dArtWorks={activeDArtWorks}
        selectedArt={selectedArt}
        onSelectArtwork={setSelectedArt}
        userLocation={userLocation}
        onUserLocationChange={setUserLocation}
        userEmoji={currentUser?.profilePicEmoji || '👤'}
      />

      {/* Header Overlay */}
      <View
        style={[
          styles.headerOverlay,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorderSubtle,
          },
        ]}
      >
        <Pressable style={styles.searchBarBox} onPress={() => router.replace('/explore')}>
          <SymbolView name="magnifyingglass" size={18} tintColor={theme.text} />
          <ThemedText type="default" style={[styles.searchBarText, { color: theme.textSecondary }]}>
            {t.explore}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.headerBtn, { backgroundColor: theme.inputBg, borderColor: theme.cardBorderSubtle }]}
          onPress={() => setIsNotifOpen(!isNotifOpen)}
        >
          <SymbolView name="bell" size={20} tintColor={theme.text} />
          {notifications.filter((n) => !n.read).length > 0 && (
            <View style={styles.notifBadge}>
              <ThemedText style={styles.notifBadgeText}>
                {notifications.filter((n) => !n.read).length}
              </ThemedText>
            </View>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profilo utente"
          style={[
            styles.headerBtn,
            styles.profileHeaderBtn,
            {
              backgroundColor: currentUser?.profilePicColor ? currentUser.profilePicColor + '33' : theme.inputBg,
              borderColor: currentUser?.profilePicColor || theme.cardBorderSubtle,
            },
          ]}
          onPress={() => router.push('/profile')}
        >
          {currentUser ? (
            <View style={styles.profileBadgeInner}>
              <ThemedText style={{ fontSize: 18, lineHeight: 22 }}>{currentUser.profilePicEmoji}</ThemedText>
            </View>
          ) : (
            <SymbolView name="person" size={20} tintColor={theme.text} />
          )}
        </Pressable>
      </View>

      {/* Notifications Modal */}
      <NotificationsModal
        visible={isNotifOpen}
        notifications={notifications}
        onClose={() => setIsNotifOpen(false)}
      />

      {/* Selected Artwork Preview Card Centered Modal */}
      {activeArt && (
        <View style={styles.centerCardBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedArt(null)} />
          <View
            style={[
              styles.centerCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorderSubtle,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
              <View style={[styles.bottomCardHeader, { borderBottomColor: theme.divider }]}>
                {activeArt && (
                  <Pressable
                    onPress={() => router.push(`/user/${activeArt.artist}`)}
                    style={[
                      styles.artistAvatarCircle,
                      {
                        backgroundColor: artistUser?.profilePicColor || theme.primary,
                        borderColor: theme.cardBorderSubtle,
                      },
                    ]}
                  >
                    <ThemedText style={styles.artistAvatarEmoji}>
                      {artistUser?.profilePicEmoji || '🎨'}
                    </ThemedText>
                  </Pressable>
                )}
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={styles.bottomCardTitle}>
                    {activeArt.title}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <ThemedText type="small" themeColor="textSecondary">da</ThemedText>
                    <Pressable onPress={() => router.push(`/user/${activeArt.artist}`)}>
                      <ThemedText type="smallBold" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                        @{activeArt.artist}
                      </ThemedText>
                    </Pressable>
                    <ThemedText type="small" themeColor="textSecondary">
                      • {activeArt.locationName}
                    </ThemedText>
                  </View>
                </View>
                <Pressable style={styles.closeCardBtn} onPress={() => setSelectedArt(null)}>
                  <SymbolView name="xmark" size={20} tintColor={theme.text} />
                </Pressable>
              </View>

              {isSensitiveHidden ? (
                <View style={[styles.sensitiveBox, { backgroundColor: theme.isDark ? '#3B1219' : '#FFE3E3', borderColor: '#FF6B6B' }]}>
                  <ThemedText type="smallBold" style={{ color: '#FF6B6B' }}>
                    {t.sensitiveWarningTitle}
                  </ThemedText>
                  <Pressable
                    style={[styles.revealBtn, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}
                    onPress={() => setRevealedSensitive((prev) => ({ ...prev, [activeArt.id]: true }))}
                  >
                    <ThemedText type="smallBold">{t.sensitiveShowAnyway}</ThemedText>
                  </Pressable>
                </View>
              ) : (
                <>
                  {activeArt.preview && (
                    <Image
                      source={{ uri: activeArt.preview }}
                      style={styles.cardPreviewBanner}
                      resizeMode="cover"
                    />
                  )}
                  <ThemedText type="small" style={styles.bottomCardDesc}>
                    {activeArt.description}
                  </ThemedText>

                  <View style={styles.tagsContainer}>
                    {activeArt.isExpired ? (
                      <View style={[styles.licenseBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                        <ThemedText type="code" style={[styles.licenseText, { color: '#EF4444', fontWeight: '800' }]}>
                          Esposizione Conclusa
                        </ThemedText>
                      </View>
                    ) : activeArt.expirationDate ? (
                      <View style={[styles.licenseBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                        <ThemedText type="code" style={[styles.licenseText, { color: '#10B981', fontWeight: '700' }]}>
                          Fino al {new Date(activeArt.expirationDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                        </ThemedText>
                      </View>
                    ) : null}
                    {activeArt.license && (
                      <View style={[styles.licenseBadge, { backgroundColor: theme.licenseBg, borderColor: theme.cardBorderSubtle }]}>
                        <ThemedText type="code" style={[styles.licenseText, { color: theme.licenseText }]}>
                          {activeArt.license}
                        </ThemedText>
                      </View>
                    )}
                    {activeArt.hashtags.map((tag) => (
                      <View key={tag} style={[styles.tagChip, { backgroundColor: theme.tagBg, borderColor: theme.cardBorderSubtle }]}>
                        <ThemedText type="code" style={[styles.tagChipText, { color: theme.tagText }]}>
                          #{tag}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Quick Stats */}
              <View style={[styles.statsBar, { borderColor: theme.divider }]}>
                <Pressable
                  style={styles.statBtn}
                  onPress={() => currentUser && likeDArtWork(activeArt.id)}
                >
                  <SymbolView
                    name={isLikedByMe(activeArt) ? 'heart.fill' : 'heart'}
                    size={18}
                    tintColor={isLikedByMe(activeArt) ? '#FF4B4B' : theme.text}
                  />
                  <ThemedText type="smallBold">{activeArt.likesCount}</ThemedText>
                </Pressable>

                <View style={styles.statBtn}>
                  <SymbolView name="bubble.left" size={18} tintColor={theme.text} />
                  <ThemedText type="smallBold">{activeArt.comments.length}</ThemedText>
                </View>

                <Pressable
                  style={styles.statBtn}
                  onPress={() => currentUser && toggleFavoriteCollection(activeArt.id)}
                >
                  <SymbolView
                    name={isFavoritedByMe(activeArt) ? 'star.fill' : 'star'}
                    size={18}
                    tintColor={isFavoritedByMe(activeArt) ? '#D8B4F8' : theme.text}
                  />
                </Pressable>

                <Pressable style={styles.statBtn} onPress={() => handleShare(activeArt)}>
                  <SymbolView name="square.and.arrow.up" size={18} tintColor={theme.text} />
                </Pressable>

                <Pressable
                  style={styles.statBtn}
                  onPress={() => {
                    setReportTargetId(activeArt.id);
                    setIsReportOpen(true);
                  }}
                >
                  <SymbolView name="flag" size={16} tintColor="#FF6B6B" />
                  <ThemedText type="smallBold" style={{ color: '#FF6B6B', fontSize: 11 }}>
                    {t.reportBtn}
                  </ThemedText>
                </Pressable>
              </View>

              {/* Proximity and Movement Status */}
              <View style={styles.proximityRow}>
                <View
                  style={[
                    styles.distanceBadge,
                    {
                      backgroundColor: isWithinRadius ? '#059669' : '#D97706',
                      borderColor: 'transparent',
                    },
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 11 }}>
                    {isWithinRadius
                      ? `${t.activationRadiusActive} (${distanceToSelected}m)`
                      : `${t.activationDistance} ${distanceToSelected}m (>30m)`}
                  </ThemedText>
                </View>

                {/* Quick helper button to teleport adjacent to the artwork */}
                {selectedArtCoords && (
                  <Pressable
                    style={[
                      styles.simulateBtn,
                      { backgroundColor: theme.inputBg, borderColor: theme.cardBorderSubtle },
                    ]}
                    onPress={() => {
                      setUserLocation({
                        latitude: selectedArtCoords[0],
                        longitude: selectedArtCoords[1],
                      });
                    }}
                  >
                    <ThemedText type="code" style={{ fontSize: 10, fontWeight: '700' }}>
                      {isWithinRadius ? 'Sul posto' : 'Teletrasportati qui'}
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              {/* Interactive movement hint */}
              <View style={[styles.hintBox, { backgroundColor: theme.inputBg }]}>
                <ThemedText type="code" style={[styles.hintText, { color: theme.textSecondary }]}>
                  {t.moveAvatarHint}
                </ThemedText>
              </View>

              {/* Simulation Note for GPS proximity */}
              <View style={[styles.simNoticePill, { backgroundColor: theme.isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#6366F1' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ThemedText type="code" style={{ color: '#6366F1', fontWeight: '800', fontSize: 10 }}>
                    Posizione GPS & Movimento Simulati (Prototipo)
                  </ThemedText>
                </View>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 9.5, marginTop: 2, lineHeight: 13 }}>
                  Nel prototipo didattico muovi l'avatar via tastiera (frecce/WASD) o teletrasporto. Nell'app reale, la posizione è rilevata in continuo dal sensore GPS/GNSS dello smartphone mentre cammini per le vie di Trento.
                </ThemedText>
              </View>

              {/* AR Visit CTA */}
              <Pressable
                style={[
                  styles.visitBtn,
                  { backgroundColor: theme.primary, borderColor: theme.primary },
                  (!isWithinRadius || activeArt.isExpired) && [
                    styles.visitBtnDisabled,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle },
                  ],
                ]}
                disabled={!isWithinRadius || activeArt.isExpired}
                onPress={() => setIsArActive(true)}
              >
                <ThemedText
                  type="default"
                  style={[
                    styles.visitBtnText,
                    { color: isWithinRadius && !activeArt.isExpired ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {activeArt.isExpired
                    ? 'Esposizione Conclusa'
                    : isWithinRadius
                    ? t.visitArBtn
                    : `${t.tooFarNotice} (${distanceToSelected !== null ? `${distanceToSelected}m` : ''})`}
                </ThemedText>
              </Pressable>

              {/* Comments Section */}
              <View style={[styles.mapCommentsSection, { borderTopColor: theme.divider }]}>
                <ThemedText type="smallBold" style={{ marginBottom: Spacing.one, fontWeight: '800' }}>
                  {t.commentsTitle} ({activeArt.comments.length})
                </ThemedText>

                {activeArt.comments.length > 0 ? (
                  <View style={{ gap: Spacing.one, marginBottom: Spacing.two }}>
                    {activeArt.comments.map((c) => {
                      const isArtistOfArtwork =
                        c.username.toLowerCase() === activeArt.artist.toLowerCase();
                      return (
                        <View
                          key={c.id}
                          style={[
                            styles.commentItem,
                            {
                              backgroundColor: theme.surfaceSubtle,
                              borderColor: theme.cardBorderSubtle,
                            },
                          ]}
                        >
                          <ThemedText type="smallBold">
                            @{c.username}{' '}
                            {isArtistOfArtwork && (
                              <ThemedText type="code" style={styles.artistBadge}>
                                [Artista]
                              </ThemedText>
                            )}
                          </ThemedText>
                          <ThemedText type="small" style={{ marginTop: 2 }}>
                            {c.text}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two, fontStyle: 'italic' }}>
                    Nessun commento per questa opera.
                  </ThemedText>
                )}

                {/* Comment Input */}
                {currentUser ? (
                  <View style={[styles.mapInputRow, { borderTopColor: theme.divider }]}>
                    <TextInput
                      style={[
                        styles.mapCommentInput,
                        {
                          backgroundColor: theme.inputBg,
                          borderColor: theme.inputBorder,
                          color: theme.text,
                        },
                      ]}
                      placeholder={t.writeCommentPlaceholder}
                      placeholderTextColor={theme.placeholder}
                      value={mapCommentText}
                      onChangeText={setMapCommentText}
                    />
                    <Pressable
                      style={[styles.sendBtn, { backgroundColor: theme.primary }]}
                      onPress={handleSendMapComment}
                    >
                      <SymbolView name="paperplane.fill" size={16} tintColor="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, textAlign: 'center', marginVertical: 4 }}>
                    Accedi per commentare e mettere like.
                  </ThemedText>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* AR Simulation Mode */}
      {isArActive && activeArt && (
        <ArSimulator
          artwork={activeArt}
          onClose={() => setIsArActive(false)}
          onPhotoSaved={() => showToast(t.photoSavedNotice)}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        visible={isReportOpen}
        targetId={reportTargetId}
        targetType="artwork"
        onClose={() => setIsReportOpen(false)}
        onReportSuccess={(msg) => showToast(msg)}
      />

      {/* Bottom Floating Publish Button (Only for authenticated users) */}
      {currentUser && !selectedArt && !isArActive && (
        <View style={[styles.bottomPublishContainer, { bottom: safeAreaInsets.bottom + Spacing.three }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pubblica un nuovo D'ArtWork"
            style={[
              styles.bottomPublishBtn,
              {
                backgroundColor: theme.primary,
                borderColor: theme.isDark ? '#7C3AED' : '#6D28D9',
              },
            ]}
            onPress={() => router.push('/publish')}
          >
            <ThemedText type="smallBold" style={styles.bottomPublishText}>
              {t.createArtworkBtn}
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Toast Alert */}
      {toastMessage ? (
        <View style={[styles.toastCard, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
          <ThemedText type="smallBold">{toastMessage}</ThemedText>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainSafeArea: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: Spacing.three,
    right: Spacing.three,
    height: 52,
    flexDirection: 'row',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.3)' },
      default: {},
    }),
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  searchBarText: {
    fontSize: 13,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileBadgeInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  centerCardBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 90,
    padding: Spacing.three,
  },
  centerCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '82%',
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    zIndex: 91,
    ...Platform.select({
      web: { boxShadow: '0 12px 36px rgba(0,0,0,0.45)' },
      default: { elevation: 10 },
    }),
  },
  bottomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingBottom: Spacing.one,
    marginBottom: Spacing.one,
  },
  bottomCardTitle: {
    fontWeight: '900',
    fontSize: 18,
  },
  closeCardBtn: {
    padding: Spacing.one,
  },
  artistAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  artistAvatarEmoji: {
    fontSize: 22,
  },
  cardPreviewBanner: {
    width: '100%',
    height: 140,
    borderRadius: Spacing.one,
    marginBottom: Spacing.one,
  },
  bottomCardDesc: {
    fontSize: 12,
    marginBottom: Spacing.one,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  licenseBadge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  licenseText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tagChip: {
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.five,
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.one,
    marginBottom: Spacing.two,
  },
  statBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  proximityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  distanceBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Spacing.five,
  },
  simulateBtn: {
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Spacing.one,
  },
  hintBox: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.one,
    marginBottom: Spacing.two,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  visitBtn: {
    borderWidth: 1.5,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one + 2,
    alignItems: 'center',
  },
  visitBtnDisabled: {
    opacity: 0.6,
  },
  visitBtnText: {
    fontWeight: '900',
    fontSize: 13,
  },
  sensitiveBox: {
    padding: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginVertical: Spacing.two,
  },
  revealBtn: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    marginTop: Spacing.one,
  },
  bottomPublishContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
    ...Platform.select({
      web: { pointerEvents: 'box-none' as any },
      default: {},
    }),
  },
  bottomPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 30,
    borderWidth: 1.5,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.35)', cursor: 'pointer' },
      default: { elevation: 6 },
    }),
  },
  bottomPublishText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  toastCard: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    zIndex: 99999,
  },
  simNoticePill: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    marginTop: Spacing.one,
  },
  mapCommentsSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
  },
  commentItem: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  artistBadge: {
    color: '#D8B4F8',
    fontWeight: 'bold',
    fontSize: 10,
  },
  mapInputRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  mapCommentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    fontSize: 13,
  },
  sendBtn: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 4,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginHint: {
    fontSize: 11,
    textAlign: 'center',
    marginVertical: Spacing.one,
  },
});
