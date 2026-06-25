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
const MIN_PASSWORD_LENGTH = 6;

function validate(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
  if (!password) return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

function extractApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err &&
      (err as { code: string }).code === 'ECONNABORTED') {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { errors?: string[] | Record<string, string[]> } } }).response?.data;
    if (data?.errors) {
      if (Array.isArray(data.errors)) return data.errors[0] ?? 'Registration failed.';
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey) return `${firstKey} ${(data.errors as Record<string, string[]>)[firstKey][0]}`;
    }
  }
  return 'Registration failed. Please try again.';
}

export default function RegisterScreen() {
  const { register } = useAuth();
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
      await register(email.trim(), password);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Register</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
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
        placeholder={`Password (min ${MIN_PASSWORD_LENGTH} characters)`}
        value={password}
        onChangeText={(v) => { setPassword(v); setError(null); }}
        secureTextEntry
        textContentType="newPassword"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
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
