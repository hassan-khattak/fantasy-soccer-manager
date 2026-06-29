import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TransferListing, POSITION_LABELS } from '../types';

interface Props {
  listing: TransferListing;
  onPress?: () => void;
  ownTeamId?: number;
  onBuy?: (listing: TransferListing) => void;
}

export default function TransferOfferCard({ listing, onPress, ownTeamId, onBuy }: Props) {
  const { player, team, asking_price, created_at } = listing;
  const price = (parseFloat(asking_price) / 1_000_000).toFixed(1);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.top}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{player.position}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.name}>{player.first_name} {player.last_name}</Text>
          <Text style={styles.sub}>{POSITION_LABELS[player.position]} · {player.country}</Text>
        </View>
        <Text style={styles.price}>${price}M</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.teamText}>{team.name} · {team.country}</Text>
        <View style={styles.bottomRight}>
          <Text style={styles.dateText}>{created_at.slice(0, 10)}</Text>
          {ownTeamId !== undefined && listing.team.id !== ownTeamId && onBuy && (
            <TouchableOpacity style={styles.buyBtn} onPress={() => onBuy(listing)}>
              <Text style={styles.buyBtnText}>Buy</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#1a73e8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  playerInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  sub:  { fontSize: 13, color: '#666', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700', color: '#1a73e8' },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  bottomRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamText: { fontSize: 13, color: '#555' },
  dateText: { fontSize: 13, color: '#999' },
  buyBtn:     { backgroundColor: '#27ae60', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
