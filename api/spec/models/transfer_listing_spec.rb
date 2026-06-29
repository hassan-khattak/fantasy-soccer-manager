require 'rails_helper'

RSpec.describe TransferListing, type: :model do
  let(:user)   { create(:user) }
  let!(:team)  { create(:team, user: user) }
  let(:player) { create(:player, team: team) }

  it 'is valid with a positive asking_price' do
    expect(build(:transfer_listing, player: player)).to be_valid
  end

  it 'is invalid with asking_price of 0' do
    expect(build(:transfer_listing, player: player, asking_price: 0)).not_to be_valid
  end

  it 'is invalid with a negative asking_price' do
    expect(build(:transfer_listing, player: player, asking_price: -1)).not_to be_valid
  end

  it 'is invalid when player already has an active listing' do
    create(:transfer_listing, player: player)
    expect(build(:transfer_listing, player: player)).not_to be_valid
  end

  it 'allows a new listing when the previous one is inactive' do
    create(:transfer_listing, player: player, active: false)
    expect(build(:transfer_listing, player: player)).to be_valid
  end
end
