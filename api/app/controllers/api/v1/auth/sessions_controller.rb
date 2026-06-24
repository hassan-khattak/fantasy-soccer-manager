module Api
  module V1
    module Auth
      class SessionsController < ApplicationController
        skip_before_action :authenticate_user!, only: %i[create refresh]

        # POST /api/v1/auth/login
        def create
          user = User.find_by(email: params.dig(:user, :email))

          if user&.valid_password?(params.dig(:user, :password))
            access_token  = user.generate_jwt
            refresh_token = RefreshTokenService.issue(user)
            render json: token_response(access_token, refresh_token), status: :ok
          else
            render json: { error: 'Invalid email or password' }, status: :unauthorized
          end
        end

        # POST /api/v1/auth/refresh
        def refresh
          raw_token = params[:refresh_token]
          new_raw   = RefreshTokenService.rotate(raw_token)
          # Re-fetch user from the new refresh token record to generate a fresh JWT
          user      = RefreshToken.find_by(token_digest: RefreshTokenService.send(:digest, new_raw))&.user

          if user
            render json: token_response(user.generate_jwt, new_raw), status: :ok
          else
            render json: { error: 'Invalid refresh token' }, status: :unauthorized
          end
        rescue RefreshTokenService::InvalidToken => e
          render json: { error: e.message }, status: :unauthorized
        end

        # DELETE /api/v1/auth/logout
        def destroy
          raw_token = params[:refresh_token]
          RefreshTokenService.revoke(raw_token) if raw_token.present?

          # Rotate jti to invalidate current access token immediately
          current_user.update!(jti: SecureRandom.uuid)
          render json: { message: 'Logged out successfully' }, status: :ok
        rescue RefreshTokenService::InvalidToken
          # Refresh token already gone — still rotate jti and succeed
          current_user.update!(jti: SecureRandom.uuid)
          render json: { message: 'Logged out successfully' }, status: :ok
        end

        private

        def token_response(access_token, refresh_token)
          { access_token: access_token, refresh_token: refresh_token, token_type: 'Bearer' }
        end
      end
    end
  end
end
