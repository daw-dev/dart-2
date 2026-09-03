import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, DArtWork, UserProfile } from '@/context/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from '@/components/symbol-view';
import { router, useLocalSearchParams } from 'expo-router';
import { translations } from '@/constants/translations';
import { ArtworkModal } from '@/components/artwork-modal';
import { ReportModal } from '@/components/report-modal';

export default function ExploreScreen() {
  const { dArtWorks, users, language } = useAuth();
  const t = translations[language];
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ query?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTab, setActiveSearchTab] = useState<'dArtWorks' | 'artists'>('dArtWorks');
  const [selectedArt, setSelectedArt] = useState<DArtWork | null>(null);
  const [reportTargetId, setReportTargetId] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (params.query) setSearchQuery(params.query);
  }, [params.query]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const getFilteredDArtWorks = () => {
    // Expired artworks are excluded from Explore and only visible in profiles/albums
    const activeArtworks = dArtWorks.filter((art) => !art.isExpired);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeArtworks;
    if (q.startsWith('#')) {
      const tag = q.substring(1);
      return activeArtworks.filter((art) => art.hashtags.some((h) => h.toLowerCase() === tag));
    }
    return activeArtworks.filter(
      (art) =>
        art.title.toLowerCase().includes(q) ||
        art.artist.toLowerCase().includes(q) ||
        art.locationName.toLowerCase().includes(q) ||
        art.hashtags.some((h) => h.toLowerCase().includes(q))
    );
  };

  const getFilteredUsers = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    if (q.startsWith('#')) {
      const tag = q.substring(1);
      return users.filter((u) => u.hashtags?.some((h) => h.toLowerCase() === tag));
    }
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q) ||
        u.hashtags?.some((h) => h.toLowerCase().includes(q))
    );
  };

  const filteredDArtWorks = getFilteredDArtWorks();
  const filteredUsers = getFilteredUsers();

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: safeAreaInsets.top + Spacing.two }]}
    >
      <View style={styles.container}>
        {/* Header Title with Back Button (D1 Fig. 5) */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorderSubtle }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Torna alla mappa"
            hitSlop={12}
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
          >
            <SymbolView name="arrow.left" size={26} tintColor={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {t.exploreTitle}
          </ThemedText>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t.exploreSearchPlaceholder}
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <SymbolView name="xmark" size={16} tintColor={theme.text} />
            </Pressable>
          ) : (
            <SymbolView name="magnifyingglass" size={18} tintColor={theme.text} />
          )}
        </View>

        {/* Popular Hashtags */}
        <ThemedText type="smallBold" style={{ marginBottom: Spacing.two }}>
          {t.popularHashtags}
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hashtagRow}>
          {['3DArt', 'Graffiti', 'Realismo', 'Fantasy', 'Cartoon', 'Colorful'].map((tag) => {
            const isActive = searchQuery === `#${tag}`;
            return (
              <Pressable
                key={tag}
                style={[
                  styles.hashtagChip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.tagBg,
                    borderColor: isActive ? theme.primary : theme.cardBorderSubtle,
                  },
                ]}
                onPress={() => setSearchQuery(isActive ? '' : `#${tag}`)}
              >
                <ThemedText
                  type="code"
                  style={[
                    styles.hashtagText,
                    { color: isActive ? '#FFFFFF' : theme.text },
                  ]}
                >
                  #{tag}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Search Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[
              styles.tabButton,
              {
                backgroundColor: activeSearchTab === 'dArtWorks' ? theme.primary : theme.card,
                borderColor: activeSearchTab === 'dArtWorks' ? theme.primary : theme.cardBorderSubtle,
              },
            ]}
            onPress={() => setActiveSearchTab('dArtWorks')}
          >
            <ThemedText
              type="smallBold"
              style={{
                color: activeSearchTab === 'dArtWorks' ? '#FFFFFF' : theme.textSecondary,
              }}
            >
              {t.artworksTab} ({filteredDArtWorks.length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton,
              {
                backgroundColor: activeSearchTab === 'artists' ? '#FF6B6B' : theme.card,
                borderColor: activeSearchTab === 'artists' ? '#FF6B6B' : theme.cardBorderSubtle,
              },
            ]}
            onPress={() => setActiveSearchTab('artists')}
          >
            <ThemedText
              type="smallBold"
              style={{
                color: activeSearchTab === 'artists' ? '#FFFFFF' : theme.textSecondary,
              }}
            >
              {t.artistsTab} ({filteredUsers.length})
            </ThemedText>
          </Pressable>
        </View>

        {/* Results List */}
        {activeSearchTab === 'dArtWorks' ? (
          <View style={styles.resultsGrid}>
            {filteredDArtWorks.map((art) => (
              <View
                key={art.id}
                style={[
                  styles.artCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
                ]}
              >
                <View style={[styles.artCardHeaderPill, { backgroundColor: theme.primary }]}>
                  <ThemedText type="code" style={styles.artCardHeaderText}>
                    D'ARTWORK
                  </ThemedText>
                </View>

                <Pressable style={styles.artCardBody} onPress={() => setSelectedArt(art)}>
                  <View style={[styles.artCanvas, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}>
                    {art.preview ? (
                      <Image
                        source={{ uri: art.preview }}
                        style={{ width: '100%', height: 75, borderRadius: 6, marginBottom: 4 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <ThemedText type="code" style={{ fontSize: 11, color: '#94A3B8' }}>D'Art</ThemedText>
                    )}
                    <ThemedText type="smallBold" style={{ textAlign: 'center', marginTop: 4 }}>
                      {art.title}
                    </ThemedText>
                    <ThemedText type="code" themeColor="textSecondary">
                      @{art.artist}
                    </ThemedText>
                  </View>

                  <View style={styles.tagStack}>
                    {art.isSensitive && (
                      <View style={[styles.licensePill, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                        <ThemedText type="code" style={[styles.pillText, { color: '#EF4444', fontWeight: '800' }]}>
                          Sensibile
                        </ThemedText>
                      </View>
                    )}
                    {art.isExpired ? (
                      <View style={[styles.licensePill, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                        <ThemedText type="code" style={[styles.pillText, { color: '#EF4444', fontWeight: '800' }]}>
                          Scaduto
                        </ThemedText>
                      </View>
                    ) : art.expirationDate ? (
                      <View style={[styles.licensePill, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                        <ThemedText type="code" style={[styles.pillText, { color: '#10B981', fontWeight: '700' }]}>
                          Fino al {new Date(art.expirationDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                        </ThemedText>
                      </View>
                    ) : null}
                    {art.license && (
                      <View style={[styles.licensePill, { backgroundColor: theme.licenseBg, borderColor: theme.cardBorderSubtle }]}>
                        <ThemedText type="code" style={[styles.pillText, { color: theme.licenseText }]}>
                          {art.license.split(' ')[0]}
                        </ThemedText>
                      </View>
                    )}
                    {art.hashtags.map((h) => (
                      <View
                        key={h}
                        style={[
                          styles.tagPill,
                          { backgroundColor: theme.tagBg, borderColor: theme.cardBorderSubtle },
                        ]}
                      >
                        <ThemedText type="code" style={[styles.pillText, { color: theme.tagText }]}>
                          #{h}
                        </ThemedText>
                      </View>
                    ))}
                    <Pressable
                      style={[styles.reportPill, { borderColor: '#DC2626', backgroundColor: theme.isDark ? '#3B1219' : '#FFF0F0' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        setReportTargetId(art.id);
                        setIsReportOpen(true);
                      }}
                    >
                      <ThemedText type="code" style={{ fontSize: 10, color: '#EF4444', fontWeight: '700' }}>
                        {t.reportBtn}
                      </ThemedText>
                    </Pressable>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.resultsGrid}>
            {filteredUsers.map((user) => {
              const isArtist = (user.exposition?.length || 0) > 0;
              const isMod = user.isModerator;
              const userArts = dArtWorks.filter((a) => user.exposition?.includes(a.id) || a.artist === user.username);
              const userFavs = dArtWorks.filter((a) => user.collection?.includes(a.id) || user.album?.includes(a.id));
              const displayArts = isArtist && userArts.length > 0 ? userArts : userFavs;

              const roleLabel = isMod ? 'MODERATORE' : isArtist ? 'ARTISTA' : 'ESPLORATORE';
              const roleBg = isMod ? '#DC2626' : isArtist ? '#8B5CF6' : '#0EA5E9';

              return (
                <View
                  key={user.username}
                  style={[
                    styles.artCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
                  ]}
                >
                  <View style={[styles.artCardHeaderPill, { backgroundColor: roleBg }]}>
                    <ThemedText type="code" style={styles.artCardHeaderText}>
                      {roleLabel}
                    </ThemedText>
                  </View>

                  <Pressable style={styles.artistCardBody} onPress={() => router.push(`/user/${user.username}`)}>
                    <View style={[styles.artistAvatar, { backgroundColor: user.profilePicColor, borderColor: theme.cardBorderSubtle }]}>
                      <ThemedText style={{ fontSize: 26 }}>{user.profilePicEmoji}</ThemedText>
                    </View>

                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">@{user.username}</ThemedText>
                      <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 1 }}>
                        {user.album?.length || 0} visite • {user.collection?.length || 0} in collezione
                        {isArtist ? ` • ${user.exposition?.length || 0} opere` : ''}
                      </ThemedText>

                      <ThemedText type="small" numberOfLines={2} themeColor="textSecondary" style={{ marginTop: 3 }}>
                        {user.bio}
                      </ThemedText>

                      {/* User Hashtags */}
                      {user.hashtags && user.hashtags.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {user.hashtags.slice(0, 3).map((tag) => (
                            <View key={tag} style={{ backgroundColor: theme.surfaceSubtle, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: theme.cardBorderSubtle }}>
                              <ThemedText type="code" style={{ fontSize: 10, color: theme.primary, fontWeight: '700' }}>
                                #{tag}
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Preview Thumbnails */}
                      {displayArts.length > 0 && (
                        <View style={styles.artistPreviewRow}>
                          {displayArts.slice(0, 4).map((a) => (
                            <View
                              key={a.id}
                              style={[
                                styles.previewThumb,
                                { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle },
                              ]}
                            >
                              {a.preview ? (
                                <Image source={{ uri: a.preview }} style={{ width: 24, height: 24, borderRadius: 3 }} resizeMode="cover" />
                              ) : (
                                <ThemedText type="code" style={{ fontSize: 10 }}>D'Art</ThemedText>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Detail Modals */}
      <ArtworkModal
        artwork={selectedArt}
        onClose={() => setSelectedArt(null)}
        onOpenReport={(id) => {
          setReportTargetId(id);
          setIsReportOpen(true);
        }}
      />

      <ReportModal
        visible={isReportOpen}
        targetId={reportTargetId}
        targetType="artwork"
        onClose={() => setIsReportOpen(false)}
        onReportSuccess={(msg) => showToast(msg)}
      />

      {/* Toast Alert */}
      {toastMessage ? (
        <ThemedView style={[styles.toastCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ThemedText type="smallBold">{toastMessage}</ThemedText>
        </ThemedView>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1.5,
    marginBottom: Spacing.three,
  },
  backBtn: {
    padding: Spacing.one,
    marginRight: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '900',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
    height: 46,
    marginBottom: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
  },
  hashtagRow: {
    flexDirection: 'row',
    marginBottom: Spacing.three,
  },
  hashtagChip: {
    borderWidth: 1,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    marginRight: Spacing.one,
  },
  hashtagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Spacing.one + 2,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  resultsGrid: {
    gap: Spacing.two,
  },
  artCard: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
      default: {},
    }),
  },
  artCardHeaderPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: Spacing.one,
  },
  artCardHeaderText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  artCardBody: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  artCanvas: {
    flex: 1.2,
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagStack: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  licensePill: {
    borderWidth: 1,
    paddingHorizontal: Spacing.one + 2,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagPill: {
    borderWidth: 1,
    paddingHorizontal: Spacing.one + 2,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reportPill: {
    borderWidth: 1,
    paddingHorizontal: Spacing.one + 2,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  artistCardBody: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  artistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistPreviewRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.one,
  },
  previewThumb: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
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
});
