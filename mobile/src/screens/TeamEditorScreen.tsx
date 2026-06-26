import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, FlatList,
  ActivityIndicator, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TeamStackParamList } from '../navigation/AppNavigator';
import { updateTeam } from '../api/team';
import { COUNTRIES } from '../types';

type Props = {
  navigation: StackNavigationProp<TeamStackParamList, 'TeamEditor'>;
  route: RouteProp<TeamStackParamList, 'TeamEditor'>;
};

export default function TeamEditorScreen({ navigation, route }: Props) {
  const [name, setName]                       = useState(route.params.teamName);
  const [country, setCountry]                 = useState(route.params.teamCountry);
  const [countrySearch, setCountrySearch]     = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be blank.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateTeam({ name: name.trim(), country });
      navigation.goBack();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.label}>Team Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Team name"
            placeholderTextColor="#999"
            autoCorrect={false}
          />

          <Text style={styles.label}>Country</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => { setCountrySearch(''); setShowCountryModal(true); }}
          >
            <Text style={styles.selectorText}>{country}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
                  setCountry(item);
                  setShowCountryModal(false);
                }}
              >
                <Text style={[
                  styles.countryText,
                  item === country && styles.countryTextSelected,
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  inner:     { padding: 20 },
  label:     { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selector: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: { fontSize: 16, color: '#111' },
  chevron:      { fontSize: 20, color: '#999' },
  errorText:    { color: '#c00', fontSize: 14, marginTop: 12 },
  saveBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

  modal:       { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle:  { fontSize: 17, fontWeight: '700', color: '#111' },
  modalClose:  { fontSize: 16, color: '#1a73e8' },
  modalSearch: {
    margin: 12,
    backgroundColor: '#f4f6f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  countryRow:  { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  countryText: { fontSize: 16, color: '#111' },
  countryTextSelected: { color: '#1a73e8', fontWeight: '700' },
});
