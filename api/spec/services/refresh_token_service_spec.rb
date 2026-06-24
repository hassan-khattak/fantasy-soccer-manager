require 'rails_helper'

RSpec.describe RefreshTokenService do
  let(:user) { create(:user) }

  describe '.issue' do
    it 'returns a 64-character hex string' do
      raw = RefreshTokenService.issue(user)
      expect(raw).to match(/\A[0-9a-f]{64}\z/)
    end

    it 'stores only the SHA-256 digest, never the raw token' do
      raw = RefreshTokenService.issue(user)
      expect(RefreshToken.where(token_digest: raw)).to be_empty
    end

    it 'creates a refresh_token record expiring in ~30 days' do
      raw = RefreshTokenService.issue(user)
      record = RefreshToken.last
      expect(record.expires_at).to be_within(5.seconds).of(30.days.from_now)
    end

    it 'creates a non-revoked token' do
      RefreshTokenService.issue(user)
      expect(RefreshToken.last.revoked_at).to be_nil
    end
  end

  describe '.rotate' do
    it 'revokes the old token and returns a new raw token' do
      old_raw = RefreshTokenService.issue(user)
      new_raw = RefreshTokenService.rotate(old_raw)

      expect(new_raw).not_to eq(old_raw)
      expect(new_raw).to match(/\A[0-9a-f]{64}\z/)
    end

    it 'marks the old token as revoked' do
      old_raw = RefreshTokenService.issue(user)
      RefreshTokenService.rotate(old_raw)

      old_digest = Digest::SHA256.hexdigest(old_raw)
      old_record = RefreshToken.find_by(token_digest: old_digest)
      expect(old_record.revoked_at).not_to be_nil
    end

    it 'raises InvalidToken when reusing a rotated token' do
      old_raw = RefreshTokenService.issue(user)
      RefreshTokenService.rotate(old_raw)

      expect { RefreshTokenService.rotate(old_raw) }
        .to raise_error(RefreshTokenService::InvalidToken)
    end

    it 'raises InvalidToken for an expired token' do
      raw = RefreshTokenService.issue(user)
      RefreshToken.last.update!(expires_at: 1.day.ago)

      expect { RefreshTokenService.rotate(raw) }
        .to raise_error(RefreshTokenService::InvalidToken)
    end

    it 'raises InvalidToken for an unknown token' do
      expect { RefreshTokenService.rotate(SecureRandom.hex(32)) }
        .to raise_error(RefreshTokenService::InvalidToken)
    end
  end

  describe '.revoke' do
    it 'marks the token as revoked' do
      raw = RefreshTokenService.issue(user)
      RefreshTokenService.revoke(raw)

      digest = Digest::SHA256.hexdigest(raw)
      expect(RefreshToken.find_by(token_digest: digest).revoked_at).not_to be_nil
    end

    it 'raises InvalidToken when revoking an already-revoked token' do
      raw = RefreshTokenService.issue(user)
      RefreshTokenService.revoke(raw)

      expect { RefreshTokenService.revoke(raw) }
        .to raise_error(RefreshTokenService::InvalidToken)
    end

    it 'raises InvalidToken for an unknown token' do
      expect { RefreshTokenService.revoke(SecureRandom.hex(32)) }
        .to raise_error(RefreshTokenService::InvalidToken)
    end
  end
end
