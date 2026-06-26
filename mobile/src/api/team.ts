import client from './client';
import { Team } from '../types';

export const getTeam = () =>
  client.get<Team>('/team').then(r => r.data);
