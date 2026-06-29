require 'rails_helper'

RSpec.describe 'Transfer Listings', type: :request do
  let(:user)          { create(:user) }
  let(:other_user)    { create(:user) }
  let!(:team)         { create(:team, user: user) }
  let!(:other_team)   { create(:team, user: other_user) }
  let!(:player)       { create(:player, team: team) }
  let!(:other_player) { create(:player, team: other_team) }
  let(:headers)       { auth_headers(user) }

  describe 'GET /api/v1/transfer_listings' do
    let!(:listing) { create(:transfer_listing, player: other_player) }

    it 'returns 200 with data and meta' do
      get '/api/v1/transfer_listings', headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(json).to have_key('data')
      expect(json['meta']).to include('total_count', 'current_page', 'total_pages')
    end

    it 'returns correct listing shape with player is_listed true' do
      get '/api/v1/transfer_listings', headers: headers, as: :json
      item = json['data'].first
      expect(item).to include('id', 'asking_price', 'created_at', 'player', 'team')
      expect(item['player']['is_listed']).to be true
      expect(item['player']['active_listing']).to include('id', 'asking_price')
    end

    it 'does not include inactive listings' do
      create(:transfer_listing, player: player, active: false)
      get '/api/v1/transfer_listings', headers: headers, as: :json
      expect(json['data'].length).to eq(1)
    end

    it 'filters by player_name' do
      get '/api/v1/transfer_listings',
          params: { player_name: other_player.first_name },
          headers: headers
      expect(json['data'].length).to eq(1)
    end

    it 'filters by team_name' do
      get '/api/v1/transfer_listings',
          params: { team_name: other_team.name },
          headers: headers
      expect(json['data'].length).to eq(1)
    end

    it 'filters by min_price — includes listing at or above threshold' do
      get '/api/v1/transfer_listings',
          params: { min_price: 1_000_000 },
          headers: headers
      expect(json['data'].length).to eq(1)
    end

    it 'filters by max_price — excludes listing above threshold' do
      get '/api/v1/transfer_listings',
          params: { max_price: 1_000_000 },
          headers: headers
      expect(json['data'].length).to eq(0)
    end

    it 'returns 401 when unauthenticated' do
      get '/api/v1/transfer_listings', as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'POST /api/v1/transfer_listings' do
    it 'creates a listing for own player and returns 201' do
      post '/api/v1/transfer_listings',
           params: { player_id: player.id, asking_price: 2_000_000 },
           headers: headers, as: :json
      expect(response).to have_http_status(:created)
      expect(json).to include('id', 'asking_price', 'player', 'team')
      expect(player.reload.active_listing).to be_present
    end

    it 'returns 404 when player does not belong to user' do
      post '/api/v1/transfer_listings',
           params: { player_id: other_player.id, asking_price: 2_000_000 },
           headers: headers, as: :json
      expect(response).to have_http_status(:not_found)
    end

    it 'returns 409 when player is already listed' do
      create(:transfer_listing, player: player)
      post '/api/v1/transfer_listings',
           params: { player_id: player.id, asking_price: 1_000_000 },
           headers: headers, as: :json
      expect(response).to have_http_status(:conflict)
    end

    it 'returns 422 with asking_price of 0' do
      post '/api/v1/transfer_listings',
           params: { player_id: player.id, asking_price: 0 },
           headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end

    it 'returns 422 with negative asking_price' do
      post '/api/v1/transfer_listings',
           params: { player_id: player.id, asking_price: -1 },
           headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end

    it 'returns 401 when unauthenticated' do
      post '/api/v1/transfer_listings',
           params: { player_id: player.id, asking_price: 1_000_000 }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'DELETE /api/v1/transfer_listings/:id' do
    let!(:listing)       { create(:transfer_listing, player: player) }
    let!(:other_listing) { create(:transfer_listing, player: other_player) }

    it 'deactivates own listing and returns 200' do
      delete "/api/v1/transfer_listings/#{listing.id}", headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(listing.reload.active).to be false
    end

    it 'returns 404 when listing belongs to another user' do
      delete "/api/v1/transfer_listings/#{other_listing.id}", headers: headers, as: :json
      expect(response).to have_http_status(:not_found)
    end

    it 'returns 401 when unauthenticated' do
      delete "/api/v1/transfer_listings/#{listing.id}", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
