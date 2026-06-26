require 'rails_helper'

RSpec.describe 'GET /api/v1/players/:id', type: :request do
  let(:user)         { create(:user) }
  let(:other_user)   { create(:user) }
  let!(:own_team)    { create(:team, user: user) }
  let!(:other_team)  { create(:team, user: other_user) }
  let!(:own_player)  { create(:player, team: own_team) }
  let!(:other_player) { create(:player, team: other_team) }
  let(:headers)      { auth_headers(user) }

  context 'for own player' do
    before { get "/api/v1/players/#{own_player.id}", headers: headers, as: :json }

    it 'returns 200' do
      expect(response).to have_http_status(:ok)
    end

    it 'returns all player fields' do
      expect(json).to include(
        'id', 'first_name', 'last_name', 'country', 'position',
        'birth_date', 'age', 'market_value', 'goals', 'is_listed', 'active_listing'
      )
    end

    it 'returns transfers as an empty array' do
      expect(json['transfers']).to eq([])
    end
  end

  context 'for another team\'s player' do
    it 'returns 200 (public info)' do
      get "/api/v1/players/#{other_player.id}", headers: headers, as: :json
      expect(response).to have_http_status(:ok)
    end
  end

  context 'for a non-existent player' do
    it 'returns 404' do
      get '/api/v1/players/99999', headers: headers, as: :json
      expect(response).to have_http_status(:not_found)
    end
  end

  context 'when unauthenticated' do
    it 'returns 401' do
      get "/api/v1/players/#{own_player.id}", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

RSpec.describe 'PATCH /api/v1/players/:id', type: :request do
  let(:user)          { create(:user) }
  let(:other_user)    { create(:user) }
  let!(:own_team)     { create(:team, user: user) }
  let!(:other_team)   { create(:team, user: other_user) }
  let!(:own_player)   { create(:player, team: own_team, position: 'GK', market_value: 1_000_000) }
  let!(:other_player) { create(:player, team: other_team) }
  let(:headers)       { auth_headers(user) }

  context 'owner updates first_name' do
    it 'returns 200 and updates the field' do
      patch "/api/v1/players/#{own_player.id}", params: { player: { first_name: 'Carlos' } }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(own_player.reload.first_name).to eq('Carlos')
    end
  end

  context 'owner updates last_name' do
    it 'returns 200 and updates the field' do
      patch "/api/v1/players/#{own_player.id}", params: { player: { last_name: 'Silva' } }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(own_player.reload.last_name).to eq('Silva')
    end
  end

  context 'owner updates country' do
    it 'returns 200 and updates the field' do
      patch "/api/v1/players/#{own_player.id}", params: { player: { country: 'Brazil' } }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(own_player.reload.country).to eq('Brazil')
    end
  end

  context 'non-owner tries to update' do
    it 'returns 403' do
      patch "/api/v1/players/#{other_player.id}", params: { player: { first_name: 'Hacked' } }, headers: headers, as: :json
      expect(response).to have_http_status(:forbidden)
      expect(other_player.reload.first_name).not_to eq('Hacked')
    end
  end

  context 'attempting to change position or market_value' do
    it 'returns 200 but ignores disallowed fields' do
      patch "/api/v1/players/#{own_player.id}",
            params: { player: { position: 'ATT', market_value: 9_999_999 } },
            headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(own_player.reload.position).to eq('GK')
      expect(own_player.reload.market_value).to eq(1_000_000)
    end
  end

  context 'when unauthenticated' do
    it 'returns 401' do
      patch "/api/v1/players/#{own_player.id}", params: { player: { first_name: 'x' } }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
