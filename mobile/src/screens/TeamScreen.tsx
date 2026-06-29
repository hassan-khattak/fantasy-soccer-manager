import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { getTeam } from '../api/team';
import { Team, Player } from '../types';
import PlayerCard from '../components/PlayerCard';
import { TeamStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: StackNavigationProp<TeamStackParamList, 'TeamHome'>;
};

export default function TeamScreen({ navigation }: Props) {
  const { logout } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [budgetVisible, setBudgetVisible] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTeam();
      setTeam(data);
    } catch {
      setError('Failed to load team. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (error || !team) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filtered: Player[] = team.players.filter(p => {
    const q = search.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q)
    );
  });

  const teamValue = (parseFloat(team.team_value) / 1_000_000).toFixed(1);
  const budget    = (parseFloat(team.budget) / 1_000_000).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.country}>{team.country}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('TeamEditor', {
              teamName: team.name,
              teamCountry: team.country,
            })}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Team Value</Text>
            <Text style={styles.statValue}>${teamValue}M</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Budget</Text>
            <TouchableOpacity onPress={() => setBudgetVisible(v => !v)}>
              <Text style={styles.statValue}>
                {budgetVisible ? `$${budget}M` : '*****'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search */}
      <TextInput
        style={styles.search}
        placeholder="Search players..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      {/* Player list */}
      <FlatList
        data={filtered}
        keyExtractor={p => String(p.id)}
        renderItem={({ item }) => (
          <PlayerCard
            player={item}
            onPress={() => navigation.navigate('PlayerDetail', {
              playerId: item.id,
              isOwnPlayer: true,
            })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No players match your search.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#1a73e8',
    padding: 20,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  teamName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  country:  { fontSize: 14, color: '#c8dbfa', marginTop: 2 },
  editBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', marginLeft: 8, marginTop: 2 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 24 },
  stat:      {},
  statLabel: { fontSize: 12, color: '#c8dbfa' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  search: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  empty: { textAlign: 'center', color: '#999', marginTop: 32 },
  errorText: { color: '#c00', fontSize: 15, marginBottom: 16, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: { backgroundColor: '#1a73e8', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  signOutBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,80,80,0.6)', marginLeft: 8, marginTop: 2 },
  signOutText: { color: '#ffb3b3', fontSize: 13, fontWeight: '600' },
});
