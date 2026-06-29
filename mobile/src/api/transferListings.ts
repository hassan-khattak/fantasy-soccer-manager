import client from './client';
import { TransferListing, TransferListingsResponse } from '../types';

export const getTransferListings = (params?: {
  player_name?: string;
  team_name?: string;
  player_country?: string;
  team_country?: string;
  min_price?: string;
  max_price?: string;
  page?: number;
}) => client.get<TransferListingsResponse>('/transfer_listings', { params }).then(r => r.data);

export const createListing = (playerId: number, askingPrice: string) =>
  client.post<TransferListing>('/transfer_listings', {
    player_id: playerId,
    asking_price: askingPrice,
  }).then(r => r.data);

export const deleteListing = (listingId: number) =>
  client.delete(`/transfer_listings/${listingId}`);

export const buyListing = (listingId: number) =>
  client.post(`/transfer_listings/${listingId}/buy`).then(r => r.data);
