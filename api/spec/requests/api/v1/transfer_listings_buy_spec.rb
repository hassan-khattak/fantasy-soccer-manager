require 'rails_helper'

RSpec.describe 'POST /api/v1/transfer_listings/:id/buy', type: :request do
  let(:seller)       { create(:user) }
  let(:buyer)        { create(:user) }
  let!(:seller_team) { create(:team, user: seller, budget: 3_000_000) }
  let!(:buyer_team)  { create(:team, user: buyer,  budget: 5_000_000) }
  let!(:player)      { create(:player, team: seller_team, market_value: 1_000_000) }
  let!(:listing)     { create(:transfer_listing, player: player, asking_price: 2_000_000) }
  let(:headers)      { auth_headers(buyer) }

  it 'returns 201 and creates a transfer' do
    post "/api/v1/transfer_listings/#{listing.id}/buy", headers: headers, as: :json
    expect(response).to have_http_status(:created)
    expect(json['message']).to eq('Transfer successful')
    expect(player.reload.team).to eq(buyer_team)
  end

  it 'deducts budget from buyer' do
    post "/api/v1/transfer_listings/#{listing.id}/buy", headers: headers, as: :json
    expect(buyer_team.reload.budget).to eq(3_000_000)
  end

  it 'adds budget to seller' do
    post "/api/v1/transfer_listings/#{listing.id}/buy", headers: headers, as: :json
    expect(seller_team.reload.budget).to eq(5_000_000)
  end

  it 'returns 409 when listing is already inactive' do
    listing.update!(active: false)
    post "/api/v1/transfer_listings/#{listing.id}/buy", headers: headers, as: :json
    expect(response).to have_http_status(:conflict)
    expect(json['error']).to eq('Player has already been sold')
  end

  it 'returns 422 when buyer has insufficient budget' do
    buyer_team.update!(budget: 100)
    post "/api/v1/transfer_listings/#{listing.id}/buy", headers: headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(json['error']).to eq('Insufficient budget')
  end

  it 'returns 403 when buyer tries to buy their own player' do
    own_listing = create(:transfer_listing, player: create(:player, team: buyer_team))
    post "/api/v1/transfer_listings/#{own_listing.id}/buy", headers: headers, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(json['error']).to eq('Cannot buy your own player')
  end

  it 'returns 404 for unknown listing id' do
    post '/api/v1/transfer_listings/999999/buy', headers: headers, as: :json
    expect(response).to have_http_status(:not_found)
  end

  it 'returns 401 when unauthenticated' do
    post "/api/v1/transfer_listings/#{listing.id}/buy", as: :json
    expect(response).to have_http_status(:unauthorized)
  end
end
