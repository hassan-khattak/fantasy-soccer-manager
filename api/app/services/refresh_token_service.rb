class RefreshTokenService
  TOKEN_LENGTH  = 32  # 64 hex chars
  TOKEN_TTL     = 30.days

  class InvalidToken < StandardError; end

  def self.issue(user)
    raw = SecureRandom.hex(TOKEN_LENGTH)
    user.refresh_tokens.create!(
      token_digest: digest(raw),
      expires_at:   TOKEN_TTL.from_now
    )
    raw
  end

  def self.rotate(raw_token)
    record = find_active!(raw_token)
    user   = record.user
    record.update!(revoked_at: Time.current)
    issue(user)
  end

  def self.revoke(raw_token)
    record = find_active!(raw_token)
    record.update!(revoked_at: Time.current)
  end

  def self.digest(raw)
    Digest::SHA256.hexdigest(raw)
  end
  private_class_method :digest

  def self.find_active!(raw_token)
    record = RefreshToken.active.find_by(token_digest: digest(raw_token))
    raise InvalidToken, "Invalid or expired refresh token" unless record
    record
  end
  private_class_method :find_active!
end
