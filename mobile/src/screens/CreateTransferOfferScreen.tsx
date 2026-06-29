import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { createListing } from '../api/transferListings';
import { TeamStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: StackNavigationProp<TeamStackParamList, 'CreateTransferOffer'>;
  route: RouteProp<TeamStackParamList, 'CreateTransferOffer'>;
};

export default function CreateTransferOfferScreen({ navigation, route }: Props) {
  const { playerId, playerName } = route.params;

  const [askingPrice, setAskingPrice] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!askingPrice || parseFloat(askingPrice) <= 0) {
      setError('Please enter a valid asking price.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createListing(playerId, askingPrice);
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.errors?.[0] ?? e?.response?.data?.error ?? 'Failed to list player. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.playerName}>{playerName}</Text>
          <Text style={styles.label}>Asking Price (USD)</Text>
          <TextInput
            style={styles.input}
            value={askingPrice}
            onChangeText={setAskingPrice}
            placeholder="e.g. 2000000"
            placeholderTextColor="#999"
            keyboardType="numeric"
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.btn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>List for Sale</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  content:   { padding: 24 },
  playerName: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 28 },
  label:     { fontSize: 14, color: '#666', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#111',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  error:     { color: '#c00', fontSize: 14, marginBottom: 12 },
  btn:       { backgroundColor: '#1a73e8', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});
