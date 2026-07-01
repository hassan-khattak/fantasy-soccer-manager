import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Modal, FlatList,
  ActivityIndicator, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { getPlayer, updatePlayer } from '../api/players';
import { deleteListing } from '../api/transferListings';
import { PlayerDetail, POSITION_LABELS, COUNTRIES } from '../types';
import { TeamStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: StackNavigationProp<TeamStackParamList, 'PlayerDetail'>;
  route: RouteProp<TeamStackParamList, 'PlayerDetail'>;
};

export default function PlayerDetailScreen({ navigation, route }: Props) {
  const { playerId, isOwnPlayer } = route.params;

  const [player, setPlayer]         = useState<PlayerDetail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [isEditing, setIsEditing]           = useState(false);
  const [editFirstName, setEditFirstName]   = useState('');
  const [editLastName, setEditLastName]     = useState('');
  const [editCountry, setEditCountry]       = useState('');
  const [countrySearch, setCountrySearch]   = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState<string | null>(null);
  const [removingListing, setRemovingListing] = useState(false);

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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Sync header Edit/Cancel button with editing state
  useEffect(() => {
    if (!isOwnPlayer) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => {
            if (isEditing) {
              setIsEditing(false);
              setSaveError(null);
            } else {
              if (!player) return;
              setEditFirstName(player.first_name);
              setEditLastName(player.last_name);
              setEditCountry(player.country);
              setSaveError(null);
              setIsEditing(true);
            }
          }}
        >
          <Text style={{ color: '#1a73e8', fontSize: 16 }}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [isEditing, isOwnPlayer, navigation, player]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updatePlayer(playerId, {
        first_name: editFirstName,
        last_name: editLastName,
        country: editCountry,
      });
      setPlayer(updated);
      setIsEditing(false);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Name + position */}
          <View style={styles.hero}>
            {isEditing ? (
              <View style={styles.nameInputs}>
                <TextInput
                  style={styles.nameInput}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First name"
                  placeholderTextColor="#999"
                  autoCorrect={false}
                />
                <TextInput
                  style={styles.nameInput}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last name"
                  placeholderTextColor="#999"
                  autoCorrect={false}
                />
              </View>
            ) : (
              <Text style={styles.name}>{player.first_name} {player.last_name}</Text>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{POSITION_LABELS[player.position]}</Text>
            </View>
          </View>

          {/* Details card */}
          <View style={styles.card}>
            {isEditing ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Country</Text>
                <TouchableOpacity
                  onPress={() => { setCountrySearch(''); setShowCountryModal(true); }}
                >
                  <Text style={[styles.rowValue, { color: '#1a73e8' }]}>{editCountry} ›</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Row label="Country" value={player.country} />
            )}
            <Row label="Market Value" value={`$${marketValue}M`} />
            <Row label="Age"          value={`${player.age} years — ${player.birth_date}`} />
            <Row label="Goals"        value={player.goals != null ? String(player.goals) : '—'} />
          </View>

          {/* Save button */}
          {isEditing && (
            <>
              {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* Sell / Remove listing */}
          {isOwnPlayer && !isEditing && (
            player.is_listed ? (
              <TouchableOpacity
                style={[styles.removeBtn, removingListing && styles.saveBtnDisabled]}
                disabled={removingListing}
                onPress={async () => {
                  if (!player.active_listing) return;
                  setRemovingListing(true);
                  try {
                    await deleteListing(player.active_listing.id);
                    await load();
                  } finally {
                    setRemovingListing(false);
                  }
                }}
              >
                {removingListing
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Remove Listing</Text>
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => navigation.navigate('CreateTransferOffer', {
                  playerId:    player.id,
                  playerName:  `${player.first_name} ${player.last_name}`,
                  marketValue: player.market_value,
                  country:     player.country,
                  position:    player.position,
                  age:         player.age,
                  birthDate:   player.birth_date,
                })}
              >
                <Text style={styles.saveBtnText}>List for Sale</Text>
              </TouchableOpacity>
            )
          )}

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
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <Modal visible={showCountryModal} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={countrySearch}
            onChangeText={setCountrySearch}
            autoFocus
          />
          <FlatList
            data={filteredCountries}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => {
                  setEditCountry(item);
                  setShowCountryModal(false);
                }}
              >
                <Text style={[
                  styles.countryText,
                  item === editCountry && styles.countryTextSelected,
                ]}>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:   { padding: 20, paddingBottom: 40 },

  hero:      { alignItems: 'center', marginBottom: 20 },
  name:      { fontSize: 24, fontWeight: '800', color: '#111', textAlign: 'center' },
  nameInputs: { width: '100%', gap: 8, marginBottom: 4 },
  nameInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
  },
  badge:     { backgroundColor: '#1a73e8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#111' },

  saveError: { color: '#c00', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  saveBtn:   { backgroundColor: '#1a73e8', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  removeBtn: { backgroundColor: '#c0392b', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

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

  errorText: { color: '#c00', fontSize: 15, marginBottom: 16, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn:  { backgroundColor: '#1a73e8', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },

  modal:       { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle:  { fontSize: 17, fontWeight: '700', color: '#111' },
  modalClose:  { fontSize: 16, color: '#1a73e8' },
  modalSearch: { margin: 12, backgroundColor: '#f4f6f9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111' },
  countryRow:  { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  countryText: { fontSize: 16, color: '#111' },
  countryTextSelected: { color: '#1a73e8', fontWeight: '700' },
});
