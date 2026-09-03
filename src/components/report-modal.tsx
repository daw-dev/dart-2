import React, { useState } from 'react';
import { StyleSheet, Modal, View, Pressable, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SymbolView } from '@/components/symbol-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { translations } from '@/constants/translations';
import { useTheme } from '@/hooks/use-theme';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'artwork' | 'comment';
  onReportSuccess?: (msg: string) => void;
}

export function ReportModal({
  visible,
  onClose,
  targetId,
  targetType,
  onReportSuccess,
}: ReportModalProps) {
  const { reportContent, language, currentUser } = useAuth();
  const t = translations[language];
  const theme = useTheme();

  const [category, setCategory] = useState<'offensive' | 'copyright' | 'spam' | 'danger'>('offensive');
  const [reason, setReason] = useState('');

  const categories: Array<{ key: 'offensive' | 'copyright' | 'spam' | 'danger'; label: string }> = [
    { key: 'offensive', label: t.categoryOffensive },
    { key: 'copyright', label: t.categoryCopyright },
    { key: 'spam', label: t.categorySpam },
    { key: 'danger', label: t.categoryDanger },
  ];

  const handleSubmit = () => {
    if (!currentUser) {
      onReportSuccess?.('Accedi per inviare una segnalazione.');
      onClose();
      return;
    }
    const res = reportContent(targetId, targetType, category, reason);
    onReportSuccess?.(res.message);
    setReason('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={{ fontWeight: '900' }}>
              {t.reportModalTitle}
            </ThemedText>
            <Pressable onPress={onClose}>
              <SymbolView name="xmark" size={20} tintColor={theme.text} />
            </Pressable>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
            {targetType === 'artwork' ? "D'ArtWork" : 'Commento'} (ID: {targetId})
          </ThemedText>

          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryChip,
                  { backgroundColor: theme.tagBg, borderColor: theme.cardBorderSubtle },
                  category === cat.key && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: category === cat.key ? '#FFFFFF' : theme.text }}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder={t.reportReasonPlaceholder}
            placeholderTextColor={theme.placeholder}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />

          <View style={styles.footer}>
            <Pressable
              style={[styles.cancelBtn, { borderColor: theme.cardBorderSubtle }]}
              onPress={onClose}
            >
              <ThemedText type="smallBold">Annulla</ThemedText>
            </Pressable>
            <Pressable style={[styles.submitBtn, { backgroundColor: '#EF4444' }]} onPress={handleSubmit}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                {t.sendReportBtn}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
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
    maxWidth: 420,
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  categoryGrid: {
    flexDirection: 'column',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  categoryChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderWidth: 1,
    borderRadius: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.one,
  },
  submitBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
  },
});
