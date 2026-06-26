module Api
  module V1
    class TeamsController < ApplicationController
      before_action :set_team

      def show
        @players = @team.players
      end

      def update
        if @team.update(team_params)
          @players = @team.players
          render :show
        else
          render json: { errors: @team.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

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
