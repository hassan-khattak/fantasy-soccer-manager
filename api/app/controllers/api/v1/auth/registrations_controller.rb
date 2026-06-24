module Api
  module V1
    module Auth
      class RegistrationsController < ApplicationController
        skip_before_action :authenticate_user!

        def create
          user = User.new(registration_params)

          if user.save
            access_token   = user.generate_jwt
            refresh_token  = RefreshTokenService.issue(user)
            render json: token_response(access_token, refresh_token), status: :created
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def registration_params
          params.require(:user).permit(:email, :password, :password_confirmation)
        end

        def token_response(access_token, refresh_token)
          { access_token: access_token, refresh_token: refresh_token, token_type: 'Bearer' }
        end
      end
    end
  end
end
