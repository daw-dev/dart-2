import React, { useState } from 'react';
import { StyleSheet, Modal, View, ScrollView, Pressable, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SymbolView } from '@/components/symbol-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { translations } from '@/constants/translations';
import { useTheme } from '@/hooks/use-theme';

interface CollectionCuratorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CollectionCuratorModal({ visible, onClose }: CollectionCuratorModalProps) {
  const { currentUser, dArtWorks, setCollection, language } = useAuth();
  const t = translations[language];
  const theme = useTheme();

  const [selectedIds, setSelectedIds] = useState<string[]>(currentUser?.collection || []);

  if (!currentUser) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 3) {
        alert('Puoi selezionare al massimo 3 D\'ArtWork.');
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleSave = () => {
    setCollection(selectedIds);
    onClose();
  };

  // Get visited artworks
  const visitedArts = dArtWorks.filter((art) => currentUser?.album?.includes(art.id));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <View>
              <ThemedText type="subtitle" style={{ fontWeight: '900' }}>
                {t.selectCollection}
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                {selectedIds.length}/3 selezionati
              </ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <SymbolView name="xmark" size={20} tintColor={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {visitedArts.length > 0 ? (
              visitedArts.map((art) => {
                const isSelected = selectedIds.includes(art.id);
                return (
                  <Pressable
                    key={art.id}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: isSelected ? (theme.isDark ? '#3B2456' : '#EDE9FE') : theme.surfaceSubtle,
                        borderColor: isSelected ? theme.primary : theme.cardBorderSubtle,
                      },
                    ]}
                    onPress={() => toggleSelect(art.id)}
                  >
                    {art.preview ? (
                      <Image source={{ uri: art.preview }} style={{ width: 28, height: 28, borderRadius: 4 }} resizeMode="cover" />
                    ) : (
                      <ThemedText type="code" style={{ fontSize: 10 }}>D'Art</ThemedText>
                    )}
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{art.title}</ThemedText>
                      <ThemedText type="code" themeColor="textSecondary">
                        {art.locationName}
                      </ThemedText>
                    </View>
                    <SymbolView
                      name={isSelected ? "checkmark.circle.fill" : "circle"}
                      size={18}
                      tintColor={isSelected ? theme.primary : theme.textSecondary}
                    />
                  </Pressable>
                );
              })
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                Non hai ancora visitato nessun'opera. Esplora la mappa per aggiungerne al tuo album!
              </ThemedText>
            )}
          </ScrollView>

          <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
            <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
              {t.saveBtn}
            </ThemedText>
          </Pressable>
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
    maxWidth: 500,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    maxHeight: '80%',
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
  },
  closeBtn: {
    padding: Spacing.one,
  },
  scroll: {
    marginBottom: Spacing.two,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    marginBottom: Spacing.one,
  },
  saveBtn: {
    borderRadius: Spacing.one,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
});
