import client from './client';
import { Team } from '../types';

export const getTeam = () =>
  client.get<Team>('/team').then(r => r.data);

export const updateTeam = (data: { name?: string; country?: string }) =>
  client.patch<Team>('/team', { team: data }).then(r => r.data);
