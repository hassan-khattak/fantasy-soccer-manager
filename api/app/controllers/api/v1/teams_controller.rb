module Api
  module V1
    class TeamsController < ApplicationController
      before_action :set_team

      def show
        load_players
      end

      def update
        if @team.update(team_params)
          load_players
          render :show
        else
          render json: { errors: @team.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def load_players
        @players    = @team.players.includes(:active_listing).load
        @team_value = @players.sum(&:market_value)
      end

      def set_team
        @team = current_user.team
        render json: { error: 'Not found' }, status: :not_found unless @team
      end

      def team_params
        params.require(:team).permit(:name, :country)
      end
    end
  end
end
