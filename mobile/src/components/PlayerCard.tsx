import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Player, POSITION_LABELS } from '../types';

interface Props {
  player: Player;
  onPress: () => void;
}

export default function PlayerCard({ player, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{player.position}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{player.first_name} {player.last_name}</Text>
        <Text style={styles.sub}>{POSITION_LABELS[player.position]} · {player.country}</Text>
      </View>
      <Text style={styles.value}>
        ${(parseFloat(player.market_value) / 1_000_000).toFixed(1)}M
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badge: {
    backgroundColor: '#1a73e8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  sub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a73e8',
  },
});
