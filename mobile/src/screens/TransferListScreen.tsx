import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, ActivityIndicator,
  StyleSheet, SafeAreaView, Alert, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { buyListing, getTransferListings } from '../api/transferListings';
import { getTeam } from '../api/team';
import TransferOfferCard from '../components/TransferOfferCard';
import { TransferListing } from '../types';
import { TransferStackParamList } from '../navigation/AppNavigator';

export default function TransferListScreen() {
  const navigation = useNavigation<StackNavigationProp<TransferStackParamList>>();
  const [listings, setListings]       = useState<TransferListing[]>([]);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [playerName, setPlayerName]   = useState('');
  const [ownTeamId, setOwnTeamId]     = useState<number | undefined>(undefined);
  const searchRef = useRef(playerName);
  searchRef.current = playerName;

  const load = useCallback(async (reset = true) => {
    const currentSearch = searchRef.current;
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    try {
      const nextPage = reset ? 1 : page + 1;
      const result = await getTransferListings({
        player_name: currentSearch || undefined,
        page: nextPage,
      });
      setListings(prev => reset ? result.data : [...prev, ...result.data]);
      setPage(nextPage);
      setTotalPages(result.meta.total_pages);
    } catch {
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  useFocusEffect(
    useCallback(() => {
      load(true);
      getTeam().then(t => setOwnTeamId(t.id)).catch(() => {});
    }, [playerName])
  );

  const handleEndReached = () => {
    if (!loadingMore && page < totalPages) {
      load(false);
    }
  };

  const handleSearch = (text: string) => {
    setPlayerName(text);
  };

  const handleBuy = (listing: TransferListing) => {
    const price = (parseFloat(listing.asking_price) / 1_000_000).toFixed(1);
    Alert.alert(
      'Confirm Purchase',
      `Buy ${listing.player.first_name} ${listing.player.last_name} for $${price}M?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          style: 'destructive',
          onPress: async () => {
            try {
              await buyListing(listing.id);
              load(true);
            } catch (e: any) {
              const status = e?.response?.status;
              const msg =
                status === 409 ? 'This player was just sold to someone else.' :
                status === 422 ? 'Insufficient budget.' :
                status === 403 ? 'Cannot buy your own player.' :
                'Purchase failed. Please try again.';
              Alert.alert('Purchase Failed', msg);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by player name..."
        placeholderTextColor="#999"
        value={playerName}
        onChangeText={handleSearch}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TransferOfferCard listing={item} ownTeamId={ownTeamId} onBuy={handleBuy} />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>No listings found</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.footer} color="#1a73e8" /> : null
          }
          contentContainerStyle={listings.length === 0 ? styles.flatEmpty : undefined}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SelectPlayer')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
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
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  flatEmpty: { flexGrow: 1 },
  errorText: { color: '#c00', fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  empty:     { color: '#999', fontSize: 15 },
  footer:    { paddingVertical: 16 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
