import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, ActivityIndicator,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransferListings } from '../api/transferListings';
import TransferOfferCard from '../components/TransferOfferCard';
import { TransferListing } from '../types';

export default function TransferListScreen() {
  const [listings, setListings]       = useState<TransferListing[]>([]);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [playerName, setPlayerName]   = useState('');
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
          renderItem={({ item }) => <TransferOfferCard listing={item} />}
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
});
