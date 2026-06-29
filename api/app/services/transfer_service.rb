class TransferService
  AlreadySold       = Class.new(StandardError)
  InsufficientFunds = Class.new(StandardError)
  SelfBuy           = Class.new(StandardError)

  def self.call(listing_id:, buyer:)
    new(listing_id: listing_id, buyer: buyer).call
  end

  def initialize(listing_id:, buyer:)
    @listing_id = listing_id
    @buyer      = buyer
  end

  def call
    ApplicationRecord.transaction do
      listing = TransferListing.lock.find(@listing_id)
      raise AlreadySold       unless listing.active?
      raise SelfBuy           if listing.player.team == @buyer.team

      buyer_team  = @buyer.team.lock!
      seller_team = listing.player.team

      raise InsufficientFunds if buyer_team.budget < listing.asking_price

      increase  = rand(10..100) / 100.0
      new_value = (listing.player.market_value * (1 + increase)).round(2)

      listing.player.update!(team_id: buyer_team.id, market_value: new_value)
      buyer_team.update!(budget:  buyer_team.budget  - listing.asking_price)
      seller_team.update!(budget: seller_team.budget + listing.asking_price)
      listing.update!(active: false)

      Transfer.create!(
        player:             listing.player,
        transfer_listing:   listing,
        from_team:          seller_team,
        to_team:            buyer_team,
        price:              listing.asking_price,
        market_value_after: new_value
      )
    end
  end
end
