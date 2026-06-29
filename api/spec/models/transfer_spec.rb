require 'rails_helper'

RSpec.describe Transfer, type: :model do
  it 'belongs to player, transfer_listing, from_team, and to_team' do
    transfer = build(:transfer)
    expect(transfer).to be_valid
    expect(transfer.player).to        be_present
    expect(transfer.transfer_listing).to be_present
    expect(transfer.from_team).to     be_present
    expect(transfer.to_team).to       be_present
  end
end
