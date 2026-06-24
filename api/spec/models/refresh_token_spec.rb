require 'rails_helper'

RSpec.describe RefreshToken, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:token_digest) }
    it { should validate_presence_of(:expires_at) }
  end

  describe 'associations' do
    it { should belong_to(:user) }
  end

  describe '.active scope' do
    let(:user) { create(:user) }

    it 'includes tokens that are not revoked and not expired' do
      token = create(:refresh_token, user: user, revoked_at: nil, expires_at: 30.days.from_now)
      expect(RefreshToken.active).to include(token)
    end

    it 'excludes revoked tokens' do
      token = create(:refresh_token, user: user, revoked_at: Time.current, expires_at: 30.days.from_now)
      expect(RefreshToken.active).not_to include(token)
    end

    it 'excludes expired tokens' do
      token = create(:refresh_token, user: user, revoked_at: nil, expires_at: 1.day.ago)
      expect(RefreshToken.active).not_to include(token)
    end
  end
end
