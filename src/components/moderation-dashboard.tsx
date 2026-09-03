import React from 'react';
import { StyleSheet, View, Pressable, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SymbolView } from '@/components/symbol-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { translations } from '@/constants/translations';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

export function ModerationDashboard() {
  const { reports, dArtWorks, dismissReports, removeReportedContent, language } = useAuth();
  const t = translations[language];
  const theme = useTheme();

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'offensive':
        return t.categoryOffensive || 'Contenuto offensivo o ingiurioso';
      case 'copyright':
        return t.categoryCopyright || 'Violazione di copyright / Diritti';
      case 'spam':
        return t.categorySpam || 'Spam o pubblicità non autorizzata';
      case 'danger':
        return t.categoryDanger || 'Pericolo reale o luogo inaccessibile';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' };
      case 'offensive':
        return { bg: 'rgba(249, 115, 22, 0.15)', text: '#F97316', border: '#F97316' };
      case 'copyright':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7', border: '#A855F7' };
      case 'spam':
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308', border: '#EAB308' };
      default:
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' };
    }
  };

  if (reports.length === 0) {
    return (
      <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
        <SymbolView name="checkmark.shield.fill" size={36} tintColor="#10B981" />
        <ThemedText type="subtitle" style={{ marginTop: Spacing.two, color: '#10B981', fontWeight: '900' }}>
          Tutto in ordine
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 4, maxWidth: 360, lineHeight: 18 }}>
          {t.noReports}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SymbolView name="shield.lefthalf.filled" size={20} tintColor="#EF4444" />
          <ThemedText type="smallBold" style={{ fontWeight: '900', fontSize: 16 }}>
            {t.reportedItems} ({reports.length})
          </ThemedText>
        </View>
        <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 11 }}>
          Pannello Comune di Trento
        </ThemedText>
      </View>

      {reports.map((rep) => {
        let targetArtwork = null;
        let targetComment = null;
        let parentArtwork = null;

        if (rep.targetType === 'artwork') {
          targetArtwork = dArtWorks.find((a) => a.id === rep.targetId);
        } else {
          for (const a of dArtWorks) {
            const found = a.comments.find((c) => c.id === rep.targetId);
            if (found) {
              targetComment = found;
              parentArtwork = a;
              break;
            }
          }
        }

        const mapTargetArtworkId = targetArtwork ? targetArtwork.id : parentArtwork ? parentArtwork.id : null;
        const catStyle = getCategoryColor(rep.category);

        const formattedDate = rep.createdAt && !isNaN(Date.parse(rep.createdAt))
          ? new Date(rep.createdAt).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : rep.createdAt || 'Di recente';

        return (
          <View
            key={rep.id}
            style={[
              styles.reportCard,
              {
                backgroundColor: theme.isDark ? '#1C161E' : '#FFF9F9',
                borderColor: theme.isDark ? '#5C2229' : '#FECACA',
              },
            ]}
          >
            {/* Report Header: Category Badge & Date */}
            <View style={[styles.header, { borderBottomColor: theme.isDark ? '#3E1C22' : '#FEE2E2' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: catStyle.bg, borderColor: catStyle.border },
                  ]}
                >
                  <ThemedText type="code" style={[styles.categoryBadgeText, { color: catStyle.text }]}>
                    {getCategoryLabel(rep.category)}
                  </ThemedText>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: theme.tagBg, borderColor: theme.cardBorderSubtle }]}>
                  <ThemedText type="code" style={{ fontSize: 10, fontWeight: '700' }}>
                    {rep.targetType === 'artwork' ? "D'ARTWORK" : 'COMMENTO'}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>
                {formattedDate}
              </ThemedText>
            </View>

            {/* Target Content Detailed Overview */}
            <View style={[styles.contentBox, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
              {targetArtwork ? (
                <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' }}>
                  {targetArtwork.preview ? (
                    <Image
                      source={{ uri: targetArtwork.preview }}
                      style={[styles.artworkThumb, { borderColor: theme.cardBorderSubtle }]}
                      resizeMode="cover"
                    />
                  ) : null}
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="subtitle" style={{ fontSize: 15, fontWeight: '900' }}>
                      {targetArtwork.title}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <ThemedText type="small" themeColor="textSecondary">di</ThemedText>
                      <Pressable onPress={() => router.push(`/user/${targetArtwork.artist}`)}>
                        <ThemedText type="smallBold" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                          @{targetArtwork.artist}
                        </ThemedText>
                      </Pressable>
                      <ThemedText type="small" themeColor="textSecondary">
                        • 📍 {targetArtwork.locationName}
                      </ThemedText>
                    </View>
                    {targetArtwork.description ? (
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={{ fontSize: 11, marginTop: 2 }}>
                        {targetArtwork.description}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              ) : targetComment ? (
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ThemedText type="small" themeColor="textSecondary">Commento di</ThemedText>
                    <Pressable onPress={() => router.push(`/user/${targetComment.username}`)}>
                      <ThemedText type="smallBold" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                        @{targetComment.username}
                      </ThemedText>
                    </Pressable>
                  </View>
                  <View style={[styles.commentQuoteBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]}>
                    <ThemedText type="small" style={{ fontStyle: 'italic' }}>
                      "{targetComment.text}"
                    </ThemedText>
                  </View>
                  {parentArtwork ? (
                    <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 2 }}>
                      Pubblicato sull'opera: "{parentArtwork.title}" di @{parentArtwork.artist} (📍 {parentArtwork.locationName})
                    </ThemedText>
                  ) : null}
                </View>
              ) : (
                <View style={{ gap: 2 }}>
                  <ThemedText type="code" themeColor="textSecondary" style={{ fontStyle: 'italic', fontSize: 11 }}>
                    ID target ({rep.targetType}): {rep.targetId}
                  </ThemedText>
                  <ThemedText type="code" style={{ color: '#EF4444', fontSize: 10 }}>
                    (Il contenuto non è più reperibile o è già stato rimosso)
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Motivation Section */}
            <View style={[styles.reasonBox, { backgroundColor: theme.isDark ? '#2E151B' : '#FEF2F2', borderColor: theme.isDark ? '#5C2229' : '#FECACA' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <SymbolView name="exclamationmark.bubble.fill" size={13} tintColor="#EF4444" />
                <ThemedText type="code" style={{ color: '#DC2626', fontWeight: '800', fontSize: 10.5 }}>
                  MOTIVAZIONE SEGNALATORE (@{rep.reporterUsername}):
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ marginTop: 2, fontStyle: rep.reason ? 'normal' : 'italic', color: theme.text }}>
                {rep.reason ? `"${rep.reason}"` : 'Nessuna spiegazione testuale aggiuntiva fornita dal segnalatore.'}
              </ThemedText>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {mapTargetArtworkId ? (
                <Pressable
                  style={[styles.mapBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => router.push({ pathname: '/', params: { selectArtId: mapTargetArtworkId } })}
                >
                  <SymbolView name="map.fill" size={15} tintColor="#FFFFFF" />
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 12 }}>
                    VISUALIZZA SULLA MAPPA
                  </ThemedText>
                </Pressable>
              ) : null}

              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.btn, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9', borderColor: theme.cardBorderSubtle }]}
                  onPress={() => dismissReports(rep.targetId)}
                >
                  <ThemedText type="code" style={{ fontWeight: '700' }}>
                    {t.dismissReportsBtn}
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.btn, { backgroundColor: '#EF4444', borderColor: '#DC2626' }]}
                  onPress={() => removeReportedContent(rep.targetId, rep.targetType)}
                >
                  <ThemedText type="code" style={{ color: '#FFFFFF', fontWeight: '800' }}>
                    {t.removeContentBtn}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  emptyBox: {
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    marginVertical: Spacing.two,
  },
  reportCard: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: Spacing.one,
    gap: Spacing.one,
  },
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  contentBox: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
  },
  artworkThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
  },
  commentQuoteBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    marginTop: 2,
  },
  reasonBox: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
  },
  actionsContainer: {
    gap: Spacing.one,
    marginTop: 2,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingVertical: Spacing.one + 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
