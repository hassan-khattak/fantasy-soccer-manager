import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { createListing } from '../api/transferListings';
import { POSITION_LABELS } from '../types';
import { CreateTransferOfferParams } from '../navigation/AppNavigator';

export default function CreateTransferOfferScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ CreateTransferOffer: CreateTransferOfferParams }, 'CreateTransferOffer'>>();
  const { playerId, playerName, marketValue, country, position, age, birthDate } = route.params;

  const [askingPrice, setAskingPrice] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const marketValueM = (parseFloat(marketValue) / 1_000_000).toFixed(2);

  const handleSubmit = async () => {
    const priceNum = parseFloat(askingPrice);
    if (!askingPrice || isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid asking price.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createListing(playerId, String(priceNum * 1_000_000));
      navigation.popToTop();
      navigation.navigate('Transfer List' as any);
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
          {/* Player details card */}
          <View style={styles.playerCard}>
            <Text style={styles.playerName}>{playerName}</Text>
            <Text style={styles.playerDetail}>{country}</Text>
            <Text style={styles.playerDetail}>
              {POSITION_LABELS[position as keyof typeof POSITION_LABELS] ?? position}
              {'  ·  '}Age: {age}
            </Text>
            <Text style={styles.playerDetail}>Born: {birthDate}</Text>
          </View>

          {/* Market value (read-only) */}
          <Text style={styles.label}>Market Value</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyValue}>${marketValueM}M</Text>
          </View>

          {/* Sell price */}
          <Text style={styles.label}>Sell Price ($M)</Text>
          <View style={styles.priceRow}>
            <Text style={styles.pricePrefix}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={askingPrice}
              onChangeText={setAskingPrice}
              placeholder="e.g. 2.5"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={styles.priceSuffix}>M</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Offer</Text>
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

  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e8edf3',
  },
  playerName:   { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 6 },
  playerDetail: { fontSize: 14, color: '#555', marginTop: 2 },

  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  readonlyField: {
    backgroundColor: '#eef2f8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dde3ec',
  },
  readonlyValue: { fontSize: 18, fontWeight: '700', color: '#444' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  pricePrefix: { paddingLeft: 14, fontSize: 16, color: '#666' },
  priceSuffix: { paddingRight: 14, fontSize: 16, fontWeight: '600', color: '#1a73e8' },
  priceInput:  { flex: 1, paddingHorizontal: 8, paddingVertical: 13, fontSize: 18, color: '#111' },

  error:       { color: '#c00', fontSize: 14, marginBottom: 12 },
  btn:         { backgroundColor: '#1a73e8', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
