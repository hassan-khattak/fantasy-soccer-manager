import client from './client';
import { PlayerDetail } from '../types';

export const getPlayer = (id: number) =>
  client.get<PlayerDetail>(`/players/${id}`).then(r => r.data);
