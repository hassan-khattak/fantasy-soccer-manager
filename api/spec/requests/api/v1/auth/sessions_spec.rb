require 'rails_helper'

RSpec.describe 'Auth Sessions', type: :request do
  let!(:user) { create(:user, email: 'test@example.com', password: 'password123') }
  let(:login_params) { { user: { email: 'test@example.com', password: 'password123' } } }

  # ------------------------------------------------------------------ login --
  describe 'POST /api/v1/auth/login' do
    context 'with correct credentials' do
      it 'returns 200 with access_token and refresh_token' do
        post '/api/v1/auth/login', params: login_params, as: :json

        expect(response).to have_http_status(:ok)
        expect(json).to include('access_token', 'refresh_token', 'token_type')
      end
    end

    context 'with wrong password' do
      it 'returns 401' do
        post '/api/v1/auth/login', params: { user: { email: 'test@example.com', password: 'wrong' } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with unknown email' do
      it 'returns 401' do
        post '/api/v1/auth/login', params: { user: { email: 'nobody@example.com', password: 'password123' } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  # --------------------------------------------------------------- refresh --
  describe 'POST /api/v1/auth/refresh' do
    let(:raw_refresh_token) { RefreshTokenService.issue(user) }

    context 'with a valid refresh token' do
      it 'returns 200 with a new access_token and refresh_token' do
        post '/api/v1/auth/refresh', params: { refresh_token: raw_refresh_token }, as: :json

        expect(response).to have_http_status(:ok)
        expect(json).to include('access_token', 'refresh_token')
        expect(json['refresh_token']).not_to eq(raw_refresh_token)
      end

      it 'revokes the old refresh token (reuse returns 401)' do
        post '/api/v1/auth/refresh', params: { refresh_token: raw_refresh_token }, as: :json

        post '/api/v1/auth/refresh', params: { refresh_token: raw_refresh_token }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with an expired refresh token' do
      it 'returns 401' do
        RefreshToken.last.update!(expires_at: 1.day.ago)

        post '/api/v1/auth/refresh', params: { refresh_token: raw_refresh_token }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with an already-revoked refresh token' do
      it 'returns 401' do
        RefreshTokenService.revoke(raw_refresh_token)

        post '/api/v1/auth/refresh', params: { refresh_token: raw_refresh_token }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with a completely unknown token' do
      it 'returns 401' do
        post '/api/v1/auth/refresh', params: { refresh_token: SecureRandom.hex(32) }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  # --------------------------------------------------------------- logout --
  describe 'DELETE /api/v1/auth/logout' do
    let(:raw_refresh_token) { RefreshTokenService.issue(user) }
    let(:access_token)      { user.generate_jwt }

    context 'with a valid access token' do
      it 'returns 200' do
        delete '/api/v1/auth/logout',
               params: { refresh_token: raw_refresh_token },
               headers: { 'Authorization' => "Bearer #{access_token}" },
               as: :json

        expect(response).to have_http_status(:ok)
      end

      it 'revokes the refresh token' do
        delete '/api/v1/auth/logout',
               params: { refresh_token: raw_refresh_token },
               headers: { 'Authorization' => "Bearer #{access_token}" },
               as: :json

        post '/api/v1/auth/refresh', params: { refresh_token: raw_refresh_token }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end

      it 'rotates the jti so the access token is immediately invalid' do
        old_jti = user.jti

        delete '/api/v1/auth/logout',
               params: { refresh_token: raw_refresh_token },
               headers: { 'Authorization' => "Bearer #{access_token}" },
               as: :json

        expect(user.reload.jti).not_to eq(old_jti)
      end
    end

    context 'without an Authorization header' do
      it 'returns 401' do
        delete '/api/v1/auth/logout', params: { refresh_token: raw_refresh_token }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
