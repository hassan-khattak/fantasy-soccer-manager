import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { getTeam } from '../api/team';
import PlayerCard from '../components/PlayerCard';
import { Player } from '../types';
import { TransferStackParamList } from '../navigation/AppNavigator';

export default function SelectPlayerScreen() {
  const navigation = useNavigation<StackNavigationProp<TransferStackParamList>>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          setLoading(true);
          const team = await getTeam();
          if (active) setPlayers(team.players.filter(p => !p.is_listed));
        } catch {
          if (active) setError('Failed to load players.');
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const filtered = players.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1a73e8" /></View>;
  if (error)   return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search players..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <PlayerCard
            player={item}
            onPress={() =>
              navigation.navigate('CreateTransferOffer', {
                playerId:   item.id,
                playerName: `${item.first_name} ${item.last_name}`,
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>No unlisted players</Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  search: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorText: { color: '#c00', fontSize: 15 },
  empty:     { color: '#999', fontSize: 15 },
});
