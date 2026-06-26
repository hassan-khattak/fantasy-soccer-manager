module Api
  module V1
    class TeamsController < ApplicationController
      def show
        @team    = current_user.team
        @players = @team.players
      end

      def update
        @team = current_user.team
        if @team.update(team_params)
          @players = @team.players
          render :show
        else
          render json: { errors: @team.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def team_params
        params.require(:team).permit(:name, :country)
      end
    end
  end
end
