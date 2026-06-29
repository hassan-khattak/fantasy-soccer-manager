require 'rails_helper'

RSpec.describe TransferService, type: :service do
  let(:seller)      { create(:user) }
  let(:buyer)       { create(:user) }
  let!(:seller_team) { create(:team, user: seller, budget: 3_000_000) }
  let!(:buyer_team)  { create(:team, user: buyer,  budget: 5_000_000) }
  let!(:player)     { create(:player, team: seller_team, market_value: 1_000_000) }
  let!(:listing)    { create(:transfer_listing, player: player, asking_price: 2_000_000) }

  describe 'successful transfer' do
    subject(:transfer) { TransferService.call(listing_id: listing.id, buyer: buyer) }

    it 'returns a Transfer record' do
      expect(transfer).to be_a(Transfer)
    end

    it 'moves the player to the buyer team' do
      transfer
      expect(player.reload.team).to eq(buyer_team)
    end

    it 'deducts asking_price from buyer budget' do
      transfer
      expect(buyer_team.reload.budget).to eq(3_000_000)  # 5_000_000 - 2_000_000
    end

    it 'adds asking_price to seller budget' do
      transfer
      expect(seller_team.reload.budget).to eq(5_000_000)  # 3_000_000 + 2_000_000
    end

    it 'increases market_value by at least 10%' do
      transfer
      expect(player.reload.market_value).to be >= 1_100_000
    end

    it 'increases market_value by at most 100%' do
      transfer
      expect(player.reload.market_value).to be <= 2_000_000
    end

    it 'deactivates the listing' do
      transfer
      expect(listing.reload.active).to be false
    end

    it 'creates a Transfer record with correct from/to teams' do
      transfer
      t = Transfer.last
      expect(t.from_team).to eq(seller_team)
      expect(t.to_team).to   eq(buyer_team)
      expect(t.price).to     eq(listing.asking_price)
    end

    it 'sets market_value_after on the Transfer record' do
      transfer
      expect(Transfer.last.market_value_after).to eq(player.reload.market_value)
    end
  end

  describe 'failure paths — all rolled back' do
    it 'raises InsufficientFunds when budget < asking_price' do
      buyer_team.update!(budget: 500_000)
      expect {
        TransferService.call(listing_id: listing.id, buyer: buyer)
      }.to raise_error(TransferService::InsufficientFunds)
      expect(player.reload.team).to eq(seller_team)  # no change
    end

    it 'raises AlreadySold when listing is inactive' do
      listing.update!(active: false)
      expect {
        TransferService.call(listing_id: listing.id, buyer: buyer)
      }.to raise_error(TransferService::AlreadySold)
    end

    it 'raises SelfBuy when buyer owns the player' do
      expect {
        TransferService.call(listing_id: listing.id, buyer: seller)
      }.to raise_error(TransferService::SelfBuy)
      expect(listing.reload.active).to be true  # not deactivated
    end

    it 'raises ActiveRecord::RecordNotFound for unknown listing_id' do
      expect {
        TransferService.call(listing_id: 999_999, buyer: buyer)
      }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe 'race condition', :truncation do
    let(:other_buyer)      { create(:user) }
    let!(:other_buyer_team) { create(:team, user: other_buyer, budget: 5_000_000) }

    it 'allows exactly one purchase when two buyers compete simultaneously' do
      outcomes = []
      mutex    = Mutex.new

      threads = [
        Thread.new { result = begin
          TransferService.call(listing_id: listing.id, buyer: buyer)
          :ok
        rescue TransferService::AlreadySold
          :already_sold
        end; mutex.synchronize { outcomes << result } },

        Thread.new { result = begin
          TransferService.call(listing_id: listing.id, buyer: other_buyer)
          :ok
        rescue TransferService::AlreadySold
          :already_sold
        end; mutex.synchronize { outcomes << result } }
      ]
      threads.each(&:join)

      expect(outcomes.count(:ok)).to          eq(1)
      expect(outcomes.count(:already_sold)).to eq(1)
      expect(listing.reload.active).to         be false
      total_buyer_budgets = buyer_team.reload.budget + other_buyer_team.reload.budget
      expect(total_buyer_budgets).to eq(10_000_000 - listing.asking_price)
    end
  end
end
