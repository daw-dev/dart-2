import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Image,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SymbolView } from '@/components/symbol-view';
import { Spacing } from '@/constants/theme';
import { useAuth, DArtWork } from '@/context/auth-context';
import { translations } from '@/constants/translations';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

interface ArtworkModalProps {
  artwork: DArtWork | null;
  onClose: () => void;
  onOpenReport?: (id: string) => void;
  onOpenAr?: (art: DArtWork) => void;
}

export function ArtworkModal({
  artwork,
  onClose,
  onOpenReport,
  onOpenAr,
}: ArtworkModalProps) {
  const { currentUser, language, likeDArtWork, commentDArtWork, toggleFavoriteCollection } = useAuth();
  const t = translations[language];
  const theme = useTheme();
  const [commentText, setCommentText] = useState('');

  const [isRevealed, setIsRevealed] = useState(false);

  if (!artwork) return null;

  const isLiked = currentUser ? artwork.likedByUsernames.includes(currentUser.username) : false;
  const isFavorited = currentUser ? currentUser.collection.includes(artwork.id) : false;

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    commentDArtWork(artwork.id, commentText.trim());
    setCommentText('');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Guarda "${artwork.title}" di @${artwork.artist} su D'Art! Posizione: ${artwork.locationName}`,
      });
    } catch {}
  };

  return (
    <Modal visible={!!artwork} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle" style={styles.title}>
                {artwork.title}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <ThemedText type="small" themeColor="textSecondary">da</ThemedText>
                <Pressable
                  onPress={() => {
                    onClose();
                    router.push(`/user/${artwork.artist}`);
                  }}
                >
                  <ThemedText type="smallBold" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                    @{artwork.artist}
                  </ThemedText>
                </Pressable>
                <ThemedText type="small" themeColor="textSecondary">
                  • {artwork.locationName}
                </ThemedText>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <SymbolView name="xmark" size={20} tintColor={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Sensitive Content Warning or Image Banner */}
            {artwork.isSensitive && !isRevealed ? (
              <View style={[styles.sensitiveBox, { backgroundColor: theme.isDark ? '#3B1219' : '#FFE3E3', borderColor: '#FF6B6B' }]}>
                <ThemedText type="smallBold" style={{ color: '#FF6B6B', textAlign: 'center' }}>
                  Contenuto Contrassegnato come Sensibile
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 11, marginVertical: 4 }}>
                  Quest'opera contiene elementi psichedelici, intensi o provocatori.
                </ThemedText>
                <Pressable
                  style={[styles.revealBtn, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}
                  onPress={() => setIsRevealed(true)}
                >
                  <ThemedText type="smallBold">Mostra comunque l'opera</ThemedText>
                </Pressable>
              </View>
            ) : (
              artwork.preview && (
                <Image
                  source={{ uri: artwork.preview }}
                  style={styles.artworkBanner}
                  resizeMode="cover"
                />
              )
            )}

            {/* Description */}
            <ThemedText type="small" style={styles.desc}>
              {artwork.description}
            </ThemedText>

            {/* License & Tags & Expiration */}
            <View style={styles.tagRow}>
              {artwork.isSensitive && (
                <View style={[styles.licenseBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                  <ThemedText type="code" style={[styles.licenseText, { color: '#EF4444', fontWeight: '800' }]}>
                    Sensibile
                  </ThemedText>
                </View>
              )}
              {artwork.isExpired ? (
                <View style={[styles.licenseBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
                  <ThemedText type="code" style={[styles.licenseText, { color: '#EF4444', fontWeight: '800' }]}>
                    Esposizione Conclusa
                  </ThemedText>
                </View>
              ) : artwork.expirationDate ? (
                <View style={[styles.licenseBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                  <ThemedText type="code" style={[styles.licenseText, { color: '#10B981', fontWeight: '700' }]}>
                    Fino al {new Date(artwork.expirationDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </ThemedText>
                </View>
              ) : null}
              {artwork.license && (
                <View style={[styles.licenseBadge, { backgroundColor: theme.licenseBg, borderColor: theme.cardBorderSubtle }]}>
                  <ThemedText type="code" style={[styles.licenseText, { color: theme.licenseText }]}>
                    {artwork.license}
                  </ThemedText>
                </View>
              )}
              {artwork.hashtags.map((tag) => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: theme.tagBg, borderColor: theme.cardBorderSubtle }]}>
                  <ThemedText type="code" style={[styles.tagText, { color: theme.tagText }]}>
                    #{tag}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Actions Bar */}
            <View style={[styles.actionsBar, { borderColor: theme.divider }]}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => currentUser && likeDArtWork(artwork.id)}
              >
                <SymbolView
                  name={isLiked ? 'heart.fill' : 'heart'}
                  size={18}
                  tintColor={isLiked ? '#FF4B4B' : theme.text}
                />
                <ThemedText type="smallBold">{artwork.likesCount}</ThemedText>
              </Pressable>

              <View style={styles.actionBtn}>
                <SymbolView name="bubble.left" size={18} tintColor={theme.text} />
                <ThemedText type="smallBold">{artwork.comments.length}</ThemedText>
              </View>

              <Pressable
                style={styles.actionBtn}
                onPress={() => currentUser && toggleFavoriteCollection(artwork.id)}
              >
                <SymbolView
                  name={isFavorited ? 'star.fill' : 'star'}
                  size={18}
                  tintColor={isFavorited ? '#D8B4F8' : theme.text}
                />
              </Pressable>

              <Pressable style={styles.actionBtn} onPress={handleShare}>
                <SymbolView name="square.and.arrow.up" size={18} tintColor={theme.text} />
              </Pressable>

              {onOpenReport && (
                <Pressable style={styles.actionBtn} onPress={() => onOpenReport(artwork.id)}>
                  <SymbolView name="flag" size={16} tintColor="#FF6B6B" />
                  <ThemedText type="smallBold" style={{ color: '#FF6B6B', fontSize: 11 }}>
                    {t.reportBtn}
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {/* CTA Button */}
            <Pressable
              style={[styles.mapBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                onClose();
                if (onOpenAr) {
                  onOpenAr(artwork);
                }
                router.push({ pathname: '/', params: { selectArtId: artwork.id } });
              }}
            >
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                VISUALIZZA SULLA MAPPA / IN AR
              </ThemedText>
            </Pressable>

            {/* Comments */}
            <View style={styles.commentsSection}>
              <ThemedText type="smallBold" style={{ marginBottom: Spacing.one }}>
                {t.commentsTitle} ({artwork.comments.length})
              </ThemedText>
              {artwork.comments.length > 0 ? (
                artwork.comments.map((c) => {
                  const isArtistOfArtwork =
                    c.username.toLowerCase() === artwork.artist.toLowerCase();
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
                })
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Nessun commento per questa opera.
                </ThemedText>
              )}
            </View>
          </ScrollView>

          {/* Comment Input */}
          {currentUser ? (
            <View style={[styles.inputRow, { borderTopColor: theme.divider }]}>
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder={t.writeCommentPlaceholder}
                placeholderTextColor={theme.placeholder}
                value={commentText}
                onChangeText={setCommentText}
              />
              <Pressable style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={handleSendComment}>
                <SymbolView name="paperplane.fill" size={16} tintColor="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.loginHint}>
              Accedi per commentare e mettere like.
            </ThemedText>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    maxHeight: '85%',
    padding: Spacing.three,
    ...Platform.select({
      web: { boxShadow: '0 10px 35px rgba(0,0,0,0.35)' },
      default: { elevation: 8 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
  },
  title: {
    fontWeight: '900',
    fontSize: 20,
  },
  closeBtn: {
    padding: Spacing.one,
  },
  scroll: {
    marginBottom: Spacing.two,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  tagRow: {
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
    fontWeight: '700',
  },
  tagChip: {
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.five,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  mapBtn: {
    borderRadius: Spacing.one,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  commentsSection: {
    marginTop: Spacing.one,
  },
  commentItem: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    marginBottom: Spacing.one,
  },
  artworkBanner: {
    width: '100%',
    height: 160,
    borderRadius: Spacing.one,
    marginBottom: Spacing.two,
  },
  artistBadge: {
    backgroundColor: '#FF6B6B',
    color: '#000',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    height: 38,
    fontSize: 13,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginHint: {
    textAlign: 'center',
    paddingTop: Spacing.two,
  },
  sensitiveBox: {
    borderWidth: 1.5,
    borderRadius: Spacing.one + 2,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  revealBtn: {
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    marginTop: Spacing.one,
  },
});
