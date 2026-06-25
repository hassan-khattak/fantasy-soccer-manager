require 'rails_helper'

RSpec.describe Team, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:players).dependent(:destroy) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:country) }
    it { is_expected.to validate_numericality_of(:budget).is_greater_than_or_equal_to(0) }
  end
end
