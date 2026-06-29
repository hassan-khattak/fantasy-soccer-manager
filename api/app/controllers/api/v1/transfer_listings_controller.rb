module Api
  module V1
    class TransferListingsController < ApplicationController
      def index
        scope = TransferListing.active
                               .preload(player: [:team, :active_listing])
                               .order('transfer_listings.created_at DESC')

        scope = apply_filters(scope)

        per = [[params[:per_page]&.to_i || 20, 1].max, 100].min
        @listings = scope.page(params[:page]).per(per)
        @meta = {
          total_count:  @listings.total_count,
          current_page: @listings.current_page,
          total_pages:  @listings.total_pages
        }
      end

      def create
        player  = current_user.team.players.find(params[:player_id])
        listing = player.transfer_listings.build(asking_price: params[:asking_price])

        if listing.save
          @listing = TransferListing.includes(player: [:team, :active_listing]).find(listing.id)
          render :show, status: :created
        else
          status = listing.errors[:base].any? { |e| e.include?('already listed') } ? :conflict : :unprocessable_content
          render json: { errors: listing.errors.full_messages }, status: status
        end
      rescue ActiveRecord::RecordNotUnique
        render json: { error: 'Player is already listed for sale' }, status: :conflict
      end

      # POST /api/v1/transfer_listings/:id/buy
      def buy
        TransferService.call(listing_id: params[:id].to_i, buyer: current_user)
        render json: { message: 'Transfer successful' }, status: :created
      rescue TransferService::AlreadySold
        render json: { error: 'Player has already been sold' }, status: :conflict
      rescue TransferService::InsufficientFunds
        render json: { error: 'Insufficient budget' }, status: :unprocessable_content
      rescue TransferService::SelfBuy
        render json: { error: 'Cannot buy your own player' }, status: :forbidden
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Listing not found' }, status: :not_found
      end

      def destroy
        listing = current_user.team.transfer_listings.find(params[:id])
        listing.update!(active: false)
        head :ok
      end

      private

      def apply_filters(scope)
        needs_team_join   = params[:team_name].present? || params[:team_country].present?
        needs_player_join = params[:player_name].present? || params[:player_country].present?

        if needs_team_join
          scope = scope.joins(player: :team)
        elsif needs_player_join
          scope = scope.joins(:player)
        end

        scope = scope.where('players.first_name ILIKE :q OR players.last_name ILIKE :q',
                            q: "%#{params[:player_name]}%")        if params[:player_name].present?
        scope = scope.where('teams.name ILIKE ?', "%#{params[:team_name]}%") if params[:team_name].present?
        scope = scope.where(teams: { country: params[:team_country] })        if params[:team_country].present?
        scope = scope.where(players: { country: params[:player_country] })    if params[:player_country].present?
        scope = scope.where('asking_price >= ?', params[:min_price])          if params[:min_price].present?
        scope = scope.where('asking_price <= ?', params[:max_price])          if params[:max_price].present?

        scope
      end
    end
  end
end
