module Api
  module V1
    class PlayersController < ApplicationController
      def show
        @player = Player.includes(:active_listing, transfers: [:from_team, :to_team]).find(params[:id])
      end

      def update
        @player = Player.includes(:active_listing).find(params[:id])
        return render json: { error: 'Forbidden' }, status: :forbidden unless @player.team.user == current_user

        if @player.update(player_params)
          render :show
        else
          render json: { errors: @player.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def player_params
        params.require(:player).permit(:first_name, :last_name, :country)
      end
    end
  end
end
