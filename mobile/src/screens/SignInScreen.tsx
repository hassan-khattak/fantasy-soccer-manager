import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
  if (!password) return 'Password is required.';
  return null;
}

export default function SignInScreen() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async () => {
    const validationError = validate(email.trim(), password);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const isNetwork = err && typeof err === 'object' && 'code' in err &&
        (err as { code: string }).code === 'ECONNABORTED';
      setError(isNetwork
        ? 'Cannot reach the server. Check your connection and try again.'
        : 'Incorrect email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Sign In</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={[styles.input, error && !EMAIL_REGEX.test(email) ? styles.inputError : null]}
        placeholder="Email address"
        value={email}
        onChangeText={(v) => { setEmail(v); setError(null); }}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        textContentType="emailAddress"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={(v) => { setPassword(v); setError(null); }}
        secureTextEntry
        textContentType="password"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  inputError: { borderColor: '#dc2626' },
  button: {
    padding: 16,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#dc2626', marginBottom: 12, fontSize: 14 },
});
