import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export function AuthForm() {
  const { login, register, loginWithGoogle, loginAsUser } = useAuth();
  const theme = useTheme();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!username || !email || !password) {
      setError('Compila tutti i campi obbligatori.');
      return;
    }

    if (isRegister) {
      const ok = await register(username, email, bio, password);
      if (!ok) setError('Username o Email già in uso.');
    } else {
      const ok = login(username, email, password);
      if (!ok) setError('Credenziali non valide o utente inesistente.');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorderSubtle }]}>
      <ThemedText type="subtitle" style={styles.title}>
        {isRegister ? 'Crea Account' : 'Accedi a D\'Art'}
      </ThemedText>

      {error ? (
        <View style={styles.errorBox}>
          <ThemedText type="smallBold" style={{ color: '#EF4444' }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <ThemedText type="code" style={styles.label}>Username</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
        placeholder="davide_db"
        placeholderTextColor={theme.placeholder}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <ThemedText type="code" style={styles.label}>Email</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
        placeholder="nome@email.it"
        placeholderTextColor={theme.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {isRegister && (
        <>
          <ThemedText type="code" style={styles.label}>Biografia (max 350 car.)</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, minHeight: 50 }]}
            placeholder="Racconta qualcosa di te..."
            placeholderTextColor={theme.placeholder}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={350}
          />
        </>
      )}

      <ThemedText type="code" style={styles.label}>Password</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
        placeholder="••••••••"
        placeholderTextColor={theme.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={handleSubmit}>
        <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
          {isRegister ? 'REGISTRATI' : 'ACCEDI'}
        </ThemedText>
      </Pressable>

      <Pressable
        style={[styles.softengBtn, { backgroundColor: '#6366F1' + '1A', borderColor: '#6366F1' }]}
        onPress={() => loginAsUser('softeng')}
      >
        <ThemedText type="smallBold" style={{ color: '#6366F1' }}>
          Accedi come Docente (softeng)
        </ThemedText>
      </Pressable>

      <Pressable style={[styles.googleBtn, { backgroundColor: theme.surfaceSubtle, borderColor: theme.cardBorderSubtle }]} onPress={loginWithGoogle}>
        <ThemedText type="smallBold">
          Accedi rapido (Studente Davide)
        </ThemedText>
      </Pressable>

      <Pressable style={styles.toggleBtn} onPress={() => setIsRegister((p) => !p)}>
        <ThemedText type="small" themeColor="textSecondary">
          {isRegister
            ? 'Hai già un account? Accedi'
            : 'Non hai un account? Registrati subito'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: Spacing.two,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontWeight: '900',
    marginBottom: Spacing.one,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: Spacing.one,
    padding: Spacing.two,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    height: 42,
    fontSize: 14,
  },
  submitBtn: {
    borderRadius: Spacing.one,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  softengBtn: {
    borderWidth: 1.5,
    borderRadius: Spacing.one,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  googleBtn: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
