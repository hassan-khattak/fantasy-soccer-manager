require 'rails_helper'

RSpec.describe 'GET /api/v1/team', type: :request do
  let(:user)    { create(:user) }
  let!(:team)   { create(:team, user: user) }
  let!(:players) { create_list(:player, 20, team: team) }
  let(:headers) { auth_headers(user) }

  context 'when authenticated' do
    before { get '/api/v1/team', headers: headers, as: :json }

    it 'returns 200' do
      expect(response).to have_http_status(:ok)
    end

    it 'returns the team fields' do
      expect(json).to include('id', 'name', 'country', 'budget', 'team_value')
    end

    it 'returns 20 players' do
      expect(json['players'].length).to eq(20)
    end

    it 'returns all required player fields' do
      player = json['players'].first
      expect(player).to include(
        'id', 'first_name', 'last_name', 'country', 'position',
        'birth_date', 'age', 'market_value', 'goals', 'is_listed', 'active_listing'
      )
    end

    it 'returns correct team_value as sum of player market_values' do
      expected = players.sum(&:market_value).to_s
      expect(json['team_value']).to eq(expected)
    end
  end

  context 'when unauthenticated' do
    it 'returns 401' do
      get '/api/v1/team', as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
