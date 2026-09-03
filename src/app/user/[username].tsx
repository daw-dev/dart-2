import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, DArtWork } from '@/context/auth-context';
import { ThemedText } from '@/components/themed-text';
import { SymbolView } from '@/components/symbol-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router, useLocalSearchParams } from 'expo-router';
import { translations } from '@/constants/translations';
import { ArtworkModal } from '@/components/artwork-modal';
import { ReportModal } from '@/components/report-modal';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { users, currentUser, dArtWorks, language, toggleFollowUser } = useAuth();
  const t = translations[language];
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const [selectedArtwork, setSelectedArtwork] = useState<DArtWork | null>(null);
  const [reportTargetId, setReportTargetId] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const artist = users.find(
    (u) => u.username.toLowerCase() === (username || '').toLowerCase()
  );

  const isFollowing = currentUser && artist ? currentUser.following.includes(artist.username) : false;
  const isMe = currentUser && artist ? currentUser.username.toLowerCase() === artist.username.toLowerCase() : false;

  const artistArts = artist
    ? dArtWorks.filter((a) => artist.exposition?.includes(a.id) || a.artist === artist.username)
    : [];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: safeAreaInsets.top + Spacing.two }]}
    >
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorderSubtle }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Torna indietro"
            hitSlop={12}
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/explore');
              }
            }}
          >
            <SymbolView name="arrow.left" size={26} tintColor={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={{ fontWeight: '900' }}>
            {artist ? `@${artist.username}` : 'Profilo Utente'}
          </ThemedText>
        </View>

        {!artist ? (
          <View style={[styles.notFoundCard, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
            <ThemedText type="subtitle" style={{ textAlign: 'center', fontWeight: '900' }}>
              Utente non trovato
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.one }}>
              L'utente "@{username}" non esiste o non ha ancora pubblicato opere.
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: Spacing.three }}>
            {/* Artist Profile Card */}
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorderSubtle,
                },
              ]}
            >
              <View style={styles.avatarRow}>
                <View style={[styles.avatarCircle, { backgroundColor: artist.profilePicColor, borderColor: theme.cardBorderSubtle }]}>
                  <ThemedText style={{ fontSize: 36 }}>{artist.profilePicEmoji || '👤'}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontWeight: '900' }}>
                    @{artist.username}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {artist.email}
                  </ThemedText>

                  {/* Follow Button */}
                  {currentUser && !isMe && (
                    <Pressable
                      style={[
                        styles.followBtn,
                        isFollowing
                          ? { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }
                          : { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                      onPress={() => toggleFollowUser(artist.username)}
                    >
                      <ThemedText
                        type="smallBold"
                        style={{ color: isFollowing ? theme.text : '#FFFFFF' }}
                      >
                        {isFollowing ? 'Seguito' : '+ Segui Artista'}
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Bio */}
              {artist.bio ? (
                <View style={[styles.bioBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}>
                  <ThemedText type="small">
                    {artist.bio}
                  </ThemedText>
                </View>
              ) : null}

              {/* Stats */}
              <View style={[styles.statsRow, { borderTopColor: theme.divider }]}>
                <View style={styles.statCol}>
                  <ThemedText type="smallBold">
                    {artist.followers?.length || 0}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">Follower</ThemedText>
                </View>
                <View style={styles.statCol}>
                  <ThemedText type="smallBold">
                    {artist.following?.length || 0}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">Seguiti</ThemedText>
                </View>
                <View style={styles.statCol}>
                  <ThemedText type="smallBold">
                    {artistArts.length}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">D'ArtWorks</ThemedText>
                </View>
              </View>
            </View>

            {/* Badges */}
            {artist.badges && artist.badges.length > 0 && (
              <View style={[styles.badgesSection, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
                <ThemedText type="smallBold" style={{ marginBottom: Spacing.one }}>
                  {t.myBadges}
                </ThemedText>
                <View style={styles.badgeRow}>
                  {artist.badges.map((b) => (
                    <View
                      key={b}
                      style={[
                        styles.badgeChip,
                        { backgroundColor: theme.badgeBg, borderColor: theme.cardBorderSubtle },
                      ]}
                    >
                      <ThemedText type="code" style={[styles.badgeText, { color: theme.badgeText }]}>
                        {b}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Artist Style Hashtags */}
            {artist.hashtags && artist.hashtags.length > 0 && (
              <View style={[styles.badgesSection, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
                <ThemedText type="smallBold" style={{ marginBottom: Spacing.one }}>
                  Stile & Hashtag Artista
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one }}>
                  {artist.hashtags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.badgeChip,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle },
                      ]}
                    >
                      <ThemedText type="code" style={{ color: theme.primary, fontWeight: '700' }}>
                        #{tag}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Artworks List */}
            <View style={[styles.badgesSection, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
              <ThemedText type="smallBold" style={{ marginBottom: Spacing.two }}>
                D'ArtWork Esposti ({artistArts.length})
              </ThemedText>

              {artistArts.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', paddingVertical: Spacing.two }}>
                  Nessun'opera esposta al momento.
                </ThemedText>
              ) : (
                <View style={{ gap: Spacing.one }}>
                  {artistArts.map((art) => (
                    <Pressable
                      key={art.id}
                      style={[styles.artRow, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}
                      onPress={() => setSelectedArtwork(art)}
                    >
                      {art.preview ? (
                        <Image source={{ uri: art.preview }} style={{ width: 44, height: 44, borderRadius: 6 }} resizeMode="cover" />
                      ) : (
                        <ThemedText type="code" style={{ fontSize: 10 }}>D'Art</ThemedText>
                      )}
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{art.title}</ThemedText>
                        <ThemedText type="code" themeColor="textSecondary">
                          {art.locationName} • Like: {art.likesCount}
                        </ThemedText>
                      </View>
                      {art.isSensitive && (
                        <View style={[styles.expiredPill, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                          <ThemedText type="code" style={{ color: '#EF4444', fontSize: 10, fontWeight: '800' }}>
                            Sensibile
                          </ThemedText>
                        </View>
                      )}
                      {art.isExpired ? (
                        <View style={[styles.expiredPill, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                          <ThemedText type="code" style={{ color: '#EF4444', fontSize: 10, fontWeight: '800' }}>
                            Scaduto
                          </ThemedText>
                        </View>
                      ) : (
                        <View style={[styles.expiredPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                          <ThemedText type="code" style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>
                            Attivo
                          </ThemedText>
                        </View>
                      )}
                      <SymbolView name="chevron.right" size={14} tintColor={theme.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Artwork Modal */}
      {selectedArtwork && (
        <ArtworkModal
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onOpenReport={(id) => {
            setReportTargetId(id);
            setIsReportOpen(true);
          }}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        visible={isReportOpen}
        targetId={reportTargetId}
        targetType="artwork"
        onClose={() => setIsReportOpen(false)}
        onReportSuccess={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.four,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 600,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing.one,
  },
  notFoundCard: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    borderWidth: 1,
    marginTop: Spacing.three,
  },
  profileCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.two,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  followBtn: {
    marginTop: Spacing.one,
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  bioBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  statCol: {
    alignItems: 'center',
  },
  badgesSection: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  badgeChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  artRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  expiredPill: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
