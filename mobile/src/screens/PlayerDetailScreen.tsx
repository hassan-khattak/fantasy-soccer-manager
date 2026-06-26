import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { getPlayer } from '../api/players';
import { PlayerDetail, POSITION_LABELS } from '../types';
import { TeamStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: StackNavigationProp<TeamStackParamList, 'PlayerDetail'>;
  route: RouteProp<TeamStackParamList, 'PlayerDetail'>;
};

export default function PlayerDetailScreen({ route }: Props) {
  const { playerId } = route.params;
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayer(playerId);
      setPlayer(data);
    } catch {
      setError('Failed to load player. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const marketValue = (parseFloat(player.market_value) / 1_000_000).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Name + position */}
        <View style={styles.hero}>
          <Text style={styles.name}>{player.first_name} {player.last_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{POSITION_LABELS[player.position]}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Row label="Country"      value={player.country} />
          <Row label="Market Value" value={`$${marketValue}M`} />
          <Row label="Age"          value={`${player.age} years — ${player.birth_date}`} />
          <Row label="Goals"        value={player.goals != null ? String(player.goals) : '—'} />
        </View>

        {/* Transfer history */}
        <Text style={styles.sectionTitle}>Transfer History</Text>
        {player.transfers.length === 0 ? (
          <Text style={styles.empty}>No transfers yet</Text>
        ) : (
          player.transfers.map(t => (
            <View key={t.id} style={styles.transferCard}>
              <Text style={styles.transferTeams}>
                {t.from_team.name} → {t.to_team.name}
              </Text>
              <Text style={styles.transferMeta}>
                ${(parseFloat(t.price) / 1_000_000).toFixed(1)}M · {t.created_at.slice(0, 10)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f4f6f9' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:      { padding: 20, paddingBottom: 40 },
  hero:         { alignItems: 'center', marginBottom: 20 },
  name:         { fontSize: 24, fontWeight: '800', color: '#111', textAlign: 'center' },
  badge: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel:     { fontSize: 14, color: '#666' },
  rowValue:     { fontSize: 14, fontWeight: '600', color: '#111' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  empty:        { color: '#999', textAlign: 'center', fontSize: 14, marginTop: 8 },
  transferCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  transferTeams: { fontSize: 14, fontWeight: '600', color: '#111' },
  transferMeta:  { fontSize: 13, color: '#666', marginTop: 4 },
  errorText:    { color: '#c00', fontSize: 15, marginBottom: 16, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:     { backgroundColor: '#1a73e8', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText:    { color: '#fff', fontWeight: '700' },
});
