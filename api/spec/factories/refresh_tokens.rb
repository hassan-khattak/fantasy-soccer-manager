FactoryBot.define do
  factory :refresh_token do
    association :user
    token_digest { Digest::SHA256.hexdigest(SecureRandom.hex(32)) }
    expires_at   { 30.days.from_now }
    revoked_at   { nil }
  end
end
