require 'rails_helper'

RSpec.describe Player, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:team) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:first_name) }
    it { is_expected.to validate_presence_of(:last_name) }
    it { is_expected.to validate_presence_of(:country) }
    it { is_expected.to validate_presence_of(:position) }
    it { is_expected.to validate_presence_of(:birth_date) }
    it { is_expected.to validate_numericality_of(:market_value).is_greater_than(0) }
    it { is_expected.to validate_inclusion_of(:position).in_array(Player::POSITIONS) }
  end

  describe '#age' do
    it 'returns the correct age in full years' do
      birth_date = Date.new(1990, 1, 1)
      player = build(:player, birth_date: birth_date)
      expected_age = ((Date.today - birth_date) / 365.25).floor
      expect(player.age).to eq(expected_age)
    end
  end
end
