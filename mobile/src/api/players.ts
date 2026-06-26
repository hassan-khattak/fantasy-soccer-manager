import client from './client';
import { PlayerDetail } from '../types';

export const getPlayer = (id: number) =>
  client.get<PlayerDetail>(`/players/${id}`).then(r => r.data);

export const updatePlayer = (
  id: number,
  data: { first_name?: string; last_name?: string; country?: string },
) => client.patch<PlayerDetail>(`/players/${id}`, { player: data }).then(r => r.data);
