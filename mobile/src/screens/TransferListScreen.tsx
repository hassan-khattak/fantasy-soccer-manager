import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, ActivityIndicator,
  StyleSheet, SafeAreaView, Alert, TouchableOpacity,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { buyListing, getTransferListings } from '../api/transferListings';
import { getTeam } from '../api/team';
import TransferOfferCard from '../components/TransferOfferCard';
import { TransferListing, FilterState, DEFAULT_FILTERS, COUNTRIES } from '../types';
import { TransferStackParamList } from '../navigation/AppNavigator';

type PickerField = 'team_name' | 'team_country' | 'player_country';

const PICKER_TITLES: Record<PickerField, string> = {
  team_name:      'Team Name',
  team_country:   'Team Country',
  player_country: 'Player Country',
};

export default function TransferListScreen() {
  const navigation = useNavigation<StackNavigationProp<TransferStackParamList>>();

  const [listings, setListings]       = useState<TransferListing[]>([]);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [ownTeamId, setOwnTeamId]     = useState<number | undefined>(undefined);

  // Player name quick-search — ref keeps load() from going stale
  const [playerName, setPlayerName] = useState('');
  const searchRef = useRef('');

  // Filters — ref lets applyFilters call load() synchronously with new values
  const [filters, setFilters]           = useState<FilterState>(DEFAULT_FILTERS);
  const filtersRef                      = useRef<FilterState>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Page ref so load() doesn't close over stale page state
  const pageRef = useRef(1);

  // Team name picker options (accumulated from loaded listings)
  const [allTeamNames, setAllTeamNames] = useState<string[]>([]);

  // Single active picker inside the filter modal (no nested modals)
  const [activePicker, setActivePicker] = useState<PickerField | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Quick filter chips: null = all, 'own' = my listings, 'others' = exclude my team
  const [quickFilter, setQuickFilter] = useState<'own' | 'others' | null>(null);

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const displayedListings = ownTeamId !== undefined && quickFilter !== null
    ? listings.filter(l =>
        quickFilter === 'own' ? l.team.id === ownTeamId : l.team.id !== ownTeamId
      )
    : listings;

  // Stable load — reads all dynamic values from refs so no deps needed
  const load = useCallback(async (reset = true) => {
    const currentSearch  = searchRef.current;
    const currentFilters = filtersRef.current;
    const currentPage    = pageRef.current;

    if (reset) { setLoading(true); setError(null); }
    else        { setLoadingMore(true); }

    try {
      const nextPage = reset ? 1 : currentPage + 1;
      const result = await getTransferListings({
        player_name:    currentSearch                 || undefined,
        team_name:      currentFilters.team_name      || undefined,
        min_price:      currentFilters.min_price ? String(parseFloat(currentFilters.min_price) * 1_000_000) : undefined,
        max_price:      currentFilters.max_price ? String(parseFloat(currentFilters.max_price) * 1_000_000) : undefined,
        team_country:   currentFilters.team_country   || undefined,
        player_country: currentFilters.player_country || undefined,
        page: nextPage,
      });

      setListings(prev => reset ? result.data : [...prev, ...result.data]);
      pageRef.current = nextPage;
      setTotalPages(result.meta.total_pages);

      // Accumulate team names for the picker from loads without a team_name filter
      if (!currentFilters.team_name) {
        setAllTeamNames(prev => {
          const merged = new Set([...prev, ...result.data.map(l => l.team.name)]);
          return [...merged].sort();
        });
      }
    } catch {
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []); // no deps — reads dynamic values via refs

  useFocusEffect(
    useCallback(() => {
      load(true);
      getTeam().then(t => setOwnTeamId(t.id)).catch(() => {});
    }, [load]) // load is stable, fires only on screen focus
  );

  const handleEndReached = () => {
    if (!loadingMore && pageRef.current < totalPages) load(false);
  };

  const handlePlayerNameChange = (text: string) => {
    setPlayerName(text);
    searchRef.current = text;
    load(true);
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
    setActivePicker(null);
    setPickerSearch('');
    setShowFilterModal(true);
  };

  const openPicker = (field: PickerField) => {
    setPickerSearch('');
    setActivePicker(field);
  };

  const applyFilters = () => {
    const newFilters = draftFilters;
    filtersRef.current = newFilters;
    setFilters(newFilters);
    setShowFilterModal(false);
    load(true);
  };

  const clearFilters = () => {
    filtersRef.current = DEFAULT_FILTERS;
    setFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
    setShowFilterModal(false);
    load(true);
  };

  // Options for whichever picker is active
  const pickerOptions = (): string[] => {
    if (activePicker === 'team_name')      return allTeamNames;
    if (activePicker === 'team_country')   return COUNTRIES;
    if (activePicker === 'player_country') return COUNTRIES;
    return [];
  };

  const filteredPickerOptions = pickerOptions().filter(o =>
    o.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const pickerCurrentValue = activePicker ? draftFilters[activePicker] : '';

  const handlePickerSelect = (value: string) => {
    if (!activePicker) return;
    setDraftFilters(f => ({ ...f, [activePicker]: value }));
    setActivePicker(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search row */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search by player name..."
          placeholderTextColor="#999"
          value={playerName}
          onChangeText={handlePlayerNameChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={openFilterModal}>
          <Text style={styles.filterIcon}>▼</Text>
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick filter chips */}
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.chip, quickFilter === 'own' && styles.chipActive]}
          onPress={() => setQuickFilter(q => q === 'own' ? null : 'own')}
        >
          <Text style={[styles.chipText, quickFilter === 'own' && styles.chipTextActive]}>My Listings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, quickFilter === 'others' && styles.chipActive]}
          onPress={() => setQuickFilter(q => q === 'others' ? null : 'others')}
        >
          <Text style={[styles.chipText, quickFilter === 'others' && styles.chipTextActive]}>Other Teams</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1a73e8" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <FlatList
          data={displayedListings}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TransferOfferCard
              listing={item}
              ownTeamId={ownTeamId}
              onBuy={handleBuy}
              onPress={() => navigation.navigate('PlayerDetail', {
                playerId: item.player.id,
                isOwnPlayer: ownTeamId !== undefined && item.team.id === ownTeamId,
              })}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>
                {quickFilter === 'own' ? 'You have no active listings' : 'No listings found'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.footer} color="#1a73e8" /> : null
          }
          contentContainerStyle={displayedListings.length === 0 ? styles.flatEmpty : undefined}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SelectPlayer')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Single filter modal — pickers rendered inline, no nested modals */}
      <Modal visible={showFilterModal} animationType="slide">
        <SafeAreaView style={styles.modal}>
          {activePicker ? (
            /* ── Inline picker view ── */
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setActivePicker(null)}>
                  <Text style={styles.modalClose}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{PICKER_TITLES[activePicker]}</Text>
                <View style={{ width: 60 }} />
              </View>
              <TextInput
                style={styles.modalSearch}
                placeholder="Search..."
                placeholderTextColor="#999"
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoFocus
              />
              <FlatList
                data={filteredPickerOptions}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => handlePickerSelect(item)}
                  >
                    <Text style={[styles.optionText, item === pickerCurrentValue && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    {item === pickerCurrentValue && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={styles.empty}>
                      {activePicker === 'team_name' && allTeamNames.length === 0
                        ? 'No teams loaded yet'
                        : 'No results'}
                    </Text>
                  </View>
                }
                contentContainerStyle={filteredPickerOptions.length === 0 ? { flex: 1 } : undefined}
              />
            </>
          ) : (
            /* ── Filter form ── */
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Text style={styles.modalClose}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                {/* Team Name */}
                <Text style={styles.fieldLabel}>Team Name</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('team_name')}>
                  <Text style={draftFilters.team_name ? styles.pickerValue : styles.pickerPlaceholder}>
                    {draftFilters.team_name || 'Any team'}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                {draftFilters.team_name !== '' && (
                  <TouchableOpacity onPress={() => setDraftFilters(f => ({ ...f, team_name: '' }))}>
                    <Text style={styles.clearField}>Clear</Text>
                  </TouchableOpacity>
                )}

                {/* Min Price */}
                <Text style={styles.fieldLabel}>Min Price ($M)</Text>
                <View style={styles.priceInputRow}>
                  <Text style={styles.pricePrefix}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={draftFilters.min_price}
                    onChangeText={v => setDraftFilters(f => ({ ...f, min_price: v }))}
                    placeholder="e.g. 1.5"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    clearButtonMode="while-editing"
                  />
                  <Text style={styles.priceSuffix}>M</Text>
                </View>

                {/* Max Price */}
                <Text style={styles.fieldLabel}>Max Price ($M)</Text>
                <View style={styles.priceInputRow}>
                  <Text style={styles.pricePrefix}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={draftFilters.max_price}
                    onChangeText={v => setDraftFilters(f => ({ ...f, max_price: v }))}
                    placeholder="e.g. 5"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    clearButtonMode="while-editing"
                  />
                  <Text style={styles.priceSuffix}>M</Text>
                </View>

                {/* Team Country */}
                <Text style={styles.fieldLabel}>Team Country</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('team_country')}>
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

                {/* Player Country */}
                <Text style={styles.fieldLabel}>Player Country</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => openPicker('player_country')}>
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

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
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
  badge:     { position: 'absolute', top: -4, right: -4, backgroundColor: '#e53935', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  flatEmpty: { flexGrow: 1 },
  errorText: { color: '#c00', fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  empty:     { color: '#999', fontSize: 15 },
  footer:    { paddingVertical: 16 },
  chipsRow:      { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  chip:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  chipActive:    { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  chipText:      { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActive:{ fontSize: 13, fontWeight: '600', color: '#fff' },

  fab: { position: 'absolute', right: 24, bottom: 32, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },

  modal:       { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle:  { fontSize: 17, fontWeight: '700', color: '#111' },
  modalClose:  { fontSize: 16, color: '#1a73e8', width: 60 },
  modalBody:   { padding: 20, paddingBottom: 8 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f6f9', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  pricePrefix:   { paddingLeft: 14, fontSize: 15, color: '#666' },
  priceSuffix:   { paddingRight: 14, fontSize: 15, fontWeight: '600', color: '#1a73e8' },
  priceInput:    { flex: 1, paddingHorizontal: 8, paddingVertical: 11, fontSize: 15, color: '#111' },

  pickerBtn:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f4f6f9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#ddd' },
  pickerValue:       { fontSize: 15, color: '#111' },
  pickerPlaceholder: { fontSize: 15, color: '#999' },
  chevron:           { fontSize: 18, color: '#999' },
  clearField:        { fontSize: 13, color: '#1a73e8', marginTop: 6, textAlign: 'right' },

  modalActions: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  clearBtn:     { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  clearBtnText: { fontSize: 15, color: '#555', fontWeight: '600' },
  applyBtn:     { flex: 2, paddingVertical: 13, borderRadius: 10, backgroundColor: '#1a73e8', alignItems: 'center' },
  applyBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },

  modalSearch:       { margin: 12, backgroundColor: '#f4f6f9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111' },
  optionRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionText:        { fontSize: 16, color: '#111' },
  optionTextSelected:{ fontSize: 16, color: '#1a73e8', fontWeight: '700' },
  checkmark:         { fontSize: 16, color: '#1a73e8', fontWeight: '700' },
});
