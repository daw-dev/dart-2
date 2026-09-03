import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { SymbolView } from "@/components/symbol-view";
import { Spacing, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { translations } from "@/constants/translations";
import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";

export default function SettingsScreen() {
  const {
    currentUser,
    language,
    setLanguage,
    updateSettings,
    deleteAccount,
    logout,
  } = useAuth();
  const t = translations[language];
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/profile");
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/profile");
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Sei sicuro di voler eliminare definitivamente il tuo account D'Art?")) {
        deleteAccount();
        router.replace("/profile");
      }
    } else {
      Alert.alert(
        "Elimina Account",
        "Sei sicuro di voler eliminare definitivamente il tuo account D'Art? Tutti i tuoi dati andranno persi.",
        [
          { text: "Annulla", style: "cancel" },
          {
            text: "Elimina",
            style: "destructive",
            onPress: () => {
              deleteAccount();
              router.replace("/profile");
            },
          },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: safeAreaInsets.top + Spacing.two },
      ]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorderSubtle }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Torna indietro"
            hitSlop={12}
            style={styles.backBtn}
            onPress={handleBack}
          >
            <SymbolView name="arrow.left" size={24} tintColor={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {t.settingsTitle}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {currentUser ? (
          <View style={styles.sectionStack}>
            {/* Account Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
              ]}
            >
              <View style={styles.accountRow}>
                <View
                  style={[
                    styles.avatarBadge,
                    { backgroundColor: currentUser.profilePicColor || theme.primary },
                  ]}
                >
                  <ThemedText style={{ fontSize: 28 }}>
                    {currentUser.profilePicEmoji || "👤"}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                    @{currentUser.username}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary" numberOfLines={1}>
                    {currentUser.email}
                  </ThemedText>
                  {currentUser.isModerator && (
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: "#6366F1" + "20", borderColor: "#6366F1" },
                      ]}
                    >
                      <ThemedText type="code" style={{ color: "#6366F1", fontWeight: "800", fontSize: 10 }}>
                        Ruolo: Cattedra / Moderatore
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Language Section */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
              ]}
            >
              <ThemedText type="smallBold" style={styles.cardSectionTitle}>
                {t.languageSection}
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                Seleziona la lingua di visualizzazione per l'intera interfaccia.
              </ThemedText>
              <View style={styles.langRow}>
                <Pressable
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor:
                        language === "it" ? theme.primary : theme.surfaceSubtle,
                      borderColor: language === "it" ? theme.primary : theme.cardBorderSubtle,
                    },
                  ]}
                  onPress={() => setLanguage("it")}
                >
                  <ThemedText
                    type="smallBold"
                    style={{ color: language === "it" ? "#FFFFFF" : theme.text }}
                  >
                    {t.italian}
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor:
                        language === "en" ? theme.primary : theme.surfaceSubtle,
                      borderColor: language === "en" ? theme.primary : theme.cardBorderSubtle,
                    },
                  ]}
                  onPress={() => setLanguage("en")}
                >
                  <ThemedText
                    type="smallBold"
                    style={{ color: language === "en" ? "#FFFFFF" : theme.text }}
                  >
                    {t.english}
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Notifications Section */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
              ]}
            >
              <ThemedText type="smallBold" style={styles.cardSectionTitle}>
                {t.notificationsSection}
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                Personalizza quando ricevere avvisi push e notifiche nell'app.
              </ThemedText>

              <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
                <View style={{ flex: 1, paddingRight: Spacing.two }}>
                  <ThemedText type="smallBold">{t.notifyFollowed}</ThemedText>
                  <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 11 }}>
                    Ricevi un avviso quando un artista che segui pubblica un'opera.
                  </ThemedText>
                </View>
                <Switch
                  value={currentUser.settings?.notifyFollowedArtist}
                  onValueChange={(val) => updateSettings({ notifyFollowedArtist: val })}
                  trackColor={{ false: theme.cardBorderSubtle, true: theme.primary }}
                />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: theme.divider }]}>
                <View style={{ flex: 1, paddingRight: Spacing.two }}>
                  <ThemedText type="smallBold">{t.notifyNearby}</ThemedText>
                  <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 11 }}>
                    Avviso per nuovi D'ArtWork geolocalizzati vicino alla tua posizione.
                  </ThemedText>
                </View>
                <Switch
                  value={currentUser.settings?.notifyTrendingNearby}
                  onValueChange={(val) => updateSettings({ notifyTrendingNearby: val })}
                  trackColor={{ false: theme.cardBorderSubtle, true: theme.primary }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={{ flex: 1, paddingRight: Spacing.two }}>
                  <ThemedText type="smallBold">{t.notifyLikes}</ThemedText>
                  <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 11 }}>
                    Ricevi notifiche per nuovi Mi Piace e commenti sui tuoi D'ArtWork.
                  </ThemedText>
                </View>
                <Switch
                  value={currentUser.settings?.notifyLikes}
                  onValueChange={(val) => updateSettings({ notifyLikes: val })}
                  trackColor={{ false: theme.cardBorderSubtle, true: theme.primary }}
                />
              </View>
            </View>

            {/* Session & Danger Zone */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle },
              ]}
            >
              <ThemedText type="smallBold" style={styles.cardSectionTitle}>
                Sicurezza & Account
              </ThemedText>

              <Pressable
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle },
                ]}
                onPress={handleLogout}
              >
                <ThemedText type="smallBold" style={{ color: theme.text }}>
                  {t.logoutBtn}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.actionButton,
                  styles.deleteButton,
                  {
                    backgroundColor: theme.isDark ? "#3B1219" : "#FFF5F5",
                    borderColor: "#DC2626",
                  },
                ]}
                onPress={handleDeleteAccount}
              >
                <ThemedText type="smallBold" style={{ color: "#EF4444" }}>
                  {t.deleteAccountBtn}
                </ThemedText>
              </Pressable>
            </View>

            {/* App Info Footer */}
            <View style={styles.footer}>
              <ThemedText type="code" themeColor="textSecondary" style={{ textAlign: "center", fontSize: 11 }}>
                D'Art • Virtual Street Art in Augmented Reality
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary" style={{ textAlign: "center", fontSize: 10, marginTop: 2 }}>
                Corso di Ingegneria del Software • Università di Trento
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle, alignItems: "center" }]}>
            <ThemedText type="smallBold" style={{ marginVertical: Spacing.two }}>
              Accedi per configurare le tue preferenze.
            </ThemedText>
            <Pressable
              style={[styles.actionButton, { backgroundColor: theme.primary, width: "100%" }]}
              onPress={() => router.push("/profile")}
            >
              <ThemedText type="smallBold" style={{ color: "#FFFFFF", textAlign: "center" }}>
                Accedi / Registrati
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    paddingBottom: Spacing.six,
  },
  container: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.two,
    borderBottomWidth: 1.5,
  },
  backBtn: {
    padding: Spacing.one,
  },
  headerTitle: {
    fontWeight: "900",
    fontSize: 18,
  },
  sectionStack: {
    gap: Spacing.three,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
      default: { elevation: 2 },
    }),
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  avatarBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  langRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  langBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: Spacing.one,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  actionButton: {
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingVertical: Spacing.two,
    alignItems: "center",
    marginTop: Spacing.one,
  },
  deleteButton: {
    marginTop: Spacing.one,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
