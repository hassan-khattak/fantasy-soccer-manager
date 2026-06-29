import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, ActivityIndicator,
  StyleSheet, SafeAreaView, Alert, TouchableOpacity,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { buyListing, getTransferListings } from '../api/transferListings';
import { getTeam } from '../api/team';
import TransferOfferCard from '../components/TransferOfferCard';
import { TransferListing, FilterState, DEFAULT_FILTERS, COUNTRIES } from '../types';
import { TransferStackParamList } from '../navigation/AppNavigator';

export default function TransferListScreen() {
  const navigation = useNavigation<StackNavigationProp<TransferStackParamList>>();

  const [listings, setListings]       = useState<TransferListing[]>([]);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [ownTeamId, setOwnTeamId]     = useState<number | undefined>(undefined);

  // Quick search (player name)
  const [playerName, setPlayerName]   = useState('');
  const searchRef = useRef(playerName);
  searchRef.current = playerName;

  // Advanced filters
  const [filters, setFilters]             = useState<FilterState>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters]   = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Nested country pickers inside the filter modal
  const [showTeamCountryPicker, setShowTeamCountryPicker]     = useState(false);
  const [showPlayerCountryPicker, setShowPlayerCountryPicker] = useState(false);
  const [teamCountrySearch, setTeamCountrySearch]             = useState('');
  const [playerCountrySearch, setPlayerCountrySearch]         = useState('');

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const load = useCallback(async (reset = true) => {
    const currentSearch  = searchRef.current;
    if (reset) { setLoading(true); setError(null); }
    else        { setLoadingMore(true); }
    try {
      const nextPage = reset ? 1 : page + 1;
      const result = await getTransferListings({
        player_name:    currentSearch || undefined,
        team_name:      filters.team_name      || undefined,
        min_price:      filters.min_price       || undefined,
        max_price:      filters.max_price       || undefined,
        team_country:   filters.team_country    || undefined,
        player_country: filters.player_country  || undefined,
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
  }, [page, filters]);

  useFocusEffect(
    useCallback(() => {
      load(true);
      getTeam().then(t => setOwnTeamId(t.id)).catch(() => {});
    }, [playerName, filters])
  );

  const handleEndReached = () => {
    if (!loadingMore && page < totalPages) load(false);
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

  const openFilterModal = () => {
    setDraftFilters(filters);
    setTeamCountrySearch('');
    setPlayerCountrySearch('');
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setShowFilterModal(false);
  };

  const filteredTeamCountries   = COUNTRIES.filter(c => c.toLowerCase().includes(teamCountrySearch.toLowerCase()));
  const filteredPlayerCountries = COUNTRIES.filter(c => c.toLowerCase().includes(playerCountrySearch.toLowerCase()));

  return (
    <SafeAreaView style={styles.container}>
      {/* Search row */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search by player name..."
          placeholderTextColor="#999"
          value={playerName}
          onChangeText={setPlayerName}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={openFilterModal}>
          <Text style={styles.filterIcon}>⚙</Text>
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1a73e8" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
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
            <View style={styles.center}><Text style={styles.empty}>No listings found</Text></View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.footer} color="#1a73e8" /> : null
          }
          contentContainerStyle={listings.length === 0 ? styles.flatEmpty : undefined}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SelectPlayer')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Filter modal */}
      <Modal visible={showFilterModal} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Team Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={draftFilters.team_name}
                onChangeText={v => setDraftFilters(f => ({ ...f, team_name: v }))}
                placeholder="e.g. Barcelona"
                placeholderTextColor="#999"
                clearButtonMode="while-editing"
              />

              <Text style={styles.fieldLabel}>Min Price ($)</Text>
              <TextInput
                style={styles.fieldInput}
                value={draftFilters.min_price}
                onChangeText={v => setDraftFilters(f => ({ ...f, min_price: v }))}
                placeholder="e.g. 1000000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                clearButtonMode="while-editing"
              />

              <Text style={styles.fieldLabel}>Max Price ($)</Text>
              <TextInput
                style={styles.fieldInput}
                value={draftFilters.max_price}
                onChangeText={v => setDraftFilters(f => ({ ...f, max_price: v }))}
                placeholder="e.g. 5000000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                clearButtonMode="while-editing"
              />

              <Text style={styles.fieldLabel}>Team Country</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => { setTeamCountrySearch(''); setShowTeamCountryPicker(true); }}
              >
                <Text style={draftFilters.team_country ? styles.pickerValue : styles.pickerPlaceholder}>
                  {draftFilters.team_country || 'Any country'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              {draftFilters.team_country !== '' && (
                <TouchableOpacity onPress={() => setDraftFilters(f => ({ ...f, team_country: '' }))}>
                  <Text style={styles.clearField}>Clear</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.fieldLabel}>Player Country</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => { setPlayerCountrySearch(''); setShowPlayerCountryPicker(true); }}
              >
                <Text style={draftFilters.player_country ? styles.pickerValue : styles.pickerPlaceholder}>
                  {draftFilters.player_country || 'Any country'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              {draftFilters.player_country !== '' && (
                <TouchableOpacity onPress={() => setDraftFilters(f => ({ ...f, player_country: '' }))}>
                  <Text style={styles.clearField}>Clear</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Team country picker */}
      <Modal visible={showTeamCountryPicker} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Team Country</Text>
            <TouchableOpacity onPress={() => setShowTeamCountryPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={teamCountrySearch}
            onChangeText={setTeamCountrySearch}
            autoFocus
          />
          <FlatList
            data={filteredTeamCountries}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => {
                  setDraftFilters(f => ({ ...f, team_country: item }));
                  setShowTeamCountryPicker(false);
                }}
              >
                <Text style={[styles.countryText, item === draftFilters.team_country && styles.countryTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Player country picker */}
      <Modal visible={showPlayerCountryPicker} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Player Country</Text>
            <TouchableOpacity onPress={() => setShowPlayerCountryPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={playerCountrySearch}
            onChangeText={setPlayerCountrySearch}
            autoFocus
          />
          <FlatList
            data={filteredPlayerCountries}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => {
                  setDraftFilters(f => ({ ...f, player_country: item }));
                  setShowPlayerCountryPicker(false);
                }}
              >
                <Text style={[styles.countryText, item === draftFilters.player_country && styles.countryTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, gap: 8 },
  search: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterBtn: { position: 'relative', padding: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  filterIcon: { fontSize: 18, color: '#1a73e8' },
  badge:      { position: 'absolute', top: -4, right: -4, backgroundColor: '#e53935', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText:  { color: '#fff', fontSize: 10, fontWeight: '700' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  flatEmpty:  { flexGrow: 1 },
  errorText:  { color: '#c00', fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  empty:      { color: '#999', fontSize: 15 },
  footer:     { paddingVertical: 16 },
  fab: { position: 'absolute', right: 24, bottom: 32, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },

  // Filter modal
  modal:        { flex: 1, backgroundColor: '#fff' },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#111' },
  modalClose:   { fontSize: 16, color: '#1a73e8' },
  modalBody:    { padding: 20, paddingBottom: 8 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: '#666', marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: {
    backgroundColor: '#f4f6f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerBtn:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f4f6f9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#ddd' },
  pickerValue:        { fontSize: 15, color: '#111' },
  pickerPlaceholder:  { fontSize: 15, color: '#999' },
  chevron:            { fontSize: 18, color: '#999' },
  clearField:         { fontSize: 13, color: '#1a73e8', marginTop: 6, textAlign: 'right' },
  modalActions: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  clearBtn:     { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  clearBtnText: { fontSize: 15, color: '#555', fontWeight: '600' },
  applyBtn:     { flex: 2, paddingVertical: 13, borderRadius: 10, backgroundColor: '#1a73e8', alignItems: 'center' },
  applyBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },

  // Country pickers
  modalSearch:  { margin: 12, backgroundColor: '#f4f6f9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111' },
  countryRow:   { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  countryText:  { fontSize: 16, color: '#111' },
  countryTextSelected: { color: '#1a73e8', fontWeight: '700' },
});
