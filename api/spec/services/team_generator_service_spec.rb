require 'rails_helper'

RSpec.describe TeamGeneratorService do
  subject(:team) { described_class.call(create(:user)) }

  it 'creates exactly 20 players' do
    expect(team.players.count).to eq(20)
  end

  it 'creates the correct squad composition' do
    counts = team.players.group(:position).count
    expect(counts['GK']).to eq(3)
    expect(counts['DEF']).to eq(6)
    expect(counts['MID']).to eq(6)
    expect(counts['ATT']).to eq(5)
  end

  it 'sets every player market_value to 1_000_000.00' do
    expect(team.players.pluck(:market_value)).to all(eq(1_000_000.00))
  end

  it 'sets every player age between 18 and 40' do
    ages = team.players.map(&:age)
    expect(ages).to all(be_between(18, 40))
  end

  it 'sets team budget between 2_000_000 and 5_000_000' do
    expect(team.budget).to be_between(2_000_000, 5_000_000)
  end

  it 'sets non-empty names and countries on all players' do
    team.players.each do |player|
      expect(player.first_name).to be_present
      expect(player.last_name).to be_present
      expect(player.country).to be_present
    end
  end
end
