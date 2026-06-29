export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  error?: string;
  errors?: string[];
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  country: string;
  position: 'GK' | 'DEF' | 'MID' | 'ATT';
  birth_date: string;
  age: number;
  market_value: string;
  goals: number | null;
  is_listed: boolean;
  active_listing: { id: number; asking_price: string } | null;
}

export interface Team {
  id: number;
  name: string;
  country: string;
  budget: string;
  team_value: string;
  players: Player[];
}

export interface Transfer {
  id: number;
  from_team: { id: number; name: string; country: string };
  to_team: { id: number; name: string; country: string };
  price: string;
  market_value_after: string;
  created_at: string;
}

export interface PlayerDetail extends Player {
  transfers: Transfer[];
}

export interface TransferListing {
  id: number;
  asking_price: string;
  created_at: string;
  player: Player;
  team: { id: number; name: string; country: string };
}

export interface TransferListingsResponse {
  data: TransferListing[];
  meta: { total_count: number; current_page: number; total_pages: number };
}

export const POSITION_LABELS: Record<Player['position'], string> = {
  GK:  'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  ATT: 'Attacker',
};

export interface FilterState {
  team_name: string;
  min_price: string;
  max_price: string;
  team_country: string;
  player_country: string;
}

export const DEFAULT_FILTERS: FilterState = {
  team_name:      '',
  min_price:      '',
  max_price:      '',
  team_country:   '',
  player_country: '',
};

export const COUNTRIES: string[] = [
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil',
  'Canada', 'Chile', 'China', 'Colombia', 'Croatia',
  'Czech Republic', 'Denmark', 'Egypt', 'England', 'Finland',
  'France', 'Germany', 'Ghana', 'Greece', 'Hungary',
  'India', 'Iran', 'Ireland', 'Italy', 'Japan',
  'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria',
  'Norway', 'Poland', 'Portugal', 'Romania', 'Russia',
  'Saudi Arabia', 'Scotland', 'Senegal', 'Serbia', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Tunisia', 'Turkey',
  'Ukraine', 'United States', 'Uruguay', 'Venezuela', 'Wales',
];
