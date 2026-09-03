import React, { useState } from 'react';
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
import { useAuth, DArtWork } from '@/context/auth-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from '@/components/symbol-view';
import { router } from 'expo-router';
import { translations } from '@/constants/translations';
import { ArtworkModal } from '@/components/artwork-modal';
import { CollectionCuratorModal } from '@/components/collection-curator-modal';
import { ModerationDashboard } from '@/components/moderation-dashboard';
import { AuthForm } from '@/components/auth-form';

export default function ProfileScreen() {
  const { currentUser, dArtWorks, reports, language, updateBio, updateAvatar, updateHashtags } = useAuth();
  const t = translations[language];
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'album' | 'collection' | 'exposition' | 'moderation'>('album');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(currentUser?.bio || '');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editedTags, setEditedTags] = useState(currentUser?.hashtags?.map((t) => `#${t}`).join(' ') || '#StreetArt');
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<DArtWork | null>(null);

  const AVAILABLE_EMOJIS = ['🧑‍🎨', '🎨', '🦊', '🚀', '🐱', '🦁', '⚡', '🌸', '🤖', '🎒', '🕶️', '👾', '👻', '💎', '👑', '🐺', '🦉', '🍕'];
  const AVAILABLE_COLORS = ['#D8B4F8', '#4D96FF', '#6BCB77', '#FF6B6B', '#FFD166', '#FFADAD', '#9BF6FF', '#CAFFBF'];

  const handleSaveBio = () => {
    updateBio(editedBio);
    setIsEditingBio(false);
  };

  const handleSaveTags = () => {
    const parsed = editedTags.split(' ').map((t) => t.replace('#', '').trim()).filter((t) => t.length > 0);
    updateHashtags(parsed);
    setIsEditingTags(false);
  };

  const getTabArtworks = () => {
    if (!currentUser) return [];
    if (activeTab === 'album') return dArtWorks.filter((a) => currentUser.album?.includes(a.id));
    if (activeTab === 'collection') return dArtWorks.filter((a) => currentUser.collection?.includes(a.id));
    if (activeTab === 'exposition') return dArtWorks.filter((a) => currentUser.exposition?.includes(a.id));
    return [];
  };

  const tabArtworks = getTabArtworks();

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: safeAreaInsets.top + Spacing.two }]}
    >
      <View style={styles.container}>
        {/* Header with Back Button (D1 Fig. 3) */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorderSubtle }]}>
          <View style={styles.headerLeft}>
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
            <ThemedText type="subtitle" style={{ fontWeight: '900' }}>
              {currentUser ? `@${currentUser.username}` : 'Accedi'}
            </ThemedText>
          </View>
          {currentUser && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Impostazioni"
              hitSlop={10}
              onPress={() => router.push('/settings')}
            >
              <SymbolView name="gear" size={22} tintColor={theme.text} />
            </Pressable>
          )}
        </View>

        {currentUser ? (
          <View style={{ gap: Spacing.three }}>
            {/* User Profile Card */}
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
                <Pressable
                  style={[styles.avatarCircle, { backgroundColor: currentUser.profilePicColor, borderColor: theme.cardBorderSubtle }]}
                  onPress={() => setIsEditingAvatar(!isEditingAvatar)}
                >
                  <ThemedText style={{ fontSize: 32 }}>{currentUser.profilePicEmoji}</ThemedText>
                  <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: theme.primary, borderRadius: 10, padding: 3 }}>
                    <SymbolView name="pencil" size={10} tintColor="#FFFFFF" />
                  </View>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={{ fontWeight: '900' }}>
                    @{currentUser.username}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {currentUser.email}
                  </ThemedText>
                  <Pressable onPress={() => setIsEditingAvatar(!isEditingAvatar)} style={{ marginTop: 2 }}>
                    <ThemedText type="code" style={{ color: theme.primary, fontSize: 11, fontWeight: '700' }}>
                      {isEditingAvatar ? 'Chiudi personalizzazione' : 'Modifica avatar & colore'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Avatar Selector Panel */}
              {isEditingAvatar && (
                <View style={{ marginTop: Spacing.two, padding: Spacing.two, backgroundColor: theme.surfaceSubtle, borderRadius: Spacing.one, gap: Spacing.one }}>
                  <ThemedText type="code" style={{ fontSize: 11, fontWeight: '700' }}>Scegli Emoji Avatar:</ThemedText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {AVAILABLE_EMOJIS.map((emoji) => (
                      <Pressable
                        key={emoji}
                        style={[
                          { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.cardBorderSubtle },
                          currentUser.profilePicEmoji === emoji && { backgroundColor: theme.primary + '33', borderColor: theme.primary },
                        ]}
                        onPress={() => updateAvatar(emoji)}
                      >
                        <ThemedText style={{ fontSize: 20 }}>{emoji}</ThemedText>
                      </Pressable>
                    ))}
                  </View>

                  <ThemedText type="code" style={{ fontSize: 11, fontWeight: '700', marginTop: Spacing.one }}>Scegli Colore:</ThemedText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {AVAILABLE_COLORS.map((col) => (
                      <Pressable
                        key={col}
                        style={[
                          { width: 26, height: 26, borderRadius: 13, backgroundColor: col, borderWidth: 2, borderColor: '#FFFFFF' },
                          currentUser.profilePicColor === col && { borderColor: theme.text, transform: [{ scale: 1.2 }] },
                        ]}
                        onPress={() => updateAvatar(currentUser.profilePicEmoji, col)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Bio (RF10) */}
              <View style={[styles.bioBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}>
                {isEditingBio ? (
                  <View>
                    <TextInput
                      style={[styles.bioInput, { color: theme.text }]}
                      value={editedBio}
                      onChangeText={setEditedBio}
                      multiline
                      maxLength={350}
                      placeholderTextColor={theme.placeholder}
                    />
                    <View style={styles.bioActionRow}>
                      <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>
                        {editedBio.length}/350 car.
                      </ThemedText>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Pressable style={styles.bioBtnSave} onPress={handleSaveBio}>
                          <ThemedText type="code" style={{ fontWeight: '700', color: '#FFFFFF' }}>Salva</ThemedText>
                        </Pressable>
                        <Pressable style={styles.bioBtnCancel} onPress={() => setIsEditingBio(false)}>
                          <ThemedText type="code" style={{ fontWeight: '700', color: '#FFFFFF' }}>Annulla</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Pressable style={styles.bioDisplay} onPress={() => setIsEditingBio(true)}>
                    <ThemedText type="small" style={{ flex: 1 }}>
                      {currentUser.bio || 'Tocca per aggiungere una biografia...'}
                    </ThemedText>
                    <SymbolView name="pencil" size={14} tintColor={theme.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Stats */}
              <View style={[styles.statsRow, { borderTopColor: theme.divider }]}>
                <View style={styles.statCol}>
                  <ThemedText type="smallBold">
                    {currentUser.followers.length}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">Follower</ThemedText>
                </View>
                <View style={styles.statCol}>
                  <ThemedText type="smallBold">
                    {currentUser.following?.length || 0}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">Seguiti</ThemedText>
                </View>
                <View style={styles.statCol}>
                  <ThemedText type="smallBold">
                    {currentUser.exposition?.length || 0}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">D'ArtWorks</ThemedText>
                </View>
              </View>
            </View>

            {/* Badges */}
            <View style={[styles.badgesSection, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
              <ThemedText type="smallBold" style={{ marginBottom: Spacing.one }}>
                {t.myBadges}
              </ThemedText>
              <View style={styles.badgeRow}>
                {currentUser.badges.map((b) => (
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

            {/* Artist Style Hashtags */}
            <View style={[styles.badgesSection, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.one }}>
                <ThemedText type="smallBold">
                  I Miei Hashtag Artista
                </ThemedText>
                {!isEditingTags && (
                  <Pressable onPress={() => setIsEditingTags(true)}>
                    <SymbolView name="pencil" size={14} tintColor={theme.primary} />
                  </Pressable>
                )}
              </View>

              {isEditingTags ? (
                <View style={{ gap: 6 }}>
                  <TextInput
                    style={[styles.bioInput, { color: theme.text }]}
                    value={editedTags}
                    onChangeText={setEditedTags}
                    placeholder="#StreetArt #3D #Cyberpunk"
                    placeholderTextColor={theme.placeholder}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <Pressable style={styles.bioBtnSave} onPress={handleSaveTags}>
                      <ThemedText type="code" style={{ fontWeight: '700', color: '#FFFFFF' }}>Salva</ThemedText>
                    </Pressable>
                    <Pressable style={styles.bioBtnCancel} onPress={() => setIsEditingTags(false)}>
                      <ThemedText type="code" style={{ fontWeight: '700', color: '#FFFFFF' }}>Annulla</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one }}>
                  {currentUser.hashtags && currentUser.hashtags.length > 0 ? (
                    currentUser.hashtags.map((tag) => (
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
                    ))
                  ) : (
                    <ThemedText type="code" themeColor="textSecondary">
                      Nessun hashtag impostato. Tocca la matita per aggiungerne!
                    </ThemedText>
                  )}
                </View>
              )}
            </View>

            {/* Publish CTA Button */}
            <Pressable
              style={[styles.publishBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => router.push('/publish')}
            >
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                {t.createArtworkBtn}
              </ThemedText>
            </Pressable>

            {/* Section Tabs */}
            <View style={styles.tabsRow}>
              <Pressable
                style={[
                  styles.tab,
                  { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
                  activeTab === 'album' && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setActiveTab('album')}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: activeTab === 'album' ? '#FFFFFF' : theme.textSecondary }}
                >
                  {t.albumTab} ({currentUser.album.length})
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.tab,
                  { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
                  activeTab === 'collection' && { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
                ]}
                onPress={() => setActiveTab('collection')}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: activeTab === 'collection' ? '#FFFFFF' : theme.textSecondary }}
                >
                  {t.collectionTab} ({currentUser.collection.length}/3)
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.tab,
                  { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
                  activeTab === 'exposition' && { backgroundColor: '#10B981', borderColor: '#10B981' },
                ]}
                onPress={() => setActiveTab('exposition')}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: activeTab === 'exposition' ? '#FFFFFF' : theme.textSecondary }}
                >
                  {t.expositionTab} ({currentUser.exposition?.length || 0})
                </ThemedText>
              </Pressable>
              {currentUser.isModerator && (
                <Pressable
                  style={[
                    styles.tab,
                    { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
                    activeTab === 'moderation' && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
                  ]}
                  onPress={() => setActiveTab('moderation')}
                >
                  <ThemedText
                    type="smallBold"
                    style={{ color: activeTab === 'moderation' ? '#FFFFFF' : theme.textSecondary }}
                  >
                    Moderazione ({reports.length})
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {/* Curate Collection CTA */}
            {activeTab === 'collection' && (
              <Pressable
                style={[styles.curateBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setIsCollectionPickerOpen(true)}
              >
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  {t.selectCollection}
                </ThemedText>
              </Pressable>
            )}

            {/* Tab Body */}
            {activeTab === 'moderation' ? (
              <ModerationDashboard />
            ) : tabArtworks.length > 0 ? (
              tabArtworks.map((art) => (
                <Pressable
                  key={art.id}
                  style={[
                    styles.artworkRow,
                    { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
                  ]}
                  onPress={() => setSelectedArtwork(art)}
                >
                  {art.preview ? (
                    <Image
                      source={{ uri: art.preview }}
                      style={{ width: 36, height: 36, borderRadius: 6 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <ThemedText type="code" style={{ fontSize: 10 }}>D'Art</ThemedText>
                  )}
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">{art.title}</ThemedText>
                    <ThemedText type="code" themeColor="textSecondary">
                      da @{art.artist} • {art.locationName}
                    </ThemedText>
                  </View>
                  {art.isExpired ? (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                      <ThemedText type="code" style={{ color: '#EF4444', fontSize: 10, fontWeight: '800' }}>
                        Scaduto
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                      <ThemedText type="code" style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>
                        Attivo
                      </ThemedText>
                    </View>
                  )}
                  <SymbolView name="chevron.right" size={16} tintColor={theme.textSecondary} />
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <ThemedText type="small" themeColor="textSecondary">
                  {activeTab === 'album'
                    ? "Nessun D'ArtWork visitato. Scendi in strada a Trento!"
                    : activeTab === 'collection'
                    ? 'Nessuna opera in collezione. Seleziona fino a 3 opere dal tuo album.'
                    : 'Nessuna opera pubblicata. Usa il bottone sopra per iniziare!'}
                </ThemedText>
              </View>
            )}
          </View>
        ) : (
          <AuthForm />
        )}
      </View>

      {/* Modals */}
      <ArtworkModal artwork={selectedArtwork} onClose={() => setSelectedArtwork(null)} />
      <CollectionCuratorModal
        visible={isCollectionPickerOpen}
        onClose={() => setIsCollectionPickerOpen(false)}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1.5,
    marginBottom: Spacing.three,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backBtn: {
    padding: Spacing.one,
    marginRight: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
      default: {},
    }),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioBox: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
  },
  bioDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioInput: {
    fontSize: 13,
    minHeight: 45,
  },
  bioActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  bioBtnSave: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bioBtnCancel: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
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
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  badgeChip: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  publishBtn: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' },
      default: {},
    }),
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  tab: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingVertical: Spacing.one + 2,
    alignItems: 'center',
  },
  curateBtn: {
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  artworkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: Spacing.one + 2,
    padding: Spacing.two,
    marginBottom: Spacing.one,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
      default: {},
    }),
  },
  emptyBox: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
