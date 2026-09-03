import React from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SymbolView } from '@/components/symbol-view';
import { Spacing } from '@/constants/theme';
import { Notification } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

interface NotificationsModalProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
}

export function NotificationsModal({ visible, notifications, onClose }: NotificationsModalProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <ThemedText type="smallBold">Notifiche Recenti</ThemedText>
        <Pressable onPress={onClose}>
          <SymbolView name="xmark" size={14} tintColor={theme.text} />
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 240 }}>
        {notifications.map((n) => (
          <View
            key={n.id}
            style={[
              styles.item,
              { borderBottomColor: theme.divider },
              !n.read && { backgroundColor: theme.isDark ? '#261F38' : '#F5F3FF' },
            ]}
          >
            <ThemedText type="smallBold" style={styles.itemTitle}>
              {n.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.itemDesc}>
              {n.description}
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary" style={styles.itemTime}>
              {n.createdAt}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 80,
    right: Spacing.three,
    width: 300,
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: Spacing.one,
    marginBottom: Spacing.one,
  },
  item: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
    borderBottomWidth: 1,
    borderRadius: 4,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 12,
  },
  itemDesc: {
    fontSize: 11,
  },
  itemTime: {
    fontSize: 8,
    alignSelf: 'flex-end',
  },
});
