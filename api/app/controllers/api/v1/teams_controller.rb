module Api
  module V1
    class TeamsController < ApplicationController
      def show
        @team    = current_user.team
        @players = @team.players
      end
    end
  end
end
