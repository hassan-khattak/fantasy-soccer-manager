require 'rails_helper'

RSpec.describe 'POST /api/v1/auth/register', type: :request do
  let(:valid_params) { { user: { email: 'new@example.com', password: 'password123', password_confirmation: 'password123' } } }

  context 'with valid params' do
    it 'returns 201 with access_token and refresh_token' do
      post '/api/v1/auth/register', params: valid_params, as: :json

      expect(response).to have_http_status(:created)
      expect(json).to include('access_token', 'refresh_token', 'token_type')
    end

    it 'creates a User record' do
      expect {
        post '/api/v1/auth/register', params: valid_params, as: :json
      }.to change(User, :count).by(1)
    end

    it 'creates a Team for the new user' do
      post '/api/v1/auth/register', params: valid_params, as: :json

      expect(User.last.team).to be_present
    end

    it 'creates exactly 20 players for the new team' do
      post '/api/v1/auth/register', params: valid_params, as: :json

      expect(User.last.team.players.count).to eq(20)
    end

    it 'stores a refresh_token record (digest only, not raw)' do
      post '/api/v1/auth/register', params: valid_params, as: :json

      raw = json['refresh_token']
      expect(RefreshToken.where(token_digest: raw)).to be_empty
      expect(RefreshToken.count).to eq(1)
    end
  end

  context 'with a duplicate email' do
    before { create(:user, email: 'new@example.com') }

    it 'returns 422 with an errors key' do
      post '/api/v1/auth/register', params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json).to have_key('errors')
    end
  end

  context 'with missing password' do
    it 'returns 422' do
      post '/api/v1/auth/register', params: { user: { email: 'x@example.com' } }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
